import { z } from "zod";

// Issue: https://github.com/colinhacks/zod/issues/2203

const intRange = z.tuple([z.number().int(), z.number().int()]);

const floatRange = z.tuple([z.number(), z.number()]);

const boolProb = z.number();

const identifierStyle = z.enum([
  "camel",
  "kebab",
  "snake",
  "pascal",
  "snake_caps",
]);

const descriptionStyle = z.enum(["random", "lorem"]);

const missingStyle = z.enum(["spss", "stata", "underscore", "random"]);

const identifierDefaults = z.object({
  n_words: intRange.default([1, 3]),
});

const missingValuesDefaults = z.object({
  style: missingStyle.default("random"),
  n_values: intRange.default([0, 4]),
});

const descriptionDefaults = z.object({
  style: descriptionStyle.default("random"),
  n_words: intRange.default([5, 20]),
});

const enumLevelsDefaults = z.object({
  label_name_style: identifierStyle.default("snake_caps"),
  integer_level_unlabelled: boolProb.default(0.2),
  integer_all_unlabelled: boolProb.default(0.2),
});

const fieldDefaults = z.object({
  field_name_style: identifierStyle.default("camel"),
  required: boolProb.default(0.5),
  unique: boolProb.default(0.5),
  integer_minimum: intRange.default([0, 100]),
  integer_maximum: intRange.default([0, 100]),
  enum_ordered: boolProb.default(0.5),
  enum_n_levels: intRange.default([2, 10]),
  number_minimum: floatRange.default([0, 100]),
  number_maximum: floatRange.default([0, 100]),
  string_min_length: intRange.default([0, 100]),
  string_max_length: intRange.default([0, 100]),
});

const measureDefaults = z.object({
  measure_name_style: identifierStyle.default("camel"),
  n_fields: intRange.default([2, 20]),
});

const tableResourceDefaults = z.object({
  table_name_style: identifierStyle.default("kebab"),
  n_measures: intRange.default([2, 20]),
});

const dataPackageDefaults = z.object({
  package_name_style: identifierStyle.default("kebab"),
  n_tables: intRange.default([1, 10]),
});

const globalConfig = z.object({
  identifiers: identifierDefaults.default({}),
  descriptions: descriptionDefaults.default({}),
  missing_values: missingValuesDefaults.default({}),
  enum_levels: enumLevelsDefaults.default({}),
  fields: fieldDefaults.default({}),
  measures: measureDefaults.default({}),
  table_resources: tableResourceDefaults.default({}),
  data_package: dataPackageDefaults.default({}),
});

type GlobalConfig = z.infer<typeof globalConfig>;

const identifier = (cfg: GlobalConfig) =>
  z.object({
    style: identifierStyle,
    n_words: intRange.default(cfg.identifiers.n_words),
  });

const description = (cfg: GlobalConfig) =>
  z.object({
    style: descriptionStyle.default(cfg.descriptions.style),
    n_words: intRange.default(cfg.descriptions.n_words).or(z.number().int()),
  });

const missingValues = (cfg: GlobalConfig) =>
  z.object({
    style: missingStyle.default(cfg.missing_values.style),
    n_values: intRange.default(cfg.missing_values.n_values),
  });

const enumIntegerLevels = (cfg: GlobalConfig) =>
  z.object({
    label_name: z
      .record(z.string())
      .or(identifier(cfg))
      .default({ style: cfg.enum_levels.label_name_style }),
    n_levels: intRange.default(cfg.fields.enum_n_levels),
    unlabelled: boolProb.default(cfg.enum_levels.integer_level_unlabelled),
    all_unlabelled: boolProb.default(cfg.enum_levels.integer_all_unlabelled),
  });

const enumStringLevels = (cfg: GlobalConfig) =>
  z.object({
    level_name: z
      .record(z.string())
      .or(identifier(cfg))
      .default({ style: cfg.enum_levels.label_name_style }),
    n_levels: intRange.default(cfg.fields.enum_n_levels),
  });

const fieldBase = (cfg: GlobalConfig) =>
  z.object({
    field_name: identifier(cfg).default({
      style: cfg.fields.field_name_style,
    }),
    required: boolProb.default(cfg.fields.required),
    unique: boolProb.default(cfg.fields.unique),
    missing_values: missingValues(cfg).default({}),
  });

const integerField = (cfg: GlobalConfig) =>
  z
    .object({
      field_type: z.literal("integer"),
      minimum: intRange.default(cfg.fields.integer_minimum),
      maximum: intRange.default(cfg.fields.integer_maximum),
    })
    .merge(fieldBase(cfg));

