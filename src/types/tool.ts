export type ToolCategoryId = "data-format" | "encoding" | "time" | "text";

export type ToolStatus = "available" | "planned";

/**
 * 工具分类元信息。
 *
 * 左侧导航、首页工具分组都复用这份结构，避免不同页面重复维护分类文案。
 */
export interface ToolCategory {
  id: ToolCategoryId;
  title: string;
  /**
   * 主题强调色（hex / rgb 等 CSS 颜色字符串）。
   * 用于顶部分类按钮图标、下拉菜单前置色条等可见性较弱的元素。
   * 不传时使用默认主色。
   */
  accent?: string;
}

/**
 * 单个开发工具的注册信息。
 *
 * icon 为 ant-design-vue 图标组件名称（PascalCase 字符串），
 * 由 src/utils/icons.ts 中的 getIconByName 解析为实际组件。
 */
export interface ToolDefinition {
  id: string;
  title: string;
  description: string;
  category: ToolCategoryId;
  icon: string;
  status: ToolStatus;
  /**
   * 工具项的主题强调色（hex / rgb 等 CSS 颜色字符串）。
   * 缺省时回退到所属分类的 accent，便于在菜单中快速区分。
   */
  accent?: string;
}
