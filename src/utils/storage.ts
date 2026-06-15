/**
 * localStorage 集中管理模块。
 *
 * 所有持久化用户偏好在此统一定义。页面只负责消费 key 常量，设置页通过
 * SETTINGS 元数据自动渲染控件。
 */

// ── Keys ──────────────────────────────────────────────

/** 各工具面板宽度比例存储键 */
export const PANEL_KEYS = {
  jsonFormatter: "json-formatter:panel-percent",
  yamlFormatter: "yaml-formatter:panel-percent",
  base64Codec: "base64-codec:panel-percent",
  regexTester: "regex-tester:panel-percent",
  sqlGenerator: "sql-generator:panel-percent",
} as const;

export const REGEX_FLAGS_KEY = "regex-tester:flags";
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

export type SettingGroup = "layout" | "regexTester" | "sqlGenerator";

export interface SettingMeta {
  key: string;
  label: string;
  description?: string;
  group: SettingGroup;
  defaultValue: unknown;
  control:
    | {
        type: "slider";
        min: number;
        max: number;
        step: number;
        suffix?: string;
      }
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

const SLIDER = {
  type: "slider" as const,
  min: 15,
  max: 85,
  step: 1,
  suffix: "%",
};

export const SETTINGS: SettingMeta[] = [
  {
    key: PANEL_KEYS.jsonFormatter,
    label: "JSON 格式化",
    description: "输入面板宽度",
    group: "layout",
    defaultValue: 40,
    control: SLIDER,
  },
  {
    key: PANEL_KEYS.yamlFormatter,
    label: "YAML 格式化",
    description: "输入面板宽度",
    group: "layout",
    defaultValue: 40,
    control: SLIDER,
  },
  {
    key: PANEL_KEYS.base64Codec,
    label: "Base64 编解码",
    description: "输入面板宽度",
    group: "layout",
    defaultValue: 40,
    control: SLIDER,
  },
  {
    key: PANEL_KEYS.regexTester,
    label: "正则测试",
    description: "输入面板宽度",
    group: "layout",
    defaultValue: 40,
    control: SLIDER,
  },
  {
    key: PANEL_KEYS.sqlGenerator,
    label: "SQL IN 生成器",
    description: "输入面板宽度",
    group: "layout",
    defaultValue: 40,
    control: SLIDER,
  },
  {
    key: REGEX_FLAGS_KEY,
    label: "默认正则标志",
    description: "打开正则测试器时默认启用的 flags",
    group: "regexTester",
    defaultValue: { g: true, i: false, m: false, s: false, u: false },
    control: {
      type: "checkboxes",
      options: [
        { title: "g", value: "g", description: "全局匹配" },
        { title: "i", value: "i", description: "忽略大小写" },
        { title: "m", value: "m", description: "多行模式" },
        { title: "s", value: "s", description: "dotAll 模式" },
        { title: "u", value: "u", description: "Unicode 模式" },
      ],
    },
  },
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

export const SETTING_GROUPS: {
  id: SettingGroup;
  title: string;
  description: string;
}[] = [
  {
    id: "layout",
    title: "界面布局",
    description: "各工具左右工作区的默认宽度比例。",
  },
  {
    id: "regexTester",
    title: "正则测试",
    description: "打开正则测试器时默认启用的匹配标志。",
  },
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
