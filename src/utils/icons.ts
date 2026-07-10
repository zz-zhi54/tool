/**
 * 图标解析工具。
 *
 * 工具注册表中的 icon 字段保存的是字符串标识（兼容 ant-design-vue 的 PascalCase 名称）。
 * 模板可以通过 `getIconByName(name)` 获得对应 Vue 组件并通过 `<component :is="..." />` 渲染。
 *
 * 这里集中维护一份查找表，保证：
 * 1. 业务代码只引用字符串，与组件解耦；
 * 2. 真正需要的图标才会被 import，避免打包时引入未使用的图标。
 */

import type { Component } from "vue";

import {
  ApartmentOutlined,
  AppstoreOutlined,
  BarcodeOutlined,
  BgColorsOutlined,
  BranchesOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CodeOutlined,
  CodeSandboxOutlined,
  CompressOutlined,
  CopyOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  DownOutlined,
  FileTextOutlined,
  FontColorsOutlined,
  FormatPainterOutlined,
  GlobalOutlined,
  Html5Outlined,
  InfoCircleOutlined,
  KeyOutlined,
  LeftOutlined,
  LinkOutlined,
  MinusOutlined,
  NumberOutlined,
  OrderedListOutlined,
  ProfileOutlined,
  ReloadOutlined,
  RightOutlined,
  SafetyOutlined,
  ScanOutlined,
  SearchOutlined,
  SettingOutlined,
  SwapOutlined,
  TranslationOutlined,
  WarningOutlined,
} from "@ant-design/icons-vue";

/**
 * ant 图标名 → Vue 组件 的查找表。
 *
 * 新增图标只需在这里追加映射即可；
 * 不在此表中的字符串会被解析为 null，渲染时回退到占位符。
 */
const REGISTRY: Record<string, Component> = {
  // 主导航 / 工具分类
  AppstoreOutlined,
  CodeOutlined,
  CodeSandboxOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  FormatPainterOutlined,

  // 内置工具图标
  ApartmentOutlined,
  BranchesOutlined,
  CompressOutlined,
  CopyOutlined,
  DeleteOutlined,
  BarcodeOutlined,
  CalendarOutlined,
  FontColorsOutlined,
  GlobalOutlined,
  Html5Outlined,
  KeyOutlined,
  LinkOutlined,
  NumberOutlined,
  OrderedListOutlined,
  ProfileOutlined,
  SafetyOutlined,
  ScanOutlined,
  SwapOutlined,
  TranslationOutlined,

  // 控件 / 操作
  BgColorsOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownOutlined,
  InfoCircleOutlined,
  LeftOutlined,
  MinusOutlined,
  ReloadOutlined,
  RightOutlined,
  SearchOutlined,
  SettingOutlined,
  WarningOutlined,
};

/**
 * 通过字符串获取图标组件。
 * 找不到时返回 null，由调用方决定如何降级渲染。
 */
export function getIconByName(name: string | undefined): Component | null {
  if (!name) return null;
  return REGISTRY[name] ?? null;
}
