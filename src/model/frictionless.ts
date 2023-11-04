import { z } from "zod";
import type * as m from "./model";
import { readFileSync } from "fs";
import { match } from "ts-pattern";
import { parse } from "csv-parse/sync";
import * as path from "path";

const baseConstraints = z.object({
  required: z.boolean().optional(),
  unique: z.boolean().optional(),
  enum: z.array(z.union([z.string(), z.number()])).optional(),
});

const baseField = z.object({
  name: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  example: z.string().optional(),
  type: z.string().optional(),
  format: z.string().optional(),
  enumOrdered: z.boolean().optional(),
  enumLabels: z.record(z.string()).optional(),
  missingValues: z.array(z.string()).optional(),
});

const integerField = baseField.extend({
  type: z.literal("integer"),
  format: z.literal("default").optional(),
  baseNumber: z.boolean().default(true),
  constraints: baseConstraints
    .extend({
      minimum: z.number().int().optional(),
      maximum: z.number().int().optional(),
    })
    .optional(),
});

const booleanField = baseField.extend({
  type: z.literal("boolean"),
  format: z.literal("default").optional(),
  trueValues: z.array(z.string()).optional(),
  falseValues: z.array(z.string()).optional(),
});

const numberField = baseField.extend({
  type: z.literal("number"),
  format: z.literal("default").optional(),
  decimalChar: z.string().default("."),
  groupChar: z.string().default(""),
  baseNumber: z.boolean().default(true),
  constraints: baseConstraints
    .extend({
      minimum: z.number().optional(),
      maximum: z.number().optional(),
    })
    .optional(),
});

const stringField = baseField.extend({
  type: z.literal("string"),
  format: z.enum(["default", "email", "uri", "binary", "uuid"]).optional(),
  constraints: baseConstraints
    .extend({
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      pattern: z.string().optional(),
    })
    .optional(),
});

const field = z.discriminatedUnion("type", [
  integerField,
  stringField,
  numberField,
  booleanField,
]);

const schema = z.object({
  fields: z.array(field),
  missingValues: z.array(z.string()).optional(),
});

const baseResource = z.object({
  profile: z.literal("tabular-data-resource").optional(),
  name: z.string(),
  schema,
});

const inlineResource = baseResource.extend({
  format: z.literal("inline"),
  data: z.array(z.record(z.coerce.string())),
});

const csvResource = baseResource.extend({
  format: z.literal("csv"),
  path: z.string(),
  dialect: z
    .object({
      delimiter: z.string().default(","),
      lineTerminator: z.string().default("\r\n"),
      quoteChar: z.string().default('"'),
      doubleQuote: z.boolean().default(true),
      header: z.boolean().default(true),
    })
    .optional(),
});

const resource = z.discriminatedUnion("format", [inlineResource, csvResource]);

const dataPackage = z.object({
  profile: z.literal("tabular-data-package").optional(),
  name: z.string(),
  title: z.string().optional(),
  version: z.string().optional(),
  description: z.string().optional(),
  resources: z.array(resource),
});

const fromField = (f: Field): m.Field<m.FieldType> => ({
  name: f.name,
  fieldType: {
    type: "string",
  },
  description: f.description,
  missingValues: f.missingValues,
});

const fromTableResourceInline = (r: InlineResource): m.TableResource => ({
  name: r.name,
  data: r.data,
  fields: r.schema.fields.map(fromField),
  missingValues: r.schema.missingValues,
});

const fromTableResourceCsv =
  (basePath: string) =>
  (r: CsvResource): m.TableResource => ({
    name: r.name,
    data: parse(readFileSync(path.join(basePath, r.path), "utf8"), {
      columns: true,
      skip_empty_lines: true,
    }),
    fields: r.schema.fields.map(fromField),
    missingValues: r.schema.missingValues,
  });

const fromTableResource =
  (basePath: string) =>
  (r: Resource): m.TableResource =>
    match(r)
      .with({ format: "csv" }, fromTableResourceCsv(basePath))
      .with({ format: "inline" }, fromTableResourceInline)
      .exhaustive();

const fromDataPackage = (p: DataPackage, basePath: string): m.Package => ({
  name: p.name,
  version: p.version,
  description: p.description,
  resources: p.resources.map(fromTableResource(basePath)),
});

export type IntegerField = z.infer<typeof integerField>;
export type NumberField = z.infer<typeof numberField>;
export type StringField = z.infer<typeof stringField>;
export type Field = z.infer<typeof field>;
export type Schema = z.infer<typeof schema>;
export type Resource = z.infer<typeof resource>;
export type CsvResource = z.infer<typeof csvResource>;
export type InlineResource = z.infer<typeof inlineResource>;
export type DataPackage = z.infer<typeof dataPackage>;

export { fromDataPackage, dataPackage };
