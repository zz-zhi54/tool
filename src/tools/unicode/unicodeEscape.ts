/**
 * Unicode 转义工具函数。
 *
 * 转义：把任意字符按其码点转写为 \uXXXX（BMP）或 \u{XXXX}（非 BMP）。
 * 反转义：把 \uXXXX、\u{XXXX}、\\u 转回原字符。
 */

/** Unicode 转义校验结果 */
export interface UnicodeValidationResult {
  valid: boolean;
  empty: boolean;
  errorMessage?: string;
}

const SURROGATE_PAIR =
  /\\u\{?[Dd][89A-Fa-f][0-9A-Fa-f]{2}\\u\{?[Dd][C-Fc-f][0-9A-Fa-f]{2}\}?/g;
const ESCAPED_BMP = /\\u\{?([0-9A-Fa-f]{1,6})\}?/g;

/**
 * 把字符串按字符码点转义为 Unicode 转义序列。
 *
 * - BMP 内字符（U+0000 ~ U+FFFF）使用 \uXXXX
 * - 辅助平面字符（U+10000 以上）使用 \u{XXXXX}
 */
export function escapeUnicode(input: string): string {
  let result = "";
  for (const ch of input) {
    const code = ch.codePointAt(0);
    if (code === undefined) continue;

    if (code <= 0xffff) {
      // ASCII 可见字符（含空格）保持原样，避免过度转义
      if (code >= 0x20 && code <= 0x7e) {
        result += ch;
      } else {
        result += `\\u${code.toString(16).padStart(4, "0")}`;
      }
    } else {
      result += `\\u{${code.toString(16)}}`;
    }
  }
  return result;
}

/**
 * 把 Unicode 转义序列还原为字符串。
 *
 * 同时支持 \uXXXX、\u{XXXXX} 与 \\\uXXXX 三种写法。
 */
export function unescapeUnicode(input: string): string {
  const placeholder = "\u0000";
  // 1. \u{XXXXX} 形式
  let result = input.replace(/\\u\{([0-9A-Fa-f]{1,6})\}/g, (_, hex: string) => {
    const code = parseInt(hex, 16);
    try {
      return String.fromCodePoint(code);
    } catch {
      return placeholder;
    }
  });

  // 2. \uXXXX 形式（含 surrogate pair 合并）
  const tokens: string[] = [];
  let i = 0;
  while (i < result.length) {
    const ch = result[i];
    if (ch === "\\" && result[i + 1] === "u") {
      const hex4 = result.substring(i + 2, i + 6);
      if (/^[0-9A-Fa-f]{4}$/.test(hex4)) {
        const high = parseInt(hex4, 16);
        if (high >= 0xd800 && high <= 0xdbff) {
          // high surrogate: 尝试读取后续 low surrogate
          if (result[i + 6] === "\\" && result[i + 7] === "u") {
            const lowHex = result.substring(i + 8, i + 12);
            if (/^[0-9A-Fa-f]{4}$/.test(lowHex)) {
              const low = parseInt(lowHex, 16);
              if (low >= 0xdc00 && low <= 0xdfff) {
                const code = (high - 0xd800) * 0x400 + (low - 0xdc00) + 0x10000;
                tokens.push(String.fromCodePoint(code));
                i += 12;
                continue;
              }
            }
          }
          // 孤立 high surrogate：保留原样
          tokens.push(result.substring(i, i + 6));
          i += 6;
          continue;
        }
        tokens.push(String.fromCharCode(high));
        i += 6;
        continue;
      }
    }
    tokens.push(ch);
    i += 1;
  }
  result = tokens.join("");

  return result;
}

/** 校验转义字符串是否能被还原。 */
export function validateUnicodeEscape(input: string): UnicodeValidationResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { valid: false, empty: true };
  }
  // 至少包含一个 \u 序列才算"看起来像转义文本"
  if (!trimmed.includes("\\u")) {
    return {
      valid: false,
      empty: false,
      errorMessage: "未发现 \\u 转义序列",
    };
  }
  return { valid: true, empty: false };
}

// 导出供测试或其他工具复用（非公共 API）
export const __INTERNAL__ = { SURROGATE_PAIR, ESCAPED_BMP };
