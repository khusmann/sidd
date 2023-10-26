import { z } from "zod";

const intRange = z.union([
  z.number().int(),
  z.tuple([z.number().int(), z.number().int()]),
]);

const floatRange = z.union([z.number(), z.tuple([z.number(), z.number()])]);

const boolProb = z.union([z.boolean(), z.number()]);

const identifierStyle = z.enum([
  "camel",
  "kebab",
  "snake",
  "pascal",
  "snake_caps",
]);

type IdentifierStyle = z.infer<typeof identifierStyle>;

const sentenceStyle = z.enum(["random", "lorem"]);

const identifierDefaults = z
  .object({
    n_words: intRange.default([1, 3]),
  })
  .default({});

const identifier = (config: GlobalConfig, defaultStyle: IdentifierStyle) =>
  z
    .object({
      style: identifierStyle.default(defaultStyle),
      n_words: intRange.default(config.identifiers.n_words),
    })
    .default({});

const sentenceDefaults = z
  .object({
    style: sentenceStyle.default("random"),
    n_words: intRange.default([5, 20]),
  })
  .default({});

const sentence = (config: GlobalConfig) =>
  z
    .object({
      style: sentenceStyle.default(config.sentences.style),
      n_words: intRange.default(config.sentences.n_words).or(z.number().int()),
    })
    .default({});

const enumIntegerLevelsDefaults = z
  .object({
    label_name_style: identifierStyle.default("snake_caps"),
    n_levels: intRange.default([2, 10]),
    unlabelled: boolProb.default(0.2),
    all_unlabelled: boolProb.default(0.2),
  })
  .default({});

const enumIntegerLevels = (config: GlobalConfig) =>
  z
    .object({
      label_name: z
        .record(z.string())
        .or(identifier(config, config.enum_integer_levels.label_name_style)),
      n_levels: intRange.default(config.enum_integer_levels.n_levels),
      unlabelled: boolProb.default(config.enum_integer_levels.unlabelled),
      all_unlabelled: boolProb.default(
        config.enum_integer_levels.all_unlabelled
      ),
    })
    .default({});

const enumStringLevelsDefaults = z
  .object({
    level_name_style: identifierStyle.default("snake_caps"),
    n_levels: intRange.default([2, 10]),
  })
  .default({});

const enumStringLevels = (config: GlobalConfig) =>
  z
    .object({
      level_name: z
        .record(z.string())
        .or(identifier(config, config.enum_string_levels.level_name_style)),
      n_levels: intRange.default(config.enum_string_levels.n_levels),
    })
    .default({});

const fieldBaseDefaults = z
  .object({
    field_name_style: identifierStyle.default("camel"),
    required: boolProb.default(0.5),
    unique: boolProb.default(0.5),
    n_missing_values: intRange.default([0, 4]),
  })
  .default({});

const fieldBase = (config: GlobalConfig) =>
  z.object({
    field_name: identifier(config, config.fields.field_name_style),
    required: boolProb.default(config.fields.required),
    unique: boolProb.default(config.fields.unique),
    n_missing_values: intRange.default(config.fields.n_missing_values),
  });

const integerFieldDefaults = z
  .object({
    minimum: intRange.default([0, 100]),
    maximum: intRange.default([0, 100]),
  })
  .default({});

const integerField = (config: GlobalConfig) =>
  z
    .object({
      field_type: z.literal("integer"),
      minimum: intRange.default(config.integer_fields.minimum),
      maximum: intRange.default(config.integer_fields.maximum),
    })
    .merge(fieldBase(config));

const enumIntegerFieldDefaults = z
  .object({
    ordered: boolProb.default(0.5),
  })
  .default({});

const enumIntegerField = (config: GlobalConfig) =>
  z
    .object({
      field_type: z.literal("enum_integer"),
      ordered: boolProb.default(config.enum_integer_fields.ordered),
      levels: z.array(z.string()).or(enumIntegerLevels(config)),
    })
    .merge(fieldBase(config));

const numericFieldDefaults = z
  .object({
    minimum: floatRange.default([0, 100]),
    maximum: floatRange.default([0, 100]),
  })
  .default({});

const numericField = (config: GlobalConfig) =>
  z
    .object({
      field_type: z.literal("numeric"),
      minimum: floatRange.default(config.numeric_fields.minimum),
      maximum: floatRange.default(config.numeric_fields.maximum),
    })
    .merge(fieldBase(config));

const stringFieldDefaults = z
  .object({
    min_length: intRange.default([0, 100]),
    max_length: intRange.default([0, 100]),
  })
  .default({});

const stringField = (config: GlobalConfig) =>
  z
    .object({
      field_type: z.literal("string"),
      min_length: intRange.default(config.string_fields.min_length),
      max_length: intRange.default(config.string_fields.max_length),
    })
    .merge(fieldBase(config));

const enumStringFieldDefaults = z
  .object({
    ordered: boolProb.default(0.5),
  })
  .default({});

