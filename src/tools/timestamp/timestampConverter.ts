/**
 * 时间戳转换工具函数。
 *
 * 支持 Unix 时间戳（秒级和毫秒级）与可读日期之间的双向转换。
 * 所有日期操作基于浏览器原生 Date API。
 */

/** 时间戳解析结果 */
export interface TimestampParseResult {
  /** 是否解析成功 */
  success: boolean;
  /** 秒级 Unix 时间戳 */
  timestampSeconds: number;
  /** 毫秒级 Unix 时间戳 */
  timestampMillis: number;
  /** ISO 8601 格式 */
  iso8601: string;
  /** 本地时间（中文格式） */
  localTime: string;
  /** UTC 时间 */
  utcTime: string;
  /** 相对当前时间的描述 */
  relativeTime: string;
}

/** 当前时间信息 */
export interface CurrentTime {
  timestampSeconds: number;
  timestampMillis: number;
  iso8601: string;
  localTime: string;
}

/**
 * 获取当前时间的时间戳和格式化信息。
 */
export function getCurrentTime(): CurrentTime {
  const now = new Date();

  return {
    timestampSeconds: Math.floor(now.getTime() / 1000),
    timestampMillis: now.getTime(),
    iso8601: now.toISOString(),
    localTime: formatLocalTime(now),
  };
}

/**
 * 解析输入并返回多种格式的时间信息。
 *
 * 自动检测输入类型：
 * - 纯数字且 10 位 → 秒级时间戳
 * - 纯数字且 13 位 → 毫秒级时间戳
 * - 其他 → 尝试作为日期字符串解析
 */
export function parseTimestamp(input: string): TimestampParseResult | null {
  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const date = tryParseDate(trimmed);

  if (!date || isNaN(date.getTime())) {
    return null;
  }

  const millis = date.getTime();
  const seconds = Math.floor(millis / 1000);

  return {
    success: true,
    timestampSeconds: seconds,
    timestampMillis: millis,
    iso8601: date.toISOString(),
    localTime: formatLocalTime(date),
    utcTime: date.toUTCString(),
    relativeTime: formatRelativeTime(date),
  };
}

/**
 * 尝试将输入解析为 Date 对象。
 *
 * 支持纯数字时间戳和标准日期字符串。
 */
function tryParseDate(input: string): Date | null {
  // 纯数字 → 时间戳
  if (/^\d+$/.test(input)) {
    const num = Number(input);

    // 10 位数字 → 秒级时间戳
    if (input.length === 10) {
      return new Date(num * 1000);
    }

    // 13 位数字 → 毫秒级时间戳
    if (input.length === 13) {
      return new Date(num);
    }

    // 其他位数的数字：尝试按毫秒解析
    if (num > 0) {
      return new Date(num);
    }
  }

  // 尝试作为日期字符串解析
  const parsed = new Date(input);

  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

/**
 * 格式化为中文本地时间。
 *
 * 使用 toLocaleString 保证输出符合中文日期格式习惯。
 */
function formatLocalTime(date: Date): string {
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/**
 * 格式化相对时间描述。
 *
 * 根据时间差自动选择合适的单位（秒、分钟、小时、天、月、年）。
 */
function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const absDiff = Math.abs(diffMs);
  const isFuture = diffMs < 0;

  // 各时间单位的毫秒数
  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const MONTH = 30 * DAY;
  const YEAR = 365 * DAY;

  let text: string;

  if (absDiff < MINUTE) {
    text = `${Math.floor(absDiff / SECOND)} 秒`;
  } else if (absDiff < HOUR) {
    text = `${Math.floor(absDiff / MINUTE)} 分钟`;
  } else if (absDiff < DAY) {
    text = `${Math.floor(absDiff / HOUR)} 小时`;
  } else if (absDiff < MONTH) {
    text = `${Math.floor(absDiff / DAY)} 天`;
  } else if (absDiff < YEAR) {
    text = `${Math.floor(absDiff / MONTH)} 个月`;
  } else {
    text = `${Math.floor(absDiff / YEAR)} 年`;
  }

  return isFuture ? `${text}后` : `${text}前`;
}
