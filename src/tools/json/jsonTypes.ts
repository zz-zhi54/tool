export type JsonPrimitive = string | number | boolean | null;

export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface TextStats {
  bytes: number;
  characters: number;
  lines: number;
}

export interface JsonValidationResult {
  valid: boolean;
  empty: boolean;
  errorMessage?: string;
}

export interface JsonProcessResult {
  success: boolean;
  output: string;
  value?: JsonValue;
  validation: JsonValidationResult;
  stats: TextStats;
}
