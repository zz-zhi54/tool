/**
 * YAML 工具的类型定义。
 *
 * 与 JSON 工具类型保持一致的风格，方便后续提取公共类型。
 */

/** 文本基础统计 */
export interface YamlTextStats {
  bytes: number;
  characters: number;
  lines: number;
}

/** YAML 校验结果 */
export interface YamlValidationResult {
  valid: boolean;
  empty: boolean;
  errorMessage?: string;
}

/** YAML 处理结果 */
export interface YamlProcessResult {
  success: boolean;
  output: string;
  validation: YamlValidationResult;
  stats: YamlTextStats;
}
