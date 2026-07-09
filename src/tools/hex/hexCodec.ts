/**
 * Hex（十六进制）编解码工具函数。
 *
 * 与 Base64 codec 行为对齐：UTF-8 字符串 ↔ 十六进制字节串。
 */

/** Hex 校验结果 */
export interface HexValidationResult {
  valid: boolean;
  empty: boolean;
  errorMessage?: string;
}

/**
 * 将 UTF-8 文本编码为十六进制字符串。
 *
 * 步骤：TextEncoder → bytes → 每个字节 2 位十六进制（无分隔符）。
 */
export function encodeHex(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

/**
 * 将十六进制字符串解码为 UTF-8 文本。
 *
 * 允许输入带有空格、换行等分隔符，函数会先剥离再解析。
 */
export function decodeHex(input: string): string {
  const cleaned = input.replace(/[\s-]/g, "").toLowerCase();
  if (cleaned.length % 2 !== 0) {
    throw new Error("Hex 字符串长度为奇数");
  }
  if (!/^[0-9a-f]*$/.test(cleaned)) {
    throw new Error("包含非法 Hex 字符");
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes[i / 2] = parseInt(cleaned.substring(i, i + 2), 16);
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

/** 校验 Hex 输入是否合法。 */
export function validateHex(input: string): HexValidationResult {
  const cleaned = input.replace(/[\s-]/g, "").toLowerCase();
  if (cleaned.length === 0) {
    return { valid: false, empty: true };
  }
  if (cleaned.length % 2 !== 0) {
    return {
      valid: false,
      empty: false,
      errorMessage: `长度 ${cleaned.length} 不是 2 的倍数`,
    };
  }
  if (!/^[0-9a-f]*$/.test(cleaned)) {
    return {
      valid: false,
      empty: false,
      errorMessage: "包含非法 Hex 字符",
    };
  }
  return { valid: true, empty: false };
}
