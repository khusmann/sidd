import { match } from "ts-pattern";

import * as dfd from "danfojs";

import type * as m from "./model";

let idCounter = 0;

export type Variable<T extends VariableStats> = {
  id: number;
  name: string;
  description: string;
  type: string;
  num_valid: number;
  num_missing: number;
  group: string;
  stats: T;
  missingness: MissingnessStats[];
};

export type TextVariableStats = {
  stype: "text";
};

export type CategoricalVariableItemStats = {
  label: string;
  value: number;
  text: string;
  count: number;
  pct: number;
};

export type CategoricalStringVariableItemStats = {
  label: string;
  text: string;
  count: number;
  pct: number;
};

export type CategoricalVariableStats = {
  stype: "categorical";
  items: CategoricalVariableItemStats[];
};

export type CategoricalStringVariableStats = {
  stype: "categorical_string";
  items: CategoricalStringVariableItemStats[];
};

export type ContinousVariableFreqItem = {
  min: number;
  max: number;
  count: number;
};

export type ContinuousVariableStats = {
  stype: "real";
  min: number;
  max: number;
  mean: number;
  sd: number;
  freqs: ContinousVariableFreqItem[];
};

export type VariableStats =
  | TextVariableStats
  | CategoricalVariableStats
  | CategoricalStringVariableStats
  | ContinuousVariableStats;

export type MissingnessStats = {
  label: string;
  count: number;
  pct: number;
};

export type TableSubsetStats = {
  name: string;
  label: string;
  fields: Array<Variable<VariableStats>>;
};

export type TableStats = {
  name: string;
  description: string;
  subsets: TableSubsetStats[];
};

export type PackageStats = {
  name: string;
  description: string;
  version: string;
  tables: TableStats[];
};

const maskMatching = (col: dfd.Series, values: string[]) =>
  col.values.map((v) => typeof v === "string" && values.includes(v));

const removeMatching = (col: dfd.Series, values: string[]) =>
  col.iloc(maskMatching(col, values).map((i) => !i));

const stringStats = (
  v: m.Field<m.StringFieldType>,
  data: dfd.DataFrame,
  globalMissingValues: string[]
): TextVariableStats => ({
  stype: "text",
});

const enumStringStats = (
  v: m.Field<m.EnumStringFieldType>,
  data: dfd.DataFrame,
  globalMissingValues: string[]
): CategoricalStringVariableStats => {
  const validValues = removeMatching(
    data.column(v.name),
    v.missingValues ?? globalMissingValues
  );

  const n = validValues.shape[0];
  const counts = validValues.valueCounts();

  const itemStats = v.fieldType.levels.map((l, idx) => {
    const count = Number(counts.at(l) ?? 0);
    return {
      label: l,
      text: l,
      count,
      pct: count / n,
    };
  });

  return {
    stype: "categorical_string",
    items: itemStats,
  };
};

const enumIntegerStats = (
  v: m.Field<m.EnumIntegerFieldType>,
  data: dfd.DataFrame,
  globalMissingValues: string[]
): CategoricalVariableStats => {
  const validValues = removeMatching(
    data.column(v.name),
    v.missingValues ?? globalMissingValues
  );

  const n = validValues.shape[0];

  const itemStats = v.fieldType.levels.map((l) => {
    const count = validValues
      .asType("string")
      .str.search(`^${l.value}$`)
      .ne(-1)
      .sum();
    return {
      label: l.label ?? l.value.toString(),
      value: parseInt(l.value.toString()),
      text: l.label ?? l.value.toString(),
      count,
      pct: count / n,
    };
  });

  return {
    stype: "categorical",
    items: itemStats,
  };
};

