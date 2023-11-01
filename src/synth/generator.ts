import type { Faker } from "@faker-js/faker";

import { faker as default_faker } from "@faker-js/faker";

import { match, P } from "ts-pattern";

import * as cfg from "./config";

import type * as m from "../model";

// Types

type RandState = {
  faker: Faker;
  seenIds: Set<string>;
};

const randState = (faker: Faker = default_faker): RandState => ({
  faker,
  seenIds: new Set(),
});

type RandGen<T> = (state: RandState) => T;

// Combinators

const map =
  <T, P>(f: (x: T) => P) =>
  (gen: RandGen<T>): RandGen<P> =>
  (state: RandState) =>
    f(gen(state));

const seq =
  <T>(gens: Array<RandGen<T>>): RandGen<T[]> =>
  (state: RandState) =>
    gens.map((g) => g(state));

const MAX_UNIQUE_ID_ATTEMPTS = 1000;

const maybe =
  (prob: cfg.BoolProb) =>
  <T>(gen: RandGen<T>) =>
  (state: RandState) => {
    if (state.faker.datatype.boolean({ probability: prob })) {
      return gen(state);
    } else {
      return undefined;
    }
  };

const batch =
  (c: cfg.IntRange) =>
  <T>(gen: RandGen<T>) =>
  (state: RandState) => {
    return [...new Array(randomInt(c)(state))].map(() => gen(state));
  };

const uniqueId = (gen: RandGen<string>) => (state: RandState) => {
  for (let i = 0; i < MAX_UNIQUE_ID_ATTEMPTS; i++) {
    const id = gen(state);
    if (!state.seenIds.has(id)) {
      state.seenIds.add(id);
      return id;
    }
  }
  throw new Error("Failed to generate unique identifier");
};

const localUniqueId = (gen: RandGen<string>) => {
  const seenIds = new Set<string>();
  return (state: RandState) => {
    for (let i = 0; i < MAX_UNIQUE_ID_ATTEMPTS; i++) {
      const id = gen(state);
      if (!seenIds.has(id)) {
        seenIds.add(id);
        return id;
      }
    }
    throw new Error("Failed to generate locally unique identifier");
  };
};

// Joiners

const titleCase = (s: string) => s[0].toUpperCase() + s.slice(1);

const camelJoiner = ([first, ...rest]: string[]) =>
  [first, ...rest.map((s) => titleCase(s))].join("");

const snakeJoiner = (words: string[]) =>
  words.map((s) => s.toLowerCase()).join("_");

const snakeCapsJoiner = (words: string[]) =>
  words.map((s) => s.toUpperCase()).join("_");

const kebabJoiner = (words: string[]) =>
  words.map((s) => s.toLowerCase()).join("-");

const joinerFromIdentifierStyle = (style: cfg.IdentifierStyle) =>
  match(style)
    .with("camel", () => camelJoiner)
    .with("kebab", () => kebabJoiner)
    .with("snake", () => snakeJoiner)
    .with("snake_caps", () => snakeCapsJoiner)
    .exhaustive();

const sentenceJoiner = ([head, ...tail]: string[]) =>
  [titleCase(head), ...tail].join(" ") + ".";

// Generators

const boolean = (c: cfg.BoolProb) => (state: RandState) =>
  state.faker.datatype.boolean({ probability: c });

const words =
  (range: cfg.IntRange) =>
  ({ faker }: RandState): string[] =>
    faker.word
      .words({
        count: { min: range[0], max: range[1] },
      })
      .replace("-", "")
      .split(" ");

const randomInt =
  (c: cfg.IntRange) =>
  ({ faker }: RandState) =>
    faker.number.int({ min: c[0], max: c[1] });

const randomFloat =
  (c: cfg.FloatRange) =>
  ({ faker }: RandState) =>
    faker.number.float({ min: c[0], max: c[1] });

const spssMissingValue = () => (state: RandState) =>
  randomInt([-1000, -100])(state).toString();

const STATA_MISSING_VALUES = "abcdefghijklmnopqrstuvwxyz"
  .split("")
  .map((c) => "." + c);