const enumIntegerField = (cfg: GlobalConfig) =>
  z
    .object({
      field_type: z.literal("enum_integer"),
      ordered: boolProb.default(cfg.fields.enum_ordered),
      levels: z.array(z.string()).or(enumIntegerLevels(cfg)).default({}),
    })
    .merge(fieldBase(cfg));

const numericField = (cfg: GlobalConfig) =>
  z
    .object({
      field_type: z.literal("numeric"),
      minimum: floatRange.default(cfg.fields.number_minimum),
      maximum: floatRange.default(cfg.fields.number_maximum),
    })
    .merge(fieldBase(cfg));

const stringField = (cfg: GlobalConfig) =>
  z
    .object({
      field_type: z.literal("string"),
      min_length: intRange.default(cfg.fields.string_min_length),
      max_length: intRange.default(cfg.fields.string_max_length),
    })
    .merge(fieldBase(cfg));

const enumStringField = (cfg: GlobalConfig) =>
  z
    .object({
      field_type: z.literal("enum_string"),
      ordered: boolProb.default(cfg.fields.enum_ordered),
      levels: z.array(z.string()).or(enumStringLevels(cfg)).default({}),
    })
    .merge(fieldBase(cfg));

const primitiveField = (cfg: GlobalConfig) =>
  z.discriminatedUnion("field_type", [
    integerField(cfg),
    enumIntegerField(cfg),
    numericField(cfg),
    stringField(cfg),
    enumStringField(cfg),
  ]);

const fieldChoice = (cfg: GlobalConfig) =>
  z.object({
    field_type: z.literal("choice"),
    choices: primitiveField(cfg)
      .array()
      .default([
        { field_type: "integer" },
        { field_type: "enum_integer" },
        { field_type: "numeric" },
        { field_type: "string" },
        { field_type: "enum_string" },
      ]),
  });

const field = (cfg: GlobalConfig) =>
  z.union([primitiveField(cfg), fieldChoice(cfg)]);

const batchMeasureFieldGroup = (cfg: GlobalConfig) =>
  z.object({
    group_type: z.literal("batch_measure"),
    measure_name: identifier(cfg).default({
      style: cfg.measures.measure_name_style,
    }),
    generator: field(cfg).default({ field_type: "choice" }),
    n_fields: intRange.default(cfg.measures.n_fields),
    n_measures: intRange.default(cfg.table_resources.n_measures),
  });

const measureFieldGroup = (cfg: GlobalConfig) =>
  z.object({
    group_type: z.literal("measure"),
    measure_name: identifier(cfg).default({ style: "camel" }),
    fields: field(cfg).array(),
  });

const batchFieldGroup = (cfg: GlobalConfig) =>
  z.object({
    group_type: z.literal("batch"),
    generator: field(cfg).default({ field_type: "choice" }),
    n_fields: intRange.default([2, 20]),
  });

const fieldGroup = (cfg: GlobalConfig) =>
  z.discriminatedUnion("group_type", [
    batchMeasureFieldGroup(cfg),
    batchFieldGroup(cfg),
    measureFieldGroup(cfg),
  ]);

const fieldList = (cfg: GlobalConfig) =>
  z.union([
    batchMeasureFieldGroup(cfg),
    batchFieldGroup(cfg),
    fieldGroup(cfg),
    field(cfg).array(),
  ]);

const tableResource = (cfg: GlobalConfig) =>
  z.object({
    table_name: identifier(cfg).default({
      style: cfg.table_resources.table_name_style,
    }),
    description: description(cfg).default({}),
    fields: fieldList(cfg).default({ group_type: "batch_measure" }),
    missing_values: missingValues(cfg).default({}),
  });

const batchTableResource = (cfg: GlobalConfig) =>
  z.object({
    group_type: z.literal("batch"),
    generator: tableResource(cfg).default({}),
    n_tables: intRange.default(cfg.data_package.n_tables),
  });

const tableResourceList = (cfg: GlobalConfig) =>
  z.union([
    batchTableResource(cfg),
    z.union([batchTableResource(cfg), tableResource(cfg)]).array(),
  ]);

const dataPackage = (cfg: GlobalConfig = globalConfig.parse({})) =>
  z
    .object({
      package_name: identifier(cfg).default({
        style: cfg.data_package.package_name_style,
      }),
      description: description(cfg).default({}),
      resources: tableResourceList(cfg).default({ group_type: "batch" }),
    })
    .default({}); // Check that it works by default...

/** #######################  BREAK ########################## */

// Global settings:
// undefined_prob
// missing_style

export { dataPackage };
