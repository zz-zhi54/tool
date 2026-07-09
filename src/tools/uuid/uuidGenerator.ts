import { v1, v4, v7, validate } from "uuid";

/**
 * UUID 生成器工具函数。
 *
 * 支持 v1 / v4 / v7 三个版本。
 */

export type UuidVersion = "v1" | "v4" | "v7";

export interface UuidOptions {
  /** 数量（1 ~ 1000） */
  count: number;
  /** 是否使用大写字母 */
  uppercase: boolean;
  /** 是否保留连字符 */
  withHyphens: boolean;
}

export interface UuidBatchResult {
  success: boolean;
  ids: string[];
  errorMessage?: string;
}

/** 生成一批 UUID。 */
export function generateUuidBatch(
  version: UuidVersion,
  opts: UuidOptions,
): UuidBatchResult {
  const count = clamp(opts.count, 1, 1000);
  const ids: string[] = [];

  for (let i = 0; i < count; i++) {
    ids.push(formatOne(generateOne(version), opts));
  }

  return { success: true, ids };
}

function generateOne(version: UuidVersion): string {
  switch (version) {
    case "v1":
      return v1();
    case "v4":
      return v4();
    case "v7":
      return v7();
  }
}

function formatOne(raw: string, opts: UuidOptions): string {
  let result = raw;
  if (!opts.withHyphens) {
    result = result.replace(/-/g, "");
  }
  if (opts.uppercase) {
    result = result.toUpperCase();
  }
  return result;
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

/** 校验字符串是否为合法 UUID（任何版本）。 */
export function isValidUuid(value: string): boolean {
  return validate(value);
}
