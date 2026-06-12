/**
 * localStorage 集中管理模块
 *
 * 所有持久化用户偏好在此统一定义。
 * 新增存储项步骤：
 * 1. 在"存储项定义"区域声明 StorageItem 常量
 * 2. 将其加入底部的 STORAGE_KEYS 导出对象
 * 3. 在对应页面通过 getStorage / setStorage 读写
 */

// ====== 类型 ======

/** 单个存储项：键名 + 默认值 */
interface StorageItem<T> {
  /** localStorage 的键名，格式建议：{工具或功能}:{属性} */
  key: string;
  /** 读取失败或未设置时的回退值 */
  defaultValue: T;
}

// ====== 存储项定义 ======

/** JSON 格式化 —— 输入面板宽度百分比（35–75） */
const JSON_FORMATTER_PANEL_PERCENT: StorageItem<number> = {
  key: "json-formatter:panel-percent",
  defaultValue: 60,
};

/** YAML 格式化 —— 输入面板宽度百分比（35–75） */
const YAML_FORMATTER_PANEL_PERCENT: StorageItem<number> = {
  key: "yaml-formatter:panel-percent",
  defaultValue: 60,
};

/** Base64 编解码 —— 输入面板宽度百分比（15–85） */
const BASE64_CODEC_PANEL_PERCENT: StorageItem<number> = {
  key: "base64-codec:panel-percent",
  defaultValue: 60,
};

/** 正则测试 —— 输入面板宽度百分比（15–85） */
const REGEX_TESTER_PANEL_PERCENT: StorageItem<number> = {
  key: "regex-tester:panel-percent",
  defaultValue: 60,
};

/** SQL IN 生成器 —— 输入面板宽度百分比（15–85） */
const SQL_GENERATOR_PANEL_PERCENT: StorageItem<number> = {
  key: "sql-generator:panel-percent",
  defaultValue: 60,
};

// ====== 导出 ======

/** 所有存储项的索引，新增项必须在此注册 */
export const STORAGE_KEYS = {
  JSON_FORMATTER_PANEL_PERCENT,
  YAML_FORMATTER_PANEL_PERCENT,
  BASE64_CODEC_PANEL_PERCENT,
  REGEX_TESTER_PANEL_PERCENT,
  SQL_GENERATOR_PANEL_PERCENT,
} as const;

/**
 * 读取 localStorage 中的值，未设置或解析失败时返回默认值
 * @param item 存储项定义
 */
export function getStorage<T>(item: StorageItem<T>): T {
  const raw = localStorage.getItem(item.key);
  if (raw === null) return item.defaultValue;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return item.defaultValue;
  }
}

/**
 * 写入值到 localStorage
 * @param item 存储项定义
 * @param value 要存储的值
 */
export function setStorage<T>(item: StorageItem<T>, value: T): void {
  localStorage.setItem(item.key, JSON.stringify(value));
}

/**
 * 重置存储项为默认值
 * @param item 存储项定义
 */
export function resetStorage<T>(item: StorageItem<T>): void {
  localStorage.removeItem(item.key);
}

// ====== 设置页面辅助 ======

/** 存储项元信息，用于设置页面枚举展示 */
export interface StorageItemMeta {
  /** 在 STORAGE_KEYS 中的常量名，如 "JSON_FORMATTER_PANEL_PERCENT" */
  name: string;
  /** localStorage 的键名 */
  key: string;
  /** 当前值 */
  value: number;
  /** 默认值 */
  defaultValue: number;
}

/**
 * 获取所有存储项的当前状态，用于设置页面展示和编辑。
 *
 * 注意：新增存储项后需同步更新设置页面的 ITEM_LABELS 映射。
 */
export function getAllStorageItems(): StorageItemMeta[] {
  return Object.entries(STORAGE_KEYS).map(([name, item]) => ({
    name,
    key: item.key,
    value: getStorage(item),
    defaultValue: item.defaultValue,
  }));
}
