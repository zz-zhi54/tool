import type {
  JsonProcessResult,
  JsonValidationResult,
  JsonValue,
  TextStats,
} from "./jsonTypes";

/**
 * 统计文本基础信息。
 *
 * 顶部状态栏和右侧检查器都会使用这些信息，因此放在纯函数中统一计算。
 */
export function getTextStats(input: string): TextStats {
  return {
    bytes: new TextEncoder().encode(input).length,
    characters: input.length,
    // 空输入显示为 0 行；非空输入按换行符数量计算实际行数。
    lines: input.length === 0 ? 0 : input.split(/\r\n|\r|\n/).length,
  };
}

/**
 * 校验 JSON 文本是否合法。
 *
 * 空输入不视为错误，避免用户刚打开工具或清空内容时立刻看到红色错误。
 */
export function validateJson(input: string): JsonValidationResult {
  const trimmedInput = input.trim();

  if (trimmedInput.length === 0) {
    return {
      valid: false,
      empty: true,
    };
  }

  try {
    JSON.parse(trimmedInput);

    return {
      valid: true,
      empty: false,
    };
  } catch (error) {
    return {
      valid: false,
      empty: false,
      // JSON.parse 的错误文本在不同运行时可能略有差异，第一版先展示原始 message。
      errorMessage: error instanceof Error ? error.message : "JSON 格式错误",
    };
  }
}

/**
 * 格式化 JSON 文本。
 *
 * 通过 parse + stringify 完成格式化，这样可以在同一步里完成语法校验。
 */
export function formatJson(input: string): JsonProcessResult {
  const stats = getTextStats(input);
  const validation = validateJson(input);

  if (!validation.valid) {
    return {
      success: false,
      output: "",
      validation,
      stats,
    };
  }

  const parsedValue = JSON.parse(input.trim()) as JsonValue;

  return {
    success: true,
    output: JSON.stringify(parsedValue, null, 2),
    value: parsedValue,
    validation,
    stats,
  };
}

/**
 * 压缩 JSON 文本。
 *
 * 压缩会移除多余空白字符，适合复制到配置、接口参数或日志字段中。
 */
export function minifyJson(input: string): JsonProcessResult {
  const stats = getTextStats(input);
  const validation = validateJson(input);

  if (!validation.valid) {
    return {
      success: false,
      output: "",
      validation,
      stats,
    };
  }

  const parsedValue = JSON.parse(input.trim()) as JsonValue;

  return {
    success: true,
    output: JSON.stringify(parsedValue),
    value: parsedValue,
    validation,
    stats,
  };
}
