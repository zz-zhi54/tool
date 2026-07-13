/**
 * localStorage 集中管理模块。
 *
 * 当前仅保留「真正的用户偏好」持久化；UI 相关的临时状态（分栏比例等）
 * 由各组件自行管理，不进入设置页。
 */

// ── Keys ──────────────────────────────────────────────

/** 正则测试器默认 flags */
export const REGEX_FLAGS_KEY = "regex-tester:flags";

/** SQL IN 生成器默认引号风格 */
export const SQL_QUOTE_KEY = "sql-generator:quote";

// ── 基础读写 ──────────────────────────────────────────

export function load<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function remove(key: string): void {
  localStorage.removeItem(key);
}

// ── 设置页元数据 ──────────────────────────────────────

/** 设置顶层分组（当前只有 SQL IN 生成器偏好） */
export type SettingGroup = "sqlGenerator";

export interface SettingGroupMeta {
  id: SettingGroup;
  title: string;
  description: string;
}

export interface SettingMeta {
  key: string;
  label: string;
  description?: string;
  group: SettingGroup;
  defaultValue: unknown;
  control:
    | { type: "toggle"; options: { title: string; value: string }[] }
    | {
        type: "checkboxes";
        options: { title: string; value: string; description?: string }[];
      };
}

export interface SettingSnapshot {
  key: string;
  label: string;
  description?: string;
  group: SettingGroup;
  value: unknown;
  defaultValue: unknown;
  control: SettingMeta["control"];
  display: string;
  defaultDisplay: string;
  isDefault: boolean;
}

export const SETTINGS: SettingMeta[] = [
  {
    key: SQL_QUOTE_KEY,
    label: "默认引号风格",
    description: "SQL IN 生成器默认使用的包裹引号",
    group: "sqlGenerator",
    defaultValue: '"',
    control: {
      type: "toggle",
      options: [
        { title: '""', value: '"' },
        { title: "''", value: "'" },
      ],
    },
  },
];

export const SETTING_GROUPS: SettingGroupMeta[] = [
  {
    id: "sqlGenerator",
    title: "SQL IN 生成器",
    description: "生成 SQL IN 语句时使用的默认引号风格。",
  },
];

function fmt(v: unknown): string {
  if (typeof v === "string") return v;
  return JSON.stringify(v);
}

/** 获取所有设置项的当前快照，设置页通过它渲染控件。 */
export function getSettings(): SettingSnapshot[] {
  return SETTINGS.map((item) => {
    const value = load(item.key, item.defaultValue);
    return {
      ...item,
      value,
      display: fmt(value),
      defaultDisplay: fmt(item.defaultValue),
      isDefault: JSON.stringify(value) === JSON.stringify(item.defaultValue),
    };
  });
}

// ── 工具专用类型 ──────────────────────────────────────

export const REGEX_FLAG_KEYS = ["g", "i", "m", "s", "u"] as const;
export type RegexFlag = (typeof REGEX_FLAG_KEYS)[number];
export type RegexFlagsPreference = Record<RegexFlag, boolean>;

export type SqlQuoteStyle = '"' | "'";
