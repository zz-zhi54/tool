/**
 * Base64 编解码工具函数。
 *
 * 使用 TextEncoder/TextDecoder 处理 UTF-8 字节，确保中文等非 ASCII 字符正确编解码。
 */

/** Base64 校验结果 */
export interface Base64ValidationResult {
  valid: boolean;
  empty: boolean;
  errorMessage?: string;
}

/**
 * 将普通文本编码为 Base64。
 *
 * 通过 TextEncoder 将字符串转为 UTF-8 字节，再用 btoa 编码。
 * 对于超过单字节范围的字符，需要先将字节转为 latin1 字符串才能传给 btoa。
 */
export function encodeBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  // 将 Uint8Array 转为 latin1 字符串，每个字节映射为一个字符
  const latin1 = Array.from(bytes, (byte) => String.fromCharCode(byte)).join(
    "",
  );
  return btoa(latin1);
}

/**
 * 将 Base64 解码为普通文本。
 *
 * 先用 atob 解码为 latin1 字符串，再通过 TextDecoder 按 UTF-8 解码。
 */
export function decodeBase64(input: string): string {
  const latin1 = atob(input.trim());
  // 将 latin1 字符串转回字节数组
  const bytes = Uint8Array.from(latin1, (char) => char.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

/**
 * 校验输入是否是合法的 Base64 字符串。
 *
 * Base64 由 A-Z、a-z、0-9、+、/ 组成，末尾可有 0-2 个 = 填充。
 * 空输入返回 empty 状态，不视为错误。
 */
export function validateBase64(input: string): Base64ValidationResult {
  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return { valid: false, empty: true };
  }

  // Base64 正则：长度必须是 4 的倍数（含填充），或无填充时为合法余数
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;

  if (!base64Regex.test(trimmed)) {
    return { valid: false, empty: false, errorMessage: "包含非法 Base64 字符" };
  }

  // 长度校验：Base64 编码后长度一定是 4 的倍数
  if (trimmed.length % 4 !== 0) {
    return {
      valid: false,
      empty: false,
      errorMessage: `长度 ${trimmed.length} 不是 4 的倍数`,
    };
  }

  // 实际尝试解码来验证内容合法性
  try {
    atob(trimmed);
    return { valid: true, empty: false };
  } catch {
    return { valid: false, empty: false, errorMessage: "Base64 解码失败" };
  }
}