const enumStringField = (config: GlobalConfig) =>
  z
    .object({
      field_type: z.literal("enum_string"),
      ordered: boolProb.default(config.enum_string_fields.ordered),
      levels: z.array(z.string()).or(enumStringLevels(config)),
    })
    .merge(fieldBase(config));

const primitiveField = (config: GlobalConfig) =>
  z.discriminatedUnion("field_type", [
    integerField(config),
    enumIntegerField(config),
    numericField(config),
    stringField(config),
    enumStringField(config),
  ]);

const fieldChoice = (config: GlobalConfig) =>
  z.object({
    field_type: z.literal("choice"),
    choices: primitiveField(config)
      .array()
      .default([
        { field_type: "integer" },
        { field_type: "enum_integer" },
        { field_type: "numeric" },
        { field_type: "string" },
        { field_type: "enum_string" },
      ]),
  });

const field = (config: GlobalConfig) =>
  z.union([primitiveField(config), fieldChoice(config)]);

const batchMeasureFieldGroupDefaults = z
  .object({
    measure_name_style: identifierStyle.default("camel"),
    n_fields: intRange.default([2, 20]),
    n_measures: intRange.default([2, 20]),
  })
  .default({});

const batchMeasureFieldGroup = (config: GlobalConfig) =>
  z.object({
    group_type: z.literal("batch_measure"),
    measure_name: identifier(
      config,
      config.batch_measure_field_groups.measure_name_style
    ),
    generator: field(config).default({ field_type: "choice" }),
    n_fields: intRange.default(config.batch_measure_field_groups.n_fields),
    n_measures: intRange.default(config.batch_measure_field_groups.n_measures),
  });

const measureFieldGroup = (config: GlobalConfig) =>
  z.object({
    group_type: z.literal("measure"),
    measure_name: identifier(config, "camel"),
    fields: field(config).array(),
  });

const batchFieldGroup = (config: GlobalConfig) =>
  z.object({
    group_type: z.literal("batch"),
    generator: field(config).default({ field_type: "choice" }),
    n_fields: intRange.default([2, 20]),
  });

const fieldGroup = (config: GlobalConfig) =>
  z.discriminatedUnion("group_type", [
    batchMeasureFieldGroup(config),
    batchFieldGroup(config),
    measureFieldGroup(config),
  ]);

const fieldList = (config: GlobalConfig) =>
  z.union([
    batchMeasureFieldGroup(config),
    batchFieldGroup(config),
    field(config),
    fieldGroup(config),
  ]);

const tableSchemaDefaults = z
  .object({
    table_name_style: identifierStyle.default("kebab"),
    n_missing_values: intRange.default([0, 4]),
  })
  .default({});

const tableSchema = (config: GlobalConfig) =>
  z.object({
    table_name: identifier(config, config.table_resources.table_name_style),
    description: sentence(config).default({}),
    fields: fieldList(config).default({ group_type: "batch_measure" }),
    n_missing_values: intRange.default(config.table_resources.n_missing_values),
  });

const batchTableResourceDefaults = z
  .object({
    n_tables: intRange.default([1, 10]),
  })
  .default({});

const batchTableResource = (config: GlobalConfig) =>
  z.object({
    group_type: z.literal("batch"),
    generator: tableSchema(config).default({}),
    n_tables: intRange.default(config.batch_table_resources.n_tables),
  });

const tableResourceList = (config: GlobalConfig) =>
  z.union([
    batchTableResource(config),
    z.union([batchTableResource(config), tableSchema(config)]).array(),
  ]);

const dataPackageDefaults = z
  .object({
    package_name_style: identifierStyle.default("kebab"),
  })
  .default({});

const globalConfig = z
  .object({
    identifiers: identifierDefaults,
    sentences: sentenceDefaults,
    enum_integer_levels: enumIntegerLevelsDefaults,
    enum_string_levels: enumStringLevelsDefaults,
    fields: fieldBaseDefaults,
    integer_fields: integerFieldDefaults,
    enum_integer_fields: enumIntegerFieldDefaults,
    numeric_fields: numericFieldDefaults,
    string_fields: stringFieldDefaults,
    enum_string_fields: enumStringFieldDefaults,
    batch_measure_field_groups: batchMeasureFieldGroupDefaults,
    table_resources: tableSchemaDefaults,
    batch_table_resources: batchTableResourceDefaults,
    data_package: dataPackageDefaults,
  })
  .default({});

type GlobalConfig = z.infer<typeof globalConfig>;

const dataPackage = (config: GlobalConfig = globalConfig.parse({})) =>
  z
    .object({
      package_name: identifier(config, config.data_package.package_name_style),
      description: sentence(config),
      resources: tableResourceList(config).default({ group_type: "batch" }),
    })
    .default({});

/** #######################  BREAK ########################## */

// Global settings:
// undefined_prob
// missing_style

export { dataPackage };