const stataMissingValue =
  () =>
  ({ faker }: RandState) =>
    faker.helpers.arrayElement(STATA_MISSING_VALUES);

const underscoreMissingValue = () => (state: RandState) =>
  "_" + identifier({ n_words: [1, 3], style: "snake_caps" })(state) + "_";

const missingValues = (c: cfg.MissingValues) =>
  batch(c.n_values)(
    localUniqueId(
      match(c.style)
        .with("spss", () => spssMissingValue())
        .with("stata", () => stataMissingValue())
        .with("underscore", () => underscoreMissingValue())
        .exhaustive()
    )
  );

const lorem =
  (range: cfg.IntRange) =>
  ({ faker }: RandState): string[] =>
    faker.lorem.words({ min: range[0], max: range[1] }).split(" ");

const wordGenFromDescriptionStyle = (style: cfg.DescriptionStyle) =>
  match(style)
    .with("words", () => words)
    .with("lorem", () => lorem)
    .exhaustive();

const identifier = (c: cfg.Identifier) =>
  map(joinerFromIdentifierStyle(c.style))(words(c.n_words));

const description = (c: cfg.Description) =>
  map(sentenceJoiner)(wordGenFromDescriptionStyle(c.style)(c.n_words));

const enumIntegerLevels = (c: cfg.EnumIntegerLevels) => {
  const labelGen = localUniqueId(identifier(c.label_name));

  return (state: RandState) => {
    const allUnlabelled = boolean(c.all_unlabelled)(state);
    const nLevels = randomInt(c.n_levels)(state);

    const newLabelGen = allUnlabelled ? () => undefined : labelGen;

    return [...new Array(nLevels)].map((_, idx) => ({
      value: idx,
      label: newLabelGen(state),
    }));
  };
};

const enumStringLevels = (c: cfg.EnumStringLevels) => {
  const levelGen = localUniqueId(identifier(c.level_name));
  return (state: RandState) => {
    const nLevels = randomInt(c.n_levels)(state);
    return [...new Array(nLevels)].map(() => levelGen(state));
  };
};

const fieldName = (measureName: string, c: cfg.Identifier) =>
  uniqueId(map((s) => [measureName, s].join("_"))(identifier(c)));

const fieldBase =
  (measureName: string) => (c: cfg.FieldBase) => (state: RandState) => ({
    name: fieldName(measureName, c.field_name)(state),
    description: maybe(1 - c.undefined_props)(description(c.description))(
      state
    ),
    required: maybe(1 - c.undefined_props)(boolean(c.required))(state),
    unique: maybe(1 - c.undefined_props)(boolean(c.unique))(state),
    missingValues: maybe(1 - c.undefined_props)(
      missingValues(c.missing_values)
    )(state),
  });

const integerField =
  (measureName: string) =>
  (c: cfg.IntegerField) =>
  (state: RandState): m.Field<m.IntegerFieldType> => ({
    ...fieldBase(measureName)(c)(state),
    fieldType: {
      type: "integer",
      ...interval(c.minimum, c.maximum, c.undefined_props)(state),
    },
  });

const enumIntegerField =
  (measureName: string) =>
  (c: cfg.EnumIntegerField) =>
  (state: RandState): m.Field<m.EnumIntegerFieldType> => ({
    ...fieldBase(measureName)(c)(state),
    fieldType: {
      type: "enum_integer",
      levels: enumIntegerLevels(c.levels)(state),
      ordered: maybe(1 - c.undefined_props)(boolean(c.ordered))(state),
    },
  });

const interval =
  (r1: cfg.IntRange, r2: cfg.IntRange, undefinedProps: cfg.BoolProb) =>
  (state: RandState) => {
    const x1 = maybe(1 - undefinedProps)(randomInt(r1))(state);
    const x2 = maybe(1 - undefinedProps)(randomInt(r2))(state);
    if (x1 !== undefined && x2 !== undefined) {
      return { minimum: Math.min(x1, x2), maximum: Math.max(x1, x2) };
    } else {
      return { minimum: x1, maximum: x2 };
    }
  };

