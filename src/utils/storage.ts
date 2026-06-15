/**
 * localStorage 集中管理模块。
 *
 * 所有持久化用户偏好在此统一定义。页面只负责消费 STORAGE_KEYS，设置页通过
 * metadata 自动渲染控件，避免新增偏好时到处同步标签和默认值。
 */

// ====== 类型 ======

export type StorageGroupId = "layout" | "regexTester" | "sqlGenerator";

export interface StorageGroup {
  id: StorageGroupId;
  title: string;
  description: string;
}

export interface SliderStorageControl {
  type: "slider";
  min: number;
  max: number;
  step: number;
  suffix?: string;
}

export interface ToggleStorageControl {
  type: "toggle";
  options: Array<{
    title: string;
    value: string;
  }>;
}

export interface CheckboxesStorageControl {
  type: "checkboxes";
  options: Array<{
    title: string;
    value: string;
    description?: string;
  }>;
}

export type StorageControl =
  | SliderStorageControl
  | ToggleStorageControl
  | CheckboxesStorageControl;

/** 单个存储项：包含读写 key、默认值和设置页展示信息。 */
export interface StorageItem<T> {
  /** localStorage 的键名，格式建议：{工具或功能}:{属性} */
  key: string;
  /** 设置页展示名称 */
  label: string;
  /** 设置页辅助说明 */
  description?: string;
  /** 设置页分组 */
  group: StorageGroupId;
  /** 读取失败或未设置时的回退值 */
  defaultValue: T;
  /** 设置页控件类型 */
  control: StorageControl;
  /** 校验从 localStorage 读取出的未知值 */
  validate?: (value: unknown) => value is T;
  /** 归一化读写值，优先级高于 validate */
  normalize?: (value: unknown) => T;
  /** 设置页当前值/默认值展示格式 */
  format?: (value: T) => string;
}

export const REGEX_FLAG_KEYS = ["g", "i", "m", "s", "u"] as const;
export type RegexFlag = (typeof REGEX_FLAG_KEYS)[number];
export type RegexFlagsPreference = Record<RegexFlag, boolean>;

export type SqlQuoteStyle = '"' | "'";

export type StorageItemName = keyof typeof STORAGE_KEYS;

export interface StorageItemMeta<T = unknown> {
  /** 在 STORAGE_KEYS 中的常量名，如 "JSON_FORMATTER_PANEL_PERCENT" */
  name: StorageItemName;
  /** localStorage 的键名 */
  key: string;
  label: string;
  description?: string;
  group: StorageGroupId;
  value: T;
  defaultValue: T;
  control: StorageControl;
  displayValue: string;
  displayDefaultValue: string;
  isDefault: boolean;
}

// ====== 分组定义 ======

