from __future__ import annotations
import doit.bundle.codebook as cb
import doit.bundle.bundle as bundle
import typing as t
import polars as pl

from doit.common import ImmutableBaseModel

from doit.bundle.spec import (
    RenderedBundleSpec,
)

RenderedBundleSpec.model_rebuild()


#############################
# HtmlReportObject
#############################


class TextStats(ImmutableBaseModel):
    stype: t.Literal["text"]


class CodedItemStat(ImmutableBaseModel):
    label: str
    value: int
    text: str
    count: int
    pct: float


class CodedStats(ImmutableBaseModel):
    stype: t.Literal["categorical", "ordinal", "multiselect"]
    items: t.Sequence[CodedItemStat]


class NumericFreqItem(ImmutableBaseModel):
    min: float
    max: float
    count: int


class NumericStats(ImmutableBaseModel):
    stype: t.Literal["integer", "real"]
    min: float
    max: float
    mean: float
    sd: float
    freqs: t.Sequence[NumericFreqItem]


VariableStats = TextStats | CodedStats | NumericStats


class MissingnessItem(ImmutableBaseModel):
    label: str
    count: int
    pct: float


class SummaryTableRow(ImmutableBaseModel):
    id: int
    name: str
    type: str
    description: str
    num_valid: int
    num_missing: int
    group: str
    stats: VariableStats
    missingness: t.Sequence[MissingnessItem]


class HtmlReportObject(ImmutableBaseModel):
    bundle: RenderedBundleSpec
    tabledata: t.Sequence[SummaryTableRow]

    @staticmethod
    def encode(rendered_bundle: bundle.RenderedBundle):
        return HtmlReportObject(
            bundle=RenderedBundleSpec.encode(rendered_bundle),
            tabledata=build_summary_rows(
                rendered_bundle.columns, rendered_bundle.dataset.collect()
            ),
        )


def calc_missingness(col: bundle.ExportedColumn, df: pl.DataFrame) -> t.Sequence[MissingnessItem]:
    column_name = col.name.as_str()
    coded_stats = df.select(
        pl.col(column_name).fill_null(pl.lit("VALID")).alias("label")
    ).groupby("label").agg(
        pl.col("label").count().alias("count")
    ).to_dicts()

    n = df.height

    return sorted([
        MissingnessItem(
            label=i["label"],
            count=i["count"],
            pct=i["count"]/n,
        ) for i in coded_stats
    ], key=lambda i: "" if i.label == "VALID" else i.label)


def calc_variable_stats(col: bundle.ExportedColumn, df: pl.DataFrame) -> VariableStats:
    column_name = col.name.as_str()
    variable_type = col.variable.type
    stype = variable_type.stype
    match stype:
        case "text":
            return TextStats(stype="text")
        case "ordinal" | "categorical" | "multiselect":
            assert isinstance(variable_type, cb.CodedVariableType)

            col_expr = pl.col(column_name).explode(
            ) if stype == "multiselect" else pl.col(column_name)

            coded_stats = df.select(col_expr.alias("label")).groupby("label").agg(
                pl.col("label").count().alias("count")
            ).to_dicts()

            count_dict: t.Mapping[str, int] = {
                i["label"]: i["count"] for i in coded_stats
            }

            n = df.filter(pl.col(column_name).is_not_null()).height

            return CodedStats(
                stype=stype,
                items=[
                    CodedItemStat(
                        label=i.label,
                        value=i.value,
                        text=i.text,
                        count=count_dict.get(i.label, 0),
                        pct=count_dict.get(i.label, 0) /
                        n if n else float('nan'),
                    ) for i in variable_type.codes.items
                ]
            )
        case "integer" | "real":
            numeric_stats: t.Mapping[str, int] = df.select([
                pl.col(column_name).min().alias("min"),
                pl.col(column_name).max().alias("max"),
                pl.col(column_name).mean().alias("mean"),
                pl.col(column_name).std().alias("sd"),
            ]).to_dicts()[0]

            n_bins = 10

            bin_width = (numeric_stats["max"] - numeric_stats["min"]) / n_bins

            cutpoints = [
                numeric_stats["min"] + i * bin_width for i in range(1, n_bins)
            ]

            cutpoint_label_min = [
                str(numeric_stats["min"] + i * bin_width) for i in range(n_bins)
            ]

            cutpoint_label_max = [
                numeric_stats["min"] + i * bin_width for i in range(1, n_bins + 1)
            ]

            freq_stats_raw = df.select(pl.col(column_name).cut(cutpoints, cutpoint_label_min).alias("min")).groupby("min").agg(
                pl.col("min").count().alias("count")
            ).to_dicts()

            freq_stats_lookup = {
                i["min"]: i["count"] for i in freq_stats_raw
            }

            freq_stats = [
                NumericFreqItem(
                    min=float(str_min),
                    max=max,
                    count=freq_stats_lookup.get(str_min, 0),
                ) for str_min, max in zip(cutpoint_label_min, cutpoint_label_max)
            ]

            return NumericStats(
                stype=stype,
                min=numeric_stats["min"],
                max=numeric_stats["max"],
                mean=numeric_stats["mean"],
                sd=numeric_stats["sd"],
                freqs=freq_stats,
            )


def build_summary_rows(columns: t.Sequence[bundle.ExportedColumn], df: pl.DataFrame) -> t.Sequence[SummaryTableRow]:
    import doit.structframe as sf
    n_rows = df.height

    df_values = df.select([
        sf.unwrap(i, 'value') for i in df.columns
    ])

    df_missing = df.select([
        sf.unwrap(i, 'missing_reason') for i in df.columns
    ])

    num_missing: t.Mapping[str, int] = df_values.null_count().to_dicts()[0]

    num_valid = {k: n_rows - i for k, i in num_missing.items()}

    def _inner(col: bundle.ExportedColumn, id: int):
        if isinstance(col.variable.type, cb.CodedVariableType) and col.variable.type.codes.name:
            display_type = col.variable.type.codes.name
        else:
            display_type = col.variable.type.stype

        return SummaryTableRow(
            id=id,
            name=col.name.as_str(),
            type=display_type,
            description=col.variable.description,
            num_valid=num_valid[col.name.as_str()],
            num_missing=num_missing[col.name.as_str()],
            group=col.name.root.split("_")[0],
            stats=calc_variable_stats(col, df_values),
            missingness=calc_missingness(col, df_missing),
        )

    return [_inner(col, i) for i, col in enumerate(columns)]
