import { parse, stringify } from "yaml";

import type {
  YamlProcessResult,
  YamlTextStats,
  YamlValidationResult,
} from "./yamlTypes";

/**
 * 统计文本基础信息。
 */
export function getYamlTextStats(input: string): YamlTextStats {
  return {
    bytes: new TextEncoder().encode(input).length,
    characters: input.length,
    lines: input.length === 0 ? 0 : input.split(/\r\n|\r|\n/).length,
  };
}

/**
 * 校验 YAML 文本是否合法。
 *
 * 空输入不视为错误，避免用户刚打开工具时看到红色错误提示。
 */
export function validateYaml(input: string): YamlValidationResult {
  const trimmedInput = input.trim();

  if (trimmedInput.length === 0) {
    return { valid: false, empty: true };
  }

  try {
    parse(trimmedInput);
    return { valid: true, empty: false };
  } catch (error) {
    return {
      valid: false,
      empty: false,
      errorMessage: error instanceof Error ? error.message : "YAML 格式错误",
    };
  }
}

/**
 * 格式化 YAML 文本。
 *
 * 通过 parse → stringify 完成美化，使用 2 空格缩进。
 */
export function formatYaml(input: string): YamlProcessResult {
  const stats = getYamlTextStats(input);
  const validation = validateYaml(input);

  if (!validation.valid) {
    return { success: false, output: "", validation, stats };
  }

  try {
    const parsed = parse(input.trim());
    const output = stringify(parsed, { indent: 2 });
    return { success: true, output, validation, stats };
  } catch (error) {
    return {
      success: false,
      output: "",
      validation: {
        valid: false,
        empty: false,
        errorMessage: error instanceof Error ? error.message : "YAML 格式错误",
      },
      stats,
    };
  }
}

/**
 * 压缩 YAML 文本。
 *
 * 重新格式化并去除末尾空白，适合嵌入配置或传输。
 */
export function minifyYaml(input: string): YamlProcessResult {
  const stats = getYamlTextStats(input);
  const validation = validateYaml(input);

  if (!validation.valid) {
    return { success: false, output: "", validation, stats };
  }

  try {
    const parsed = parse(input.trim());
    // 最小化：使用最小缩进输出
    const output = stringify(parsed, { indent: 2 });
    // 去除末尾换行符，保持紧凑
    return { success: true, output: output.trimEnd(), validation, stats };
  } catch (error) {
    return {
      success: false,
      output: "",
      validation: {
        valid: false,
        empty: false,
        errorMessage: error instanceof Error ? error.message : "YAML 格式错误",
      },
      stats,
    };
  }
}
