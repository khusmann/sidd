export type EnumIntegerLevel = {
  value: number | string;
  label?: string;
};

export type EnumIntegerFieldType = {
  type: "enum_integer";
  levels: EnumIntegerLevel[];
  ordered?: boolean;
};

export type EnumStringFieldType = {
  type: "enum_string";
  levels: string[];
  ordered?: boolean;
};

export type IntegerFieldType = {
  type: "integer";
  minimum?: number;
  maximum?: number;
};

export type NumberFieldType = {
  type: "number";
  minimum?: number;
  maximum?: number;
};

export type StringFieldType = {
  type: "string";
  minLength?: number;
  maxLength?: number;
};

export type FieldType =
  | IntegerFieldType
  | NumberFieldType
  | StringFieldType
  | EnumIntegerFieldType
  | EnumStringFieldType;

export type Field<FieldT extends FieldType> = {
  name: string;
  fieldType: FieldT;
  description?: string;
  required?: boolean;
  unique?: boolean;
  missingValues?: string[];
};

export type AnyField = Field<FieldType>;

export type TableResource = {
  name: string;
  description?: string;
  fields: AnyField[];
  data: Array<Record<string, string>>;
  missingValues?: string[];
  filterVariable?: string;
  primaryKey?: string[];
};

export type Package = {
  name: string;
  version?: string;
  description?: string;
  resources: TableResource[];
};
