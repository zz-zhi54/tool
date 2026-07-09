/**
 * 行处理工具函数。
 *
 * 支持的步骤（按固定顺序串行应用）：
 * 1. trim      每行去掉首尾空白
 * 2. removeEmpty 移除空白行
 * 3. sort      排序（升序或降序）
 * 4. dedupe    去重（基于 trim 后的内容）
 */

export interface LineOpsOptions {
  trim: boolean;
  removeEmpty: boolean;
  sort: "none" | "asc" | "desc";
  dedupe: boolean;
}

export interface LineOpsResult {
  /** 处理后的行（不含尾随换行） */
  lines: string[];
  /** 输入行数 */
  originalCount: number;
  /** 输出行数 */
  resultCount: number;
}

export function applyLineOps(
  input: string,
  options: LineOpsOptions,
): LineOpsResult {
  const original = splitLines(input);
  const originalCount = original.length;

  let lines = original;

  if (options.trim) {
    lines = lines.map((line) => line.trim());
  }

  if (options.removeEmpty) {
    lines = lines.filter((line) => line.length > 0);
  }

  if (options.sort !== "none") {
    const sorted = [...lines].sort((a, b) => {
      // 数字按数值排，字符串按 locale 排
      const na = Number(a);
      const nb = Number(b);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) {
        return options.sort === "asc" ? na - nb : nb - na;
      }
      return options.sort === "asc" ? a.localeCompare(b) : b.localeCompare(a);
    });
    lines = sorted;
  }

  if (options.dedupe) {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const line of lines) {
      if (!seen.has(line)) {
        seen.add(line);
        result.push(line);
      }
    }
    lines = result;
  }

  return {
    lines,
    originalCount,
    resultCount: lines.length,
  };
}

function splitLines(text: string): string[] {
  if (text.length === 0) return [];
  return text.split(/\r\n|\r|\n/);
}
