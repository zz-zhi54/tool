/**
 * 文本 Diff 工具函数。
 *
 * 行级 diff，使用经典 LCS（最长公共子序列）算法。
 * 对 1k 行左右输入足够流畅；超过 5k 行建议分块。
 */

/** 单行差异类型 */
export type DiffLineType = "equal" | "added" | "removed";

/** 单行 diff 结果 */
export interface DiffLine {
  type: DiffLineType;
  text: string;
  /** 旧文本中的行号（1-based），无则 undefined */
  oldLineNo?: number;
  /** 新文本中的行号（1-based），无则 undefined */
  newLineNo?: number;
}

/** Diff 结果汇总 */
export interface DiffResult {
  lines: DiffLine[];
  addedCount: number;
  removedCount: number;
  equalCount: number;
}

/** Diff 选项 */
export interface DiffOptions {
  /** 是否忽略首尾空白 */
  ignoreWhitespace: boolean;
}

/**
 * 计算两段文本的行级 diff。
 */
export function computeLineDiff(
  oldText: string,
  newText: string,
  options: DiffOptions = { ignoreWhitespace: false },
): DiffResult {
  const oldLines = splitLines(oldText);
  const newLines = splitLines(newText);

  const opcodes = lcsDiff(
    options.ignoreWhitespace ? oldLines.map(trim) : oldLines,
    options.ignoreWhitespace ? newLines.map(trim) : newLines,
  );

  const result: DiffLine[] = [];
  let addedCount = 0;
  let removedCount = 0;
  let equalCount = 0;

  for (const op of opcodes) {
    if (op.type === "equal") {
      for (let k = 0; k < op.length; k++) {
        result.push({
          type: "equal",
          text: oldLines[op.oldStart + k] ?? "",
          oldLineNo: op.oldStart + k + 1,
          newLineNo: op.newStart + k + 1,
        });
        equalCount += 1;
      }
    } else if (op.type === "remove") {
      for (let k = 0; k < op.length; k++) {
        result.push({
          type: "removed",
          text: oldLines[op.oldStart + k] ?? "",
          oldLineNo: op.oldStart + k + 1,
        });
        removedCount += 1;
      }
    } else if (op.type === "add") {
      for (let k = 0; k < op.length; k++) {
        result.push({
          type: "added",
          text: newLines[op.newStart + k] ?? "",
          newLineNo: op.newStart + k + 1,
        });
        addedCount += 1;
      }
    }
  }

  return { lines: result, addedCount, removedCount, equalCount };
}

interface Opcode {
  type: "equal" | "add" | "remove";
  oldStart: number;
  newStart: number;
  length: number;
}

function splitLines(text: string): string[] {
  if (text.length === 0) return [];
  return text.split(/\r\n|\r|\n/);
}

function trim(s: string): string {
  return s.replace(/^\s+|\s+$/g, "");
}

/**
 * 基于 LCS 的 diff：先求出 LCS 长度表，再回溯得到操作序列。
 */
function lcsDiff(oldArr: string[], newArr: string[]): Opcode[] {
  const m = oldArr.length;
  const n = newArr.length;

  // 长度表
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldArr[i - 1] === newArr[j - 1]) {
        dp[i][j] = (dp[i - 1][j - 1] ?? 0) + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j] ?? 0, dp[i][j - 1] ?? 0);
      }
    }
  }

  // 回溯
  const opcodes: Opcode[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldArr[i - 1] === newArr[j - 1]) {
      pushOpcode(opcodes, "equal", i - 1, j - 1, 1);
      i -= 1;
      j -= 1;
    } else if (
      j > 0 &&
      (i === 0 || (dp[i][j - 1] ?? 0) >= (dp[i - 1][j] ?? 0))
    ) {
      pushOpcode(opcodes, "add", i, j - 1, 1);
      j -= 1;
    } else if (i > 0) {
      pushOpcode(opcodes, "remove", i - 1, j, 1);
      i -= 1;
    }
  }

  // 回溯得到的是逆序，需要翻转；同时合并相邻同类操作
  return mergeOpcodes(opcodes.reverse());
}

function pushOpcode(
  stack: Opcode[],
  type: Opcode["type"],
  oldStart: number,
  newStart: number,
  length: number,
) {
  stack.push({ type, oldStart, newStart, length });
}

function mergeOpcodes(arr: Opcode[]): Opcode[] {
  if (arr.length === 0) return [];
  const merged: Opcode[] = [];
  for (const op of arr) {
    const last = merged[merged.length - 1];
    if (last && last.type === op.type) {
      last.length += op.length;
    } else {
      merged.push({ ...op });
    }
  }
  return merged;
}
