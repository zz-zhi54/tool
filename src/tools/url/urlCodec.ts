/**
 * URL 百分号编码工具函数。
 *
 * 基于浏览器原生 encodeURIComponent / decodeURIComponent。
 * 编码：把任意字符串编码为 application/x-www-form-urlencoded 形式。
 * 解码：反过来。
 */

/** URL 编码校验结果 */
export interface UrlValidationResult {
  valid: boolean;
  empty: boolean;
  errorMessage?: string;
}

/**
 * 将普通文本编码为 percent-encoded 字符串。
 *
 * 使用 encodeURIComponent 全量转义（含 `!`, `'`, `(`, `)`, `*` 等保留字符）。
 */
export function encodeUrl(input: string): string {
  return encodeURIComponent(input);
}

/**
 * 将 percent-encoded 字符串解码为普通文本。
 *
 * 对 + 和 %20 都视作空格（兼容 query string 与 form body）。
 */
export function decodeUrl(input: string): string {
  const trimmed = input.trim();
  // 兼容 + 编码的空格（典型于 application/x-www-form-urlencoded）
  const normalized = trimmed.replace(/\+/g, "%20");
  return decodeURIComponent(normalized);
}

/**
 * 校验输入是否能被解码。
 * 仅做语法判断（decodeURIComponent 不抛异常则视为合法）。
 */
export function validateUrl(input: string): UrlValidationResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { valid: false, empty: true };
  }

  try {
    const normalized = trimmed.replace(/\+/g, "%20");
    decodeURIComponent(normalized);
    return { valid: true, empty: false };
  } catch (error) {
    return {
      valid: false,
      empty: false,
      errorMessage: error instanceof Error ? error.message : "URL 编码不合法",
    };
  }
}
