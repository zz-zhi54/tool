/**
 * 正则表达式测试工具函数。
 *
 * 使用浏览器原生 RegExp API，支持所有标准标志位。
 */

/** 单次匹配结果 */
export interface RegexMatch {
  /** 匹配到的完整文本 */
  text: string;
  /** 匹配在原文中的起始位置 */
  index: number;
  /** 捕获组（不含完整匹配） */
  groups: string[];
}

/** 正则测试结果 */
export interface RegexTestResult {
  /** 是否执行成功 */
  success: boolean;
  /** 所有匹配项 */
  matches: RegexMatch[];
  /** 错误信息（正则语法错误时） */
  errorMessage?: string;
}

/**
 * 正则语法校验结果。
 */
export interface RegexValidationResult {
  valid: boolean;
  empty: boolean;
  errorMessage?: string;
}

/**
 * 校验正则表达式语法是否合法。
 *
 * 空 pattern 不视为错误，避免用户刚打开工具时看到红色提示。
 */
export function validateRegex(pattern: string): RegexValidationResult {
  const trimmed = pattern.trim();

  if (trimmed.length === 0) {
    return { valid: false, empty: true };
  }

  try {
    new RegExp(trimmed);
    return { valid: true, empty: false };
  } catch (error) {
    return {
      valid: false,
      empty: false,
      errorMessage: error instanceof Error ? error.message : "正则语法错误",
    };
  }
}

/**
 * 执行正则匹配测试。
 *
 * 使用 matchAll 获取所有匹配项（需要 g 标志），或单次 match。
 * 每个匹配项包含完整匹配文本、位置和捕获组。
 */
export function testRegex(
  pattern: string,
  flags: string,
  testString: string,
): RegexTestResult {
  const trimmedPattern = pattern.trim();

  if (trimmedPattern.length === 0) {
    return { success: true, matches: [] };
  }

  let regex: RegExp;

  try {
    // 确保 g 标志存在，以便获取所有匹配
    const effectiveFlags = flags.includes("g") ? flags : flags + "g";
    regex = new RegExp(trimmedPattern, effectiveFlags);
  } catch (error) {
    return {
      success: false,
      matches: [],
      errorMessage: error instanceof Error ? error.message : "正则语法错误",
    };
  }

  if (testString.length === 0) {
    return { success: true, matches: [] };
  }

  const matches: RegexMatch[] = [];

  try {
    for (const match of testString.matchAll(regex)) {
      matches.push({
        text: match[0],
        index: match.index,
        // 捕获组：从第二个元素开始（第一个是完整匹配）
        groups: match.slice(1),
      });
    }
  } catch (error) {
    return {
      success: false,
      matches: [],
      errorMessage: error instanceof Error ? error.message : "匹配过程出错",
    };
  }

  return { success: true, matches };
}
