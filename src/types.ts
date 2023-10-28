export type Variable<T extends VariableStats> = {
  id: number;
  name: string;
  description: string;
  type: string;
  num_valid: number;
  num_missing: number;
  group: string;
  stats: T;
  missingness: MissingnessStats[];
};

export type TextVariableStats = {
  stype: "text";
};

export type CategoricalVariableItemStats = {
  label: string;
  value: number;
  text: string;
  count: number;
  pct: number;
};

export type CategoricalVariableStats = {
  stype: "categorical";
  items: CategoricalVariableItemStats[];
};

export type ContinousVariableFreqItem = {
  min: number;
  max: number;
  count: number;
};

export type ContinuousVariableStats = {
  stype: "real";
  min: number;
  max: number;
  mean: number;
  sd: number;
  freqs: ContinousVariableFreqItem[];
};

export type VariableStats =
  | TextVariableStats
  | CategoricalVariableStats
  | ContinuousVariableStats;

export type MissingnessStats = {
  label: string;
  count: number;
  pct: number;
};
