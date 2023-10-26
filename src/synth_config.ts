import { z } from "zod";

const tuple = <T extends any[]>(...args: T): T => args;

const defaults = {
  sentence: {
    words: "random" as const,
    n_words: tuple(5, 20),
  },
  identifier: {
    n_words: tuple(1, 3),
  },
  enum_integer_levels: {
    label_name: { style: "snake_caps" as const },
    n_levels: tuple(2, 10),
    unlabelled: 0.2,
    all_unlabelled: 0.2,
  },
  enum_string_levels: {
    level_name: { style: "snake_caps" as const },
    n_levels: tuple(2, 10),
  },
};

const intRange = z.union([
  z.number().int(),
  z.tuple([z.number().int(), z.number().int()]),
]);

const floatRange = z.union([z.number(), z.tuple([z.number(), z.number()])]);

const boolProb = z.union([z.boolean(), z.number()]);

const identifier = z.union([
  z.string(),
  z.object({
    style: z.enum(["camel", "kebab", "snake", "pascal", "snake_caps"]),
    n_words: intRange.default(defaults.identifier.n_words),
  }),
]);

const sentence = z.union([
  z.string(),
  z.object({
    words: z.enum(["random", "lorem"]).default(defaults.sentence.words),
    n_words: intRange.default(defaults.sentence.n_words),
  }),
]);

const enumIntegerLevels = z.union([
  z.record(z.string()),
  z.object({
    label_name: identifier.default(defaults.enum_integer_levels.label_name),
    n_levels: intRange.default(defaults.enum_integer_levels.n_levels),
    unlabelled: boolProb.default(defaults.enum_integer_levels.unlabelled),
    all_unlabelled: boolProb.default(
      defaults.enum_integer_levels.all_unlabelled
    ),
  }),
]);

const enumStringLevels = z.union([
  z.array(z.string()),
  z.object({
    level_name: identifier.default({ style: "snake_caps" }),
    n_levels: intRange.default([2, 10]),
  }),
]);

const fieldBase = z.object({
  field_name: identifier.default({ style: "camel" }),
  required: boolProb.default(0.5),
  unique: boolProb.default(0.5),
  n_missing_values: intRange.default([0, 4]),
});

const integerField = z
  .object({
    field_type: z.literal("integer"),
    minimum: intRange.default([0, 100]),
    maximum: intRange.default([0, 100]),
  })
  .merge(fieldBase);

const enumIntegerField = z
  .object({
    field_type: z.literal("enum_integer"),
    ordered: boolProb.default(0.5),
    levels: enumIntegerLevels.default({}),
  })
  .merge(fieldBase);

const numericField = z
  .object({
    field_type: z.literal("numeric"),
    minimum: floatRange.default([0, 100]),
    maximum: floatRange.default([0, 100]),
  })
  .merge(fieldBase);

const stringField = z
  .object({
    field_type: z.literal("string"),
    min_length: boolProb.default(0),
    max_length: boolProb.default(100),
  })
  .merge(fieldBase);

const enumStringField = z
  .object({
    field_type: z.literal("enum_string"),
    levels: enumStringLevels.default({}),
    ordered: boolProb.default(0.5),
  })
  .merge(fieldBase);

const primitiveField = z.discriminatedUnion("field_type", [
  integerField,
  enumIntegerField,
  numericField,
  stringField,
  enumStringField,
]);

const fieldChoice = z
  .object({
    field_type: z.literal("choice"),
    choices: primitiveField
      .array()
      .default([
        { field_type: "integer" },
        { field_type: "enum_integer" },
        { field_type: "numeric" },
        { field_type: "string" },
        { field_type: "enum_string" },
      ]),
  })
  .merge(fieldBase);

const field = z.union([primitiveField, fieldChoice]);

const batchMeasureFieldGroup = z.object({
  group_type: z.literal("measure_batch"),
  measure_name: identifier.default({ style: "camel" }),
  generator: field.default({ field_type: "choice" }),
  n_fields: intRange.default([2, 20]),
  n_measures: intRange.default([2, 20]),
});

const measureFieldGroup = z.object({
  group_type: z.literal("measure"),
  measure_name: identifier.default({ style: "camel" }),
  fields: z.array(field),
});

const batchFieldGroup = z.object({
  group_type: z.literal("batch"),
  generator: field.default({ field_type: "choice" }),
  n_fields: intRange.default([2, 20]),
});

const fieldGroup = z.discriminatedUnion("group_type", [
  batchMeasureFieldGroup,
  batchFieldGroup,
  measureFieldGroup,
]);

const fieldList = z.union([
  batchMeasureFieldGroup,
  batchFieldGroup,
  z.array(z.union([field, fieldGroup])),
]);

const tableSchema = z.object({
  fields: fieldList.default({ group_type: "batch" }),
  n_missing_values: intRange.default([0, 4]),
});

const tableResource = z.object({
  table_name: identifier.default({ style: "kebab" }),
  description: sentence.default({}),
  schema: tableSchema.default({}),
});

const batchTableResource = z.object({
  group_type: z.literal("batch"),
  generator: tableResource.default({}),
  n_tables: intRange.default([1, 10]),
});

const tableResourceList = z.union([
  batchTableResource,
  z.array(z.union([tableResource, batchTableResource])),
]);

const dataPackage = z.object({
  package_name: identifier.default({ style: "kebab" }),
  description: sentence.default({}),
  resources: tableResourceList.default({ group_type: "batch" }),
});

// Global settings:
// undefined_prob
// missing_style

export { dataPackage };
