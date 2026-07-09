/**
 * 日期计算工具函数。
 *
 * 两种模式：
 * 1. 间隔：计算两个日期之间相差多少年/月/日/小时/分/秒。
 * 2. 加减：对一个日期加减 N 个时间单位，得到新日期。
 */

/** 时间单位 */
export type DateUnit = "year" | "month" | "day" | "hour" | "minute" | "second";

/** 加减运算选项 */
export interface DateAddOptions {
  date: string;
  delta: number;
  unit: DateUnit;
}

/** 加减结果 */
export interface DateAddResult {
  success: boolean;
  output?: string;
  outputIso?: string;
  weekday?: string;
  errorMessage?: string;
}

/** 两个日期间的间隔结果 */
export interface DateDiffResult {
  success: boolean;
  errorMessage?: string;

  /** 绝对差（毫秒） */
  diffMs?: number;
  /** 正负方向：1 表示 from < to，-1 表示 from > to */
  direction?: 1 | -1;
  /** 差值换算（取整） */
  totalSeconds?: number;
  totalMinutes?: number;
  totalHours?: number;
  totalDays?: number;
  /** 自适应人类可读（"2 年 3 个月 4 天"） */
  humanReadable?: string;
  /** 工作日差（排除周六周日） */
  weekdays?: number;
}

/** 把任意输入解析为 Date，无效返回 null。 */
export function parseDateInput(input: string): Date | null {
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;

  // yyyy-mm-dd 形式按本地日期解析（不参与时区换算）
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (ymd) {
    const [, y, m, d] = ymd;
    const date = new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0);
    return isNaN(date.getTime()) ? null : date;
  }

  // 纯数字时间戳
  if (/^\d+$/.test(trimmed)) {
    const num = Number(trimmed);
    if (trimmed.length === 10) return new Date(num * 1000);
    if (trimmed.length === 13) return new Date(num);
  }

  const parsed = new Date(trimmed);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/** 把 Date 格式化为 yyyy-MM-dd 字符串。 */
export function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 把 Date 格式化为 yyyy-MM-dd HH:mm:ss 字符串。 */
export function formatDateTime(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

const WEEKDAY_LABELS = [
  "星期日",
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
];

/**
 * 计算 from → to 的差值。
 *
 * from 和 to 都解析为 Date 后求差，按绝对值给出人类可读拆解。
 */
export function diffDates(fromInput: string, toInput: string): DateDiffResult {
  const from = parseDateInput(fromInput);
  const to = parseDateInput(toInput);

  if (!from || !to) {
    return { success: false, errorMessage: "无法解析日期输入" };
  }

  const diffMs = to.getTime() - from.getTime();
  const absMs = Math.abs(diffMs);
  const direction: 1 | -1 = diffMs >= 0 ? 1 : -1;

  const totalSeconds = Math.floor(absMs / 1000);
  const totalMinutes = Math.floor(absMs / 60_000);
  const totalHours = Math.floor(absMs / 3_600_000);
  const totalDays = Math.floor(absMs / 86_400_000);

  // 工作日差：从 from 到 to 之间（不含 from，含 to）出现的工作日数量。
  // 仅在两端都是日期级别（差值跨日）时有意义，秒级差时退化为 0。
  const weekdays = countWeekdays(from, to);

  return {
    success: true,
    diffMs,
    direction,
    totalSeconds,
    totalMinutes,
    totalHours,
    totalDays,
    humanReadable: humanizeDiff(absMs),
    weekdays,
  };
}

function countWeekdays(from: Date, to: Date): number {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);

  let count = 0;
  const cursor = new Date(start);
  const forward = end >= start;
  while ((forward && cursor <= end) || (!forward && cursor >= end)) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) count += 1;
    cursor.setDate(cursor.getDate() + (forward ? 1 : -1));
  }
  return count;
}

function humanizeDiff(absMs: number): string {
  if (absMs < 1000) return "小于 1 秒";

  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const MONTH = 30 * DAY;
  const YEAR = 365 * DAY;

  const parts: string[] = [];
  let remaining = absMs;

  const years = Math.floor(remaining / YEAR);
  if (years > 0) {
    parts.push(`${years} 年`);
    remaining -= years * YEAR;
  }
  const months = Math.floor(remaining / MONTH);
  if (months > 0) {
    parts.push(`${months} 个月`);
    remaining -= months * MONTH;
  }
  const days = Math.floor(remaining / DAY);
  if (days > 0) {
    parts.push(`${days} 天`);
    remaining -= days * DAY;
  }
  const hours = Math.floor(remaining / HOUR);
  if (hours > 0) {
    parts.push(`${hours} 小时`);
    remaining -= hours * HOUR;
  }
  const minutes = Math.floor(remaining / MINUTE);
  if (minutes > 0) {
    parts.push(`${minutes} 分`);
    remaining -= minutes * MINUTE;
  }
  const seconds = Math.floor(remaining / SECOND);
  if (seconds > 0) {
    parts.push(`${seconds} 秒`);
  }

  return parts.slice(0, 3).join(" ") || "0 秒";
}

/** 对一个日期做加减运算。 */
export function addToDate(opts: DateAddOptions): DateAddResult {
  const base = parseDateInput(opts.date);
  if (!base) {
    return { success: false, errorMessage: "无法解析起始日期" };
  }

  const result = new Date(base);
  switch (opts.unit) {
    case "year":
      result.setFullYear(result.getFullYear() + opts.delta);
      break;
    case "month":
      result.setMonth(result.getMonth() + opts.delta);
      break;
    case "day":
      result.setDate(result.getDate() + opts.delta);
      break;
    case "hour":
      result.setHours(result.getHours() + opts.delta);
      break;
    case "minute":
      result.setMinutes(result.getMinutes() + opts.delta);
      break;
    case "second":
      result.setSeconds(result.getSeconds() + opts.delta);
      break;
  }

  if (isNaN(result.getTime())) {
    return { success: false, errorMessage: "运算结果无效（如超出 Date 范围）" };
  }

  return {
    success: true,
    output: formatDateTime(result),
    outputIso: result.toISOString(),
    weekday: WEEKDAY_LABELS[result.getDay()],
  };
}

/** 把 Date 转为 yyyy-MM-dd HH:mm:ss（用于初始输入）。 */
export function nowAsInput(): string {
  return formatDateTime(new Date());
}
