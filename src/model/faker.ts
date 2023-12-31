import type {
  Variable,
  TextVariableStats,
  ContinuousVariableStats,
  CategoricalVariableStats,
} from "./stats";

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

export { fakeTextVariable, fakeCategoricalVariable, fakeContinuousVariable };