const integerStats = (
  v: m.Field<m.IntegerFieldType>,
  data: dfd.DataFrame,
  globalMissingValues: string[]
): ContinuousVariableStats => {
  const validValues = removeMatching(
    data.column(v.name),
    v.missingValues ?? globalMissingValues
  ).asType("float32");

  if (validValues.shape[0] === 0) {
    return {
      stype: "real",
      min: 0,
      max: 0,
      mean: 0,
      sd: 0,
      freqs: [],
    };
  }

  const nBins = 10;

  const min = validValues.min();
  const max = validValues.max();

  const range = max - min;

  const binSize = range / nBins;

  const cutpoints = [...new Array(nBins)].map((_, idx) => ({
    min: min + idx * binSize,
    max: min + (idx + 1) * binSize,
  }));

  const freqs = cutpoints.map((c, idx): ContinousVariableFreqItem => {
    const isFinalIdx = idx === nBins - 1;
    const count = validValues
      .ge(c.min)
      .and(validValues.lt(c.max + (isFinalIdx ? Number.MIN_VALUE : 0)))
      .sum();

    return {
      min: c.min,
      max: c.max,
      count,
    };
  });

  return {
    stype: "real",
    min,
    max,
    mean: validValues.mean(),
    sd: validValues.std(),
    freqs,
  };
};

const numberStats = (
  v: m.Field<m.NumberFieldType>,
  data: dfd.DataFrame,
  globalMissingValues: string[]
): ContinuousVariableStats => {
  const validValues = removeMatching(
    data.column(v.name),
    v.missingValues ?? globalMissingValues
  ).asType("float32");

  if (validValues.shape[0] === 0) {
    return {
      stype: "real",
      min: 0,
      max: 0,
      mean: 0,
      sd: 0,
      freqs: [],
    };
  }

  const nBins = 10;

  const min = validValues.min();
  const max = validValues.max();

  const range = max - min;

  const binSize = range / nBins;

  const cutpoints = [...new Array(nBins)].map((_, idx) => ({
    min: min + idx * binSize,
    max: min + (idx + 1) * binSize,
  }));

  const freqs = cutpoints.map((c, idx): ContinousVariableFreqItem => {
    const isFinalIdx = idx === nBins - 1;
    const count = validValues
      .ge(c.min)
      .and(validValues.lt(c.max + (isFinalIdx ? Number.MIN_VALUE : 0)))
      .sum();

    return {
      min: c.min,
      max: c.max,
      count,
    };
  });

  return {
    stype: "real",
    min,
    max,
    mean: validValues.mean(),
    sd: validValues.std(),
    freqs,
  };
};

const variableTypeStats = (
  v: m.AnyField,
  data: dfd.DataFrame,
  globalMissingValues: string[]
): VariableStats =>
  match(v)
    .with({ fieldType: { type: "string" } }, (v) =>
      stringStats(v, data, globalMissingValues)
    )
    .with({ fieldType: { type: "enum_string" } }, (v) =>
      enumStringStats(v, data, globalMissingValues)
    )
    .with({ fieldType: { type: "enum_integer" } }, (v) =>
      enumIntegerStats(v, data, globalMissingValues)
    )
    .with({ fieldType: { type: "integer" } }, (v) =>
      integerStats(v, data, globalMissingValues)
    )
    .with({ fieldType: { type: "number" } }, (v) =>
      numberStats(v, data, globalMissingValues)
    )
    .exhaustive();

const variableTypeName = (v: m.AnyField): string =>
  match(v)
    .with({ fieldType: { type: "string" } }, () => "text")
    .with(
      { fieldType: { type: "enum_string", ordered: false } },
      () => "categorical"
    )
    .with(
      { fieldType: { type: "enum_string", ordered: true } },
      () => "ordinal"
    )
    .with({ fieldType: { type: "enum_string" } }, () => "categorical")
    .with(
      { fieldType: { type: "enum_integer", ordered: false } },
      () => "categorical"
    )
    .with(
      { fieldType: { type: "enum_integer", ordered: true } },
      () => "ordinal"
    )
    .with({ fieldType: { type: "enum_integer" } }, () => "categorical")
    .with({ fieldType: { type: "integer" } }, () => "integer")
    .with({ fieldType: { type: "number" } }, () => "real")
    .exhaustive();

