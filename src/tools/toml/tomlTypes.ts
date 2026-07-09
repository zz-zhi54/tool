/** 文本基础统计 */
export interface TomlTextStats {
  bytes: number;
  characters: number;
  lines: number;
}

/** TOML 校验结果 */
export interface TomlValidationResult {
  valid: boolean;
  empty: boolean;
  errorMessage?: string;
}

/** TOML 处理结果 */
export interface TomlProcessResult {
  success: boolean;
  output: string;
  validation: TomlValidationResult;
  stats: TomlTextStats;
  value?: unknown;
}
