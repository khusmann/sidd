import type {
  Variable,
  TextVariableStats,
  ContinuousVariableStats,
  CategoricalVariableStats,
  VariableStats,
  ContinousVariableFreqItem,
  MissingnessStats,
} from "./types";

import { match } from "ts-pattern";

import type * as dfdt from "danfojs";

import type * as m from "./synth/model";

import * as synth from "./synth/generator";

let idCounter = 0;

const fakeDescriptions = [
  "This is a short variable description",
  "This is a long variable description. This is a long variable description. This is a long variable description. This is a long variable description.",
];

function getRandom(array: string[]) {
  return array[Math.floor(Math.random() * array.length)];
}

function fakeTextVariable(name: string): Variable<TextVariableStats> {
  const groups = name.split("_");
  return {
    id: idCounter++,
    name,
    description: getRandom(fakeDescriptions),
    type: "text",
    num_valid: 100,
    num_missing: 20,
    group: groups[0],
    stats: {
      stype: "text",
    },
    missingness: [
      {
        label: "UNKNOWN_MISSING_REASON",
        count: 100,
        pct: 0.5,
      },
      {
        label: "ITEM_NOT_DISPLAYED",
        count: 20,
        pct: 0.1,
      },
    ],
  };
}

function fakeCategoricalVariable(
  name: string
): Variable<CategoricalVariableStats> {
  const groups = name.split("_");
  return {
    id: idCounter++,
    name,
    description: getRandom(fakeDescriptions),
    type: "categorical",
    num_valid: 100,
    num_missing: 20,
    group: groups[0],
    missingness: [
      {
        label: "UNKNOWN_MISSING_REASON",
        count: 100,
        pct: 0.1,
      },
      {
        label: "ITEM_NOT_DISPLAYED",
        count: 20,
        pct: 0.1,
      },
    ],
    stats: {
      stype: "categorical",
      items: [
        {
          label: "MALE",
          value: 0,
          text: "Male",
          count: 100,
          pct: 0.1,
        },
        {
          label: "FEMALE",
          value: 1,
          text: "Female",
          count: 200,
          pct: 0.1,
        },
        {
          label: "TRANSGENDER",
          value: 2,
          text: "Transgender",
          count: 20,
          pct: 0.1,
        },
        {
          label: "PREFER_NO_ANSWER",
          value: 3,
          text: "Prefer not to answer",
          count: 1,
          pct: 0.1,
        },
      ],
    },
  };
}

function fakeContinuousVariable(
  name: string
): Variable<ContinuousVariableStats> {
  const groups = name.split("_");
  return {
    id: idCounter++,
    name,
    description: getRandom(fakeDescriptions),
    type: "real",
    num_valid: 100,
    num_missing: 20,
    group: groups[0],
    missingness: [
      {
        label: "UNKNOWN_MISSING_REASON",
        count: 100,
        pct: 0.1,
      },
      {
        label: "ITEM_NOT_DISPLAYED",
        count: 20,
        pct: 0.1,
      },
    ],
    stats: {
      stype: "real",
      min: 0,
      max: 100,
      mean: 50,
      sd: 10,
      freqs: [
        {
          min: 0,
          max: 10,
          count: 1,
        },
        {
          min: 10,
          max: 20,
          count: 2,
        },
        {
          min: 20,
          max: 30,
          count: 3,
        },
        {
          min: 30,
          max: 40,
          count: 4,
        },
        {
          min: 40,
          max: 50,
          count: 5,
        },
        {
          min: 50,
          max: 60,
          count: 6,
        },
        {
          min: 60,
          max: 70,
          count: 5,
        },
        {
          min: 70,
          max: 80,
          count: 4,
        },
        {
          min: 80,
          max: 90,
          count: 9,
        },
        {
          min: 90,
          max: 100,
          count: 10,
        },
      ],
    },
  };
}

const maskMatching = (col: dfdt.Series, values: string[]) =>
  col.values.map((v) => typeof v === "string" && values.includes(v));

const removeMatching = (col: dfdt.Series, values: string[]) =>
  col.iloc(maskMatching(col, values).map((i) => !i));

const stringStats = (
  v: m.Field<m.StringFieldType>,
  data: dfdt.DataFrame,
  globalMissingValues: string[]
): TextVariableStats => ({
  stype: "text",
});

const enumStringStats = (
  v: m.Field<m.EnumStringFieldType>,
  data: dfdt.DataFrame,
  globalMissingValues: string[]
): CategoricalVariableStats => {
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
      value: idx,
      text: l,
      count,
      pct: count / n,
    };
  });

  return {
    stype: "categorical",
    items: itemStats,
  };
};

const enumIntegerStats = (
  v: m.Field<m.EnumIntegerFieldType>,
  data: dfdt.DataFrame,
  globalMissingValues: string[]
): CategoricalVariableStats => {
  const validValues = removeMatching(
    data.column(v.name),
    v.missingValues ?? globalMissingValues
  );

  const n = validValues.shape[0];

  const itemStats = v.fieldType.levels.map((l, idx) => {
    const count = validValues
      .asType("string")
      .str.search(`^${l.value}$`)
      .ne(-1)
      .sum();
    return {
      label: l.label ?? l.value.toString(),
      value: idx,
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
  data: dfdt.DataFrame,
  globalMissingValues: string[]
): ContinuousVariableStats => {
  const validValues = removeMatching(
    data.column(v.name),
    v.missingValues ?? globalMissingValues
  ).asType("float32");

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
  data: dfdt.DataFrame,
  globalMissingValues: string[]
): ContinuousVariableStats => {
  const validValues = removeMatching(
    data.column(v.name),
    v.missingValues ?? globalMissingValues
  ).asType("float32");

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
  data: dfdt.DataFrame,
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
  data: dfdt.DataFrame,
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
  data: dfdt.DataFrame,
  globalMissingValues: string[]
): Variable<VariableStats> => {
  const name = v.name;
  const groups = name.split("_");
  const missingValues = v.missingValues ?? globalMissingValues;

  const nMissing = maskMatching(data.column(name), missingValues).reduce(
    (a, b) => a + Number(b),
    0
  );

  const nValid = data.shape[0] - nMissing;

  return {
    id: idCounter++,
    name,
    description: v.description ?? "(No description)",
    type: variableTypeName(v),
    num_valid: nValid,
    num_missing: nMissing,
    group: groups[0],
    stats: variableTypeStats(v, data, globalMissingValues),
    missingness: missingnessStats(v, data, globalMissingValues),
  };
};

const tableStats = (r: m.TableResource, data: dfdt.DataFrame) => {
  return r.fields.map((f) => variableStats(f, data, r.missingValues ?? []));
};

const generateTestData = () => {
  const synthDataPackage = synth.generateDataPackage();

  const resource = synthDataPackage.resources[0];

  const data = new dfd.DataFrame(resource.data);

  return {
    bundle: {
      name: synthDataPackage.name,
      package_version: "20230902.f63be38-dev",
      description: synthDataPackage.description ?? "No description",
    },
    tabledata: [
      fakeTextVariable("id_child"),
      fakeCategoricalVariable("child_gender"),
      fakeContinuousVariable("child_age"),
      fakeContinuousVariable("child_height"),
      fakeTextVariable("child_skill"),
      fakeCategoricalVariable("child_grade"),
      ...tableStats(resource, data),
    ],
  };
};

export { generateTestData };