const missingnessStats = (
  v: m.AnyField,
  data: dfd.DataFrame,
  globalMissingValues: string[]
): MissingnessStats[] => {
  const missingValues = v.missingValues ?? globalMissingValues;
  const values = data.column(v.name).loc(
    data
      .column(v.name)
      .asType("string")
      .str.search(missingValues.map((s) => `^${s}$`).join("|"))
      .ne(-1) as unknown as boolean[]
  );

  const n = values.shape[0];

  return missingValues.map((l) => {
    const count = values.asType("string").str.search(`^${l}$`).ne(-1).sum();
    return {
      label: l,
      count,
      pct: count / n,
    };
  });
};

const variableStats = (
  v: m.AnyField,
  data: dfd.DataFrame,
  globalMissingValues: string[],
  primaryKey: string[]
): Variable<VariableStats> => {
  const name = v.name;
  const groups = name.split("_");
  const missingValues = v.missingValues ?? globalMissingValues;

  const nMissing = maskMatching(data.column(name), missingValues).reduce(
    (a, b) => a + Number(b),
    0
  );

  const nValid = data.shape[0] - nMissing;

  const currGroup = primaryKey.includes(v.name) ? "Primary Key" : groups[0];

  return {
    id: idCounter++,
    name,
    description: v.description ?? "(No description)",
    type: variableTypeName(v),
    num_valid: nValid,
    num_missing: nMissing,
    group: currGroup,
    stats: variableTypeStats(v, data, globalMissingValues),
    missingness: missingnessStats(v, data, globalMissingValues),
  };
};

const getFilterLevels = (
  fields: m.AnyField[],
  globalMissingValues: string[],
  filterVariable?: string
) => {
  if (filterVariable === undefined) {
    return [];
  }

  const filterField = fields.find((f) => f.name === filterVariable);

  if (filterField === undefined) {
    return [];
  }

  const missingValues = filterField.missingValues ?? globalMissingValues;

  if (filterField.fieldType.type === "enum_string") {
    const realValues = filterField.fieldType.levels.filter(
      (l) => !missingValues.includes(l)
    );

    return realValues.map((l) => ({
      filterVariable,
      filterValue: l,
      filterLabel: l,
    }));
  }

  if (filterField.fieldType.type === "enum_integer") {
    const realValues = filterField.fieldType.levels.filter(
      (l) => !missingValues.includes(l.value.toString())
    );
    return realValues.map((l) => ({
      filterVariable,
      filterValue: l.value.toString(),
      filterLabel: l.label ?? l.value.toString(),
    }));
  }

  return [];
};

const tableStats = (r: m.TableResource): TableStats => {
  const tab = new dfd.DataFrame(r.data);
  const filterLevels = getFilterLevels(
    r.fields,
    r.missingValues ?? [],
    r.filterVariable
  );

  return {
    name: r.name,
    description: r.description ?? "(No description)",
    subsets: [
      {
        name: "all",
        label: "all",
        fields: r.fields.map((f) =>
          variableStats(f, tab, r.missingValues ?? [], r.primaryKey ?? [])
        ),
      },
      ...filterLevels.map((l) => ({
        name: l.filterValue,
        label: l.filterLabel,
        fields: r.fields.map((f) =>
          variableStats(
            f,
            tab
              .loc({
                rows: tab
                  .column(l.filterVariable)
                  .asType("string")
                  .str.search(`^${l.filterValue}$`)
                  .ne(-1),
              })
              .resetIndex(),
            r.missingValues ?? [],
            r.primaryKey ?? []
          )
        ),
      })),
    ],
  };
};

const packageStats = (p: m.Package): PackageStats => ({
  name: p.name,
  version: p.version ?? "(No version)",
  description: p.description ?? "(No description)",
  tables: p.resources.map((r) => tableStats(r)),
});

export { packageStats };