const renameIntervalLength = ({
  minimum,
  maximum,
}: {
  minimum?: number;
  maximum?: number;
}) => ({
  minLength: minimum,
  maxLength: maximum,
});

const stringField =
  (measureName: string) =>
  (c: cfg.StringField) =>
  (state: RandState): m.Field<m.StringFieldType> => ({
    ...fieldBase(measureName)(c)(state),
    fieldType: {
      type: "string",
      ...map(renameIntervalLength)(
        interval(c.min_length, c.max_length, c.undefined_props)
      )(state),
    },
  });

const enumStringField =
  (measureName: string) =>
  (c: cfg.EnumStringField) =>
  (state: RandState): m.Field<m.EnumStringFieldType> => ({
    ...fieldBase(measureName)(c)(state),
    fieldType: {
      type: "enum_string",
      levels: enumStringLevels(c.levels)(state),
      ordered: maybe(1 - c.undefined_props)(boolean(c.ordered))(state),
    },
  });

const numericField =
  (measureName: string) =>
  (c: cfg.NumericField) =>
  (state: RandState): m.Field<m.NumberFieldType> => ({
    ...fieldBase(measureName)(c)(state),
    fieldType: {
      type: "number",
      ...interval(c.minimum, c.maximum, c.undefined_props)(state),
    },
  });

const primitiveField = (measureName: string) => (c: cfg.PrimitiveField) =>
  match(c)
    .with({ field_type: "integer" }, (c) => integerField(measureName)(c))
    .with({ field_type: "enum_integer" }, (c) =>
      enumIntegerField(measureName)(c)
    )
    .with({ field_type: "string" }, (c) => stringField(measureName)(c))
    .with({ field_type: "enum_string" }, (c) => enumStringField(measureName)(c))
    .with({ field_type: "number" }, (c) => numericField(measureName)(c))
    .exhaustive();

const fieldChoice =
  (measureName: string) => (c: cfg.FieldChoice) => (state: RandState) => {
    const fieldGens = c.choices.map((c) => primitiveField(measureName)(c));
    const choice = state.faker.helpers.arrayElement(fieldGens);
    return choice(state);
  };

const field = (measureName: string) => (c: cfg.Field) =>
  match(c)
    .with({ field_type: "choice" }, (c) => fieldChoice(measureName)(c))
    .otherwise((c) => primitiveField(measureName)(c));

const batchFieldGroup = (c: cfg.BatchFieldGroup) => (state: RandState) => {
  const nFields = randomInt(c.n_fields)(state);
  return [...new Array(nFields)].map(() => field("")(c.generator)(state));
};

const measureFieldGroup = (c: cfg.MeasureFieldGroup) => (state: RandState) => {
  const measureName = uniqueId(identifier(c.measure_name))(state);
  return c.fields.map(field(measureName)).map((f) => f(state));
};

const batchMeasureFieldGroup =
  (c: cfg.BatchMeasureFieldGroup) => (state: RandState) => {
    const nMeasures = randomInt(c.n_measures)(state);

    const measureGen = (st: RandState) => {
      const measureName = uniqueId(identifier(c.measure_name))(st);
      const nFields = randomInt(c.n_fields)(st);

      const fieldGen = field(measureName)(c.generator);

      return [...new Array(nFields)].map(() => fieldGen(st));
    };

    return [...new Array(nMeasures)].map(() => measureGen(state)).flat();
  };

const fieldGroup = (c: cfg.FieldGroup) =>
  match(c)
    .with({ group_type: "batch" }, (c) => batchFieldGroup(c))
    .with({ group_type: "measure" }, (c) => measureFieldGroup(c))
    .with({ group_type: "batch_measure" }, (c) => batchMeasureFieldGroup(c))
    .exhaustive();

const fieldList = (c: cfg.FieldList) =>
  match(c)
    .with(P.array(P._), (c: cfg.Field[]) => seq(c.map(field(""))))
    .otherwise((c) => fieldGroup(c));

