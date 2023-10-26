import type { Faker } from "@faker-js/faker";

import { match } from "ts-pattern";

import type * as cfg from "./config";

import type * as m from "./model";

// Types

type RandState = {
  faker: Faker;
  seenIds: Set<string>;
};

type RandGen<T> = (state: RandState) => T;

// Combinators

const map =
  <T, P>(f: (x: T) => P) =>
  (gen: RandGen<T>): RandGen<P> =>
  (state: RandState) =>
    f(gen(state));

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
  (state: RandState) =>
    new Array(randomInt(c)(state)).map(() => gen(state));

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
    match(c.style)
      .with("spss", () => spssMissingValue())
      .with("stata", () => stataMissingValue())
      .with("underscore", () => underscoreMissingValue())
      .exhaustive()
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

const enumIntegerLevel =
  (c: cfg.EnumIntegerLevels) =>
  (value: number | string, allUnlabelled: boolean) =>
  (state: RandState): m.EnumIntegerLevel => ({
    value,
    label: allUnlabelled
      ? undefined
      : maybe(1 - c.unlabelled)(identifier(c.label_name))(state),
  });

const enumIntegerLevels =
  (c: cfg.EnumIntegerLevels) =>
  (state: RandState): m.EnumIntegerLevel[] => {
    const levelGen = enumIntegerLevel(c);
    const nLevels = randomInt(c.n_levels)(state);
    const allUnlabelled = boolean(c.all_unlabelled)(state);
    return new Array(nLevels).map((_, idx) =>
      levelGen(idx, allUnlabelled)(state)
    );
  };

const enumStringLevels = (c: cfg.EnumStringLevels) => (state: RandState) => {
  const levelGen = identifier(c.level_name);
  const nLevels = randomInt(c.n_levels)(state);
  return new Array(nLevels).map(() => levelGen(state));
};

const fieldBase = (c: cfg.FieldBase) => (state: RandState) => ({
  name: uniqueId(identifier(c.field_name))(state),
  description: maybe(1 - c.undefined_props)(description(c.description))(state),
  required: maybe(1 - c.undefined_props)(boolean(c.required))(state),
  unique: maybe(1 - c.undefined_props)(boolean(c.unique))(state),
  missingValues: maybe(1 - c.undefined_props)(missingValues(c.missing_values))(
    state
  ),
});

const integerField =
  (c: cfg.IntegerField) =>
  (state: RandState): m.Field => ({
    ...fieldBase(c)(state),
    fieldType: {
      type: "integer",
      minimum: maybe(1 - c.undefined_props)(randomInt(c.minimum))(state),
      maximum: maybe(1 - c.undefined_props)(randomInt(c.maximum))(state),
    },
  });

const enumIntegerField =
  (c: cfg.EnumIntegerField) =>
  (state: RandState): m.Field => ({
    ...fieldBase(c)(state),
    fieldType: {
      type: "enum_integer",
      levels: enumIntegerLevels(c.levels)(state),
      ordered: maybe(1 - c.undefined_props)(boolean(c.ordered))(state),
    },
  });

const stringField =
  (c: cfg.StringField) =>
  (state: RandState): m.Field => ({
    ...fieldBase(c)(state),
    fieldType: {
      type: "string",
      minLength: maybe(1 - c.undefined_props)(randomInt(c.min_length))(state),
      maxLength: maybe(1 - c.undefined_props)(randomInt(c.max_length))(state),
    },
  });

const enumStringField =
  (c: cfg.EnumStringField) =>
  (state: RandState): m.Field => ({
    ...fieldBase(c)(state),
    fieldType: {
      type: "enum_string",
      levels: enumStringLevels(c.levels)(state),
      ordered: maybe(1 - c.undefined_props)(boolean(c.ordered))(state),
    },
  });

const numericField =
  (c: cfg.NumericField) =>
  (state: RandState): m.Field => ({
    ...fieldBase(c)(state),
    fieldType: {
      type: "number",
      minimum: maybe(1 - c.undefined_props)(randomFloat(c.minimum))(state),
      maximum: maybe(1 - c.undefined_props)(randomFloat(c.maximum))(state),
    },
  });

const primitiveField = (c: cfg.PrimitiveField) => (state: RandState) =>
  match(c)
    .with({ field_type: "integer" }, (c) => integerField(c))
    .with({ field_type: "enum_integer" }, (c) => enumIntegerField(c))
    .with({ field_type: "string" }, (c) => stringField(c))
    .with({ field_type: "enum_string" }, (c) => enumStringField(c))
    .with({ field_type: "number" }, (c) => numericField(c))
    .exhaustive()(state);

const fieldChoice = (c: cfg.FieldChoice) => (state: RandState) => {
  const fieldGens = c.choices.map((c) => primitiveField(c));
  const choice = state.faker.helpers.arrayElement(fieldGens);
  return choice(state);
};

const field = (c: cfg.Field) => (state: RandState) =>
  match(c)
    .with({ field_type: "choice" }, (c) => fieldChoice(c))
    .with(
      { field_type: "integer" },
      { field_type: "enum_integer" },
      { field_type: "string" },
      { field_type: "enum_string" },
      { field_type: "number" },
      (c) => primitiveField(c)
    )
    .exhaustive()(state);
