import { parse, stringify } from "smol-toml";

import type {
  TomlProcessResult,
  TomlTextStats,
  TomlValidationResult,
} from "./tomlTypes";

/**
 * TOML 格式化工具函数。
 *
 * 解析与序列化均使用 smol-toml。
 */

/** 统计文本基础信息。 */
export function getTomlTextStats(input: string): TomlTextStats {
  return {
    bytes: new TextEncoder().encode(input).length,
    characters: input.length,
    lines: input.length === 0 ? 0 : input.split(/\r\n|\r|\n/).length,
  };
}

/** 校验 TOML 文本是否合法。 */
export function validateToml(input: string): TomlValidationResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { valid: false, empty: true };
  }

  try {
    parse(trimmed);
    return { valid: true, empty: false };
  } catch (error) {
    return {
      valid: false,
      empty: false,
      errorMessage: error instanceof Error ? error.message : "TOML 格式错误",
    };
  }
}

/** 格式化 TOML：parse + stringify（缩进 2）。 */
export function formatToml(input: string): TomlProcessResult {
  const stats = getTomlTextStats(input);
  const validation = validateToml(input);

  if (!validation.valid) {
    return { success: false, output: "", validation, stats };
  }

  try {
    const value = parse(input.trim());
    const output = stringify(value);
    return { success: true, output, validation, stats, value };
  } catch (error) {
    return {
      success: false,
      output: "",
      validation: {
        valid: false,
        empty: false,
        errorMessage:
          error instanceof Error ? error.message : "TOML 格式化失败",
      },
      stats,
    };
  }
}

/** 压缩 TOML：去掉尾部换行，保留关键结构。 */
export function minifyToml(input: string): TomlProcessResult {
  const stats = getTomlTextStats(input);
  const validation = validateToml(input);

  if (!validation.valid) {
    return { success: false, output: "", validation, stats };
  }

  try {
    const value = parse(input.trim());
    const output = stringify(value).trimEnd();
    return { success: true, output, validation, stats, value };
  } catch (error) {
    return {
      success: false,
      output: "",
      validation: {
        valid: false,
        empty: false,
        errorMessage: error instanceof Error ? error.message : "TOML 压缩失败",
      },
      stats,
    };
  }
}