const integerFieldTypeData = (f: m.IntegerFieldType) =>
  map((i: number) => i.toString())(
    randomInt([
      f.minimum ?? Number.MIN_SAFE_INTEGER,
      f.maximum ?? Number.MAX_SAFE_INTEGER,
    ])
  );

const numberFieldTypeData = (f: m.NumberFieldType) =>
  map((i: number) => i.toString())(
    randomFloat([
      f.minimum ?? Number.MIN_SAFE_INTEGER,
      f.maximum ?? Number.MAX_SAFE_INTEGER,
    ])
  );

const enumIntegerFieldTypeData =
  (f: m.EnumIntegerFieldType) => (state: RandState) => {
    const level = state.faker.helpers.arrayElement(f.levels);
    return level.value.toString();
  };

const enumStringFieldTypeData =
  (f: m.EnumStringFieldType) => (state: RandState) => {
    const level = state.faker.helpers.arrayElement(f.levels);
    return level;
  };

const stringFieldTypeData = (f: m.StringFieldType) =>
  description({ n_words: [5, 10], style: "words" });

const fieldTypeData = (f: m.FieldType) =>
  match(f)
    .with({ type: "integer" }, (f) => integerFieldTypeData(f))
    .with({ type: "number" }, (f) => numberFieldTypeData(f))
    .with({ type: "enum_integer" }, (f) => enumIntegerFieldTypeData(f))
    .with({ type: "enum_string" }, (f) => enumStringFieldTypeData(f))
    .with({ type: "string" }, (f) => stringFieldTypeData(f))
    .exhaustive();

const missingData =
  (miss: string[]) =>
  ({ faker }: RandState) =>
    faker.helpers.arrayElement(miss);

const fieldData =
  (f: m.AnyField, globalMissing: string[]) => (state: RandState) => {
    const miss = f.missingValues ?? globalMissing ?? [];
    if (miss.length > 0 && state.faker.datatype.boolean({ probability: 0.1 })) {
      return [f.name, missingData(miss)(state)];
    } else {
      return [f.name, fieldTypeData(f.fieldType)(state)];
    }
  };

const toObject = <T extends string>(xs: T[][]): Record<T, T> =>
  Object.fromEntries(xs);

const tableData = (
  fields: m.AnyField[],
  nRows: cfg.IntRange,
  globalMissing: string[]
) => {
  const rowGen = map(toObject)(
    seq(fields.map((f) => fieldData(f, globalMissing)))
  );
  return batch(nRows)(rowGen);
};

const tableResource =
  (c: cfg.TableResource) =>
  (state: RandState): m.TableResource => {
    const fields = fieldList(c.fields)(state);
    const globalMissing = maybe(1 - c.undefined_props)(
      missingValues(c.missing_values)
    )(state);
    const data = tableData(fields, [100, 200], globalMissing ?? [])(state);
    return {
      name: uniqueId(identifier(c.table_name))(state),
      description: maybe(1 - c.undefined_props)(description(c.description))(
        state
      ),
      fields,
      data,
      missingValues: globalMissing,
    };
  };

const batchTableResource = (c: cfg.BatchTableResource) => {
  return batch(c.n_tables)(tableResource(c.generator));
};

const tableResourceList = (c: cfg.TableResourceList) =>
  match(c)
    .with(P.array(P._), (c: cfg.TableResource[]) => seq(c.map(tableResource)))
    .otherwise((c) => batchTableResource(c));

const dataPackage = (c: cfg.DataPackage) => (state: RandState) => ({
  name: uniqueId(identifier(c.package_name))(state),
  description: maybe(1 - c.undefined_props)(description(c.description))(state),
  resources: tableResourceList(c.resources)(state),
});

const generateDataPackage = (
  dataPackageConfig?: any,
  defaultsConfig?: any,
  state: RandState = randState()
) => {
  const dc = defaultsConfig ?? {};
  const dpc = dataPackageConfig ?? {};

  const dcParsed = cfg.defaultsConfig.parse(dc);
  const dpcParsed = cfg.dataPackage(dcParsed).parse(dpc);

  return dataPackage(dpcParsed)(state);
};

export { randState, generateDataPackage };
