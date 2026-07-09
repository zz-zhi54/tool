/**
 * 时区转换工具函数。
 *
 * 基于浏览器原生 Intl.DateTimeFormat。
 * 目标时区列表使用一份固定常用清单，避免引入全部 ~600 个时区。
 */

/** 单个时区上的转换结果 */
export interface TimezoneRow {
  /** 时区标识（IANA） */
  id: string;
  /** 中文显示名（无对照时回退到 id） */
  label: string;
  /** 该时区的本地时间字符串（中文） */
  localTime: string;
  /** 24h 制时间字符串 */
  time24: string;
  /** 相对当前时间的描述 */
  relativeTime: string;
  /** UTC 偏移（+08:00 等） */
  offset: string;
}

/** 完整解析结果 */
export interface TimezoneConvertResult {
  /** Unix 秒 */
  timestampSeconds: number;
  /** Unix 毫秒 */
  timestampMillis: number;
  /** 源时区 */
  sourceTimezone: string;
  /** 源时区下的本地时间 */
  sourceLocalTime: string;
  /** 目标时区结果列表 */
  rows: TimezoneRow[];
}

/** 常用时区列表（保持精简且覆盖大部分需求） */
export const COMMON_TIMEZONES: { id: string; label: string }[] = [
  { id: "UTC", label: "UTC（协调世界时）" },
  { id: "Asia/Shanghai", label: "上海" },
  { id: "Asia/Tokyo", label: "东京" },
  { id: "Asia/Singapore", label: "新加坡" },
  { id: "Asia/Dubai", label: "迪拜" },
  { id: "Asia/Kolkata", label: "加尔各答" },
  { id: "Europe/London", label: "伦敦" },
  { id: "Europe/Paris", label: "巴黎" },
  { id: "Europe/Berlin", label: "柏林" },
  { id: "Europe/Moscow", label: "莫斯科" },
  { id: "America/New_York", label: "纽约" },
  { id: "America/Chicago", label: "芝加哥" },
  { id: "America/Denver", label: "丹佛" },
  { id: "America/Los_Angeles", label: "洛杉矶" },
  { id: "America/Sao_Paulo", label: "圣保罗" },
  { id: "Australia/Sydney", label: "悉尼" },
  { id: "Pacific/Auckland", label: "奥克兰" },
  { id: "Pacific/Honolulu", label: "檀香山" },
];

/**
 * 解析输入为 Unix 时间戳（毫秒）。
 *
 * - 纯数字：按 10/13 位分别视作秒/毫秒时间戳，其他位正数按毫秒。
 * - 日期字符串（ISO / 自然语言）：直接交给 new Date() 解析。
 *
 * 注：sourceTz 仅用于展示输出（每个目标时区的格式化），不影响输入解析。
 * 这是最不容易出错的实现：用户输入"2024-06-12 12:00:00"被解释为浏览器本地时区
 * 的 12:00，然后展示为各目标时区的对应本地时间。
 */
function parseInputToMillis(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;

  // 纯数字 → 时间戳
  if (/^\d+$/.test(trimmed)) {
    const num = Number(trimmed);
    if (trimmed.length === 10) return num * 1000;
    if (trimmed.length === 13) return num;
    if (num > 0) return num;
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) return parsed.getTime();
  return null;
}

/**
 * 计算 UTC 偏移字符串（形如 +08:00 / -05:00）。
 */
function formatOffset(date: Date, timeZone: string): string {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    });
    const parts = fmt.formatToParts(date);
    const offset = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    // offset 形如 "GMT+8" 或 "GMT+08:00"
    const match = offset.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!match) return offset;
    const [, sign, h, m] = match;
    return `${sign}${h.padStart(2, "0")}:${(m ?? "00").padStart(2, "0")}`;
  } catch {
    return "";
  }
}

/**
 * 格式化指定时区下的本地时间（24h 中文）。
 */
function formatLocal(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

function formatTime24(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);
  } catch {
    return "";
  }
}

function formatRelative(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const MONTH = 30 * DAY;
  const YEAR = 365 * DAY;
  const isFuture = diffMs > 0;

  let text: string;
  if (abs < MINUTE) text = `${Math.floor(abs / SECOND)} 秒`;
  else if (abs < HOUR) text = `${Math.floor(abs / MINUTE)} 分钟`;
  else if (abs < DAY) text = `${Math.floor(abs / HOUR)} 小时`;
  else if (abs < MONTH) text = `${Math.floor(abs / DAY)} 天`;
  else if (abs < YEAR) text = `${Math.floor(abs / MONTH)} 个月`;
  else text = `${Math.floor(abs / YEAR)} 年`;
  return isFuture ? `${text}后` : `${text}前`;
}

/**
 * 主入口：把输入时间戳按源时区解释，生成目标时区列表。
 */
export function convertTimezone(
  input: string,
  sourceTimezone: string,
  targets: { id: string; label: string }[] = COMMON_TIMEZONES,
): TimezoneConvertResult | null {
  const millis = parseInputToMillis(input);
  if (millis === null) return null;

  const date = new Date(millis);
  return {
    timestampSeconds: Math.floor(millis / 1000),
    timestampMillis: millis,
    sourceTimezone,
    sourceLocalTime: formatLocal(date, sourceTimezone),
    rows: targets.map((t) => ({
      id: t.id,
      label: t.label,
      localTime: formatLocal(date, t.id),
      time24: formatTime24(date, t.id),
      relativeTime: formatRelative(date),
      offset: formatOffset(date, t.id),
    })),
  };
}

/** 当前时间。 */
export function getCurrentMillis(): number {
  return Date.now();
}
