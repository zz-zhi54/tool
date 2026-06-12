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
}

/**
 * 单个开发工具的注册信息。
 *
 * 当前阶段只负责描述工具的导航与展示信息；后续如果引入路由或动态组件，
 * 可以继续在这里增加 component、shortcut、keywords 等字段。
 */
export interface ToolDefinition {
  id: string;
  title: string;
  description: string;
  category: ToolCategoryId;
  icon: string;
  status: ToolStatus;
}
