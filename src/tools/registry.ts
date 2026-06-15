import type { ToolCategory, ToolDefinition } from "../types/tool";

/**
 * 工具分类注册表。
 *
 * 分类顺序就是顶部导航和首页展示顺序，因此新增分类时只需要维护这里。
 */
export const toolCategories: ToolCategory[] = [
  {
    id: "data-format",
    title: "数据格式",
  },
  {
    id: "encoding",
    title: "编码转换",
  },
  {
    id: "time",
    title: "时间工具",
  },
  {
    id: "text",
    title: "文本工具",
  },
];

/**
 * 工具注册表。
 */
export const tools: ToolDefinition[] = [
  {
    id: "json-formatter",
    title: "JSON 格式化",
    description: "校验、格式化和压缩 JSON 数据。",
    category: "data-format",
    icon: "$json",
    status: "available",
  },
  {
    id: "yaml-formatter",
    title: "YAML 格式化",
    description: "整理 YAML 缩进，并支持后续与 JSON 互转。",
    category: "data-format",
    icon: "$fileTree",
    status: "available",
  },
  {
    id: "base64-codec",
    title: "Base64 编码",
    description: "在普通文本和 Base64 之间快速转换。",
    category: "encoding",
    icon: "$codeBraces",
    status: "available",
  },
  {
    id: "timestamp-converter",
    title: "时间戳转换",
    description: "在时间戳和可读日期之间互相转换。",
    category: "time",
    icon: "$codeTags",
    status: "available",
  },
  {
    id: "regex-tester",
    title: "正则测试",
    description: "验证正则表达式并查看匹配结果。",
    category: "text",
    icon: "$regex",
    status: "available",
  },
  {
    id: "sql-generator",
    title: "SQL IN 生成器",
    description: "将多行数据转换为 SQL IN 语句。",
    category: "text",
    icon: "$database",
    status: "available",
  },
];

export const defaultToolId = "json-formatter";

export function findToolById(toolId: string) {
  return tools.find((tool) => tool.id === toolId);
}
