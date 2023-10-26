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

export type Field = {
  name: string;
  fieldType: FieldType;
  description?: string;
  required?: boolean;
  unique?: boolean;
  missingValues?: string[];
};

export type TableResource = {
  name: string;
  description?: string;
  fields: Field[];
  data: Array<Record<string, string>>;
};

export type Package = {
  name: string;
  description?: string;
  resources: TableResource[];
};