export const STORAGE_GROUPS: StorageGroup[] = [
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

// ====== 通用工具 ======

const PANEL_CONTROL: SliderStorageControl = {
  type: "slider",
  min: 15,
  max: 85,
  step: 1,
  suffix: "%",
};

const DEFAULT_REGEX_FLAGS: RegexFlagsPreference = {
  g: true,
  i: false,
  m: false,
  s: false,
  u: false,
};

function defineStorageItem<T>(item: StorageItem<T>): StorageItem<T> {
  return item;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizePanelPercent(value: unknown): number {
  if (!isNumber(value)) {
    return 40;
  }

  return Math.round(clamp(value, PANEL_CONTROL.min, PANEL_CONTROL.max));
}

function isRegexFlagsPreference(
  value: unknown,
): value is Partial<Record<RegexFlag, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeRegexFlags(value: unknown): RegexFlagsPreference {
  if (!isRegexFlagsPreference(value)) {
    return { ...DEFAULT_REGEX_FLAGS };
  }

  return REGEX_FLAG_KEYS.reduce<RegexFlagsPreference>(
    (flags, key) => ({
      ...flags,
      [key]:
        typeof value[key] === "boolean" ? value[key] : DEFAULT_REGEX_FLAGS[key],
    }),
    { ...DEFAULT_REGEX_FLAGS },
  );
}

function isSqlQuoteStyle(value: unknown): value is SqlQuoteStyle {
  return value === '"' || value === "'";
}

function formatPanelPercent(value: number): string {
  return `${value}%`;
}

function formatRegexFlags(value: RegexFlagsPreference): string {
  const activeFlags = REGEX_FLAG_KEYS.filter((key) => value[key]).join("");
  return activeFlags ? `/${activeFlags}/` : "无 flags";
}

function formatSqlQuote(value: SqlQuoteStyle): string {
  return `${value}${value}`;
}

function formatStorageValue<T>(item: StorageItem<T>, value: T): string {
  if (item.format) {
    return item.format(value);
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
}

function isSameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ====== 存储项定义 ======

const JSON_FORMATTER_PANEL_PERCENT = defineStorageItem<number>({
  key: "json-formatter:panel-percent",
  label: "JSON 格式化",
  description: "输入面板宽度",
  group: "layout",
  defaultValue: 40,
  control: PANEL_CONTROL,
  normalize: normalizePanelPercent,
  format: formatPanelPercent,
});

const YAML_FORMATTER_PANEL_PERCENT = defineStorageItem<number>({
  key: "yaml-formatter:panel-percent",
  label: "YAML 格式化",
  description: "输入面板宽度",
  group: "layout",
  defaultValue: 40,
  control: PANEL_CONTROL,
  normalize: normalizePanelPercent,
  format: formatPanelPercent,
});

const BASE64_CODEC_PANEL_PERCENT = defineStorageItem<number>({
  key: "base64-codec:panel-percent",
  label: "Base64 编解码",
  description: "输入面板宽度",
  group: "layout",
  defaultValue: 40,
  control: PANEL_CONTROL,
  normalize: normalizePanelPercent,
  format: formatPanelPercent,
});

const REGEX_TESTER_PANEL_PERCENT = defineStorageItem<number>({
  key: "regex-tester:panel-percent",
  label: "正则测试",
  description: "输入面板宽度",
  group: "layout",
  defaultValue: 40,
  control: PANEL_CONTROL,
  normalize: normalizePanelPercent,
  format: formatPanelPercent,
});

const SQL_GENERATOR_PANEL_PERCENT = defineStorageItem<number>({
  key: "sql-generator:panel-percent",
  label: "SQL IN 生成器",
  description: "输入面板宽度",
  group: "layout",
  defaultValue: 40,
  control: PANEL_CONTROL,
  normalize: normalizePanelPercent,
  format: formatPanelPercent,
});

const REGEX_TESTER_FLAGS = defineStorageItem<RegexFlagsPreference>({
  key: "regex-tester:flags",
  label: "默认正则标志",
  description: "打开正则测试器时默认启用的 flags",
  group: "regexTester",
  defaultValue: DEFAULT_REGEX_FLAGS,
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
  normalize: normalizeRegexFlags,
  format: formatRegexFlags,
});

const SQL_GENERATOR_QUOTE = defineStorageItem<SqlQuoteStyle>({
  key: "sql-generator:quote",
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
  validate: isSqlQuoteStyle,
  format: formatSqlQuote,
});

// ====== 导出 ======

/** 所有存储项的索引，新增项必须在此注册。 */
export const STORAGE_KEYS = {
  JSON_FORMATTER_PANEL_PERCENT,
  YAML_FORMATTER_PANEL_PERCENT,
  BASE64_CODEC_PANEL_PERCENT,
  REGEX_TESTER_PANEL_PERCENT,
  SQL_GENERATOR_PANEL_PERCENT,
  REGEX_TESTER_FLAGS,
  SQL_GENERATOR_QUOTE,
} as const;

/**
 * 读取 localStorage 中的值，未设置、解析失败或校验失败时返回默认值。
 */
export function getStorage<T>(item: StorageItem<T>): T {
  const raw = localStorage.getItem(item.key);
  if (raw === null) return item.defaultValue;

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (item.normalize) {
      return item.normalize(parsed);
    }

    if (item.validate) {
      return item.validate(parsed) ? parsed : item.defaultValue;
    }

    return parsed as T;
  } catch {
    return item.defaultValue;
  }
}

/**
 * 写入值到 localStorage。
 */
export function setStorage<T>(item: StorageItem<T>, value: T): void {
  const normalized = item.normalize ? item.normalize(value) : value;
  localStorage.setItem(item.key, JSON.stringify(normalized));
}

/**
 * 重置存储项为默认值。
 */
export function resetStorage<T>(item: StorageItem<T>): void {
  localStorage.removeItem(item.key);
}

// ====== 设置页面辅助 ======

/**
 * 获取所有存储项的当前状态，用于设置页面展示和编辑。
 */
export function getAllStorageItems(): StorageItemMeta[] {
  return Object.entries(STORAGE_KEYS).map(([name, item]) => {
    const storageItem = item as unknown as StorageItem<unknown>;
    const value = getStorage(storageItem);

    return {
      name: name as StorageItemName,
      key: storageItem.key,
      label: storageItem.label,
      description: storageItem.description,
      group: storageItem.group,
      value,
      defaultValue: storageItem.defaultValue,
      control: storageItem.control,
      displayValue: formatStorageValue(storageItem, value),
      displayDefaultValue: formatStorageValue(
        storageItem,
        storageItem.defaultValue,
      ),
      isDefault: isSameValue(value, storageItem.defaultValue),
    };
  });
}
