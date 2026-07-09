import type { ToolCategory, ToolDefinition } from "../types/tool";

/**
 * 工具分类注册表。
 *
 * 分类顺序就是顶部导航和首页展示顺序，因此新增分类时只需要维护这里。
 *
 * `accent` 为分类强调色（antd 调色板），用于顶部分类按钮图标与
 * 未显式指定颜色的工具项。浅色 / 深色主题下均能保持足够对比度。
 */
export const toolCategories: ToolCategory[] = [
  { id: "data-format", title: "数据格式", accent: "#1677ff" },
  { id: "encoding", title: "编码转换", accent: "#722ed1" },
  { id: "time", title: "时间工具", accent: "#fa8c16" },
  { id: "text", title: "文本工具", accent: "#13c2c2" },
];

/**
 * 工具注册表。
 *
 * icon 字段保存的是 ant-design-vue 图标名（PascalCase），
 * 通过 src/utils/icons.ts 中的 getIconByName 解析为组件渲染。
 *
 * accent 缺省时回退到所属分类的 accent；显式设置可让同一分类下的
 * 不同工具呈现细微差异，便于菜单中快速识别。
 */
export const tools: ToolDefinition[] = [
  {
    id: "json-formatter",
    title: "JSON 格式化",
    description: "校验、格式化和压缩 JSON 数据。",
    category: "data-format",
    icon: "CodeOutlined",
    status: "available",
    accent: "#1677ff",
  },
  {
    id: "yaml-formatter",
    title: "YAML 格式化",
    description: "整理 YAML 缩进，并支持后续与 JSON 互转。",
    category: "data-format",
    icon: "FileTextOutlined",
    status: "available",
    accent: "#2f54eb",
  },
  {
    id: "xml-formatter",
    title: "XML 格式化",
    description: "校验、格式化和压缩 XML 文档。",
    category: "data-format",
    icon: "Html5Outlined",
    status: "available",
    accent: "#eb2f96",
  },
  {
    id: "toml-formatter",
    title: "TOML 格式化",
    description: "校验、格式化和压缩 TOML 配置。",
    category: "data-format",
    icon: "ProfileOutlined",
    status: "available",
    accent: "#fa541c",
  },
  {
    id: "base64-codec",
    title: "Base64 编码",
    description: "在普通文本和 Base64 之间快速转换。",
    category: "encoding",
    icon: "BarcodeOutlined",
    status: "available",
    accent: "#722ed1",
  },
  {
    id: "url-codec",
    title: "URL 编解码",
    description: "在普通文本和百分号编码之间互转。",
    category: "encoding",
    icon: "LinkOutlined",
    status: "available",
    accent: "#9254de",
  },
  {
    id: "hex-codec",
    title: "Hex 编解码",
    description: "在普通文本和十六进制字节之间互转。",
    category: "encoding",
    icon: "NumberOutlined",
    status: "available",
    accent: "#2f54eb",
  },
  {
    id: "html-entity-codec",
    title: "HTML 实体编解码",
    description: "在普通文本和 HTML 实体之间互转。",
    category: "encoding",
    icon: "Html5Outlined",
    status: "available",
    accent: "#fa8c16",
  },
  {
    id: "unicode-escape",
    title: "Unicode 转义",
    description: "在普通文本和 \\uXXXX 转义之间互转。",
    category: "encoding",
    icon: "TranslationOutlined",
    status: "available",
    accent: "#13c2c2",
  },
  {
    id: "timestamp-converter",
    title: "时间戳转换",
    description: "在时间戳和可读日期之间互相转换。",
    category: "time",
    icon: "ClockCircleOutlined",
    status: "available",
    accent: "#fa8c16",
  },
  {
    id: "timezone-converter",
    title: "时区转换",
    description: "将时间戳转换到任意时区的本地时间。",
    category: "time",
    icon: "GlobalOutlined",
    status: "available",
    accent: "#fa541c",
  },
  {
    id: "date-calculator",
    title: "日期计算器",
    description: "计算两个日期间的间隔，或对日期做加减运算。",
    category: "time",
    icon: "CalendarOutlined",
    status: "available",
    accent: "#52c41a",
  },
  {
    id: "regex-tester",
    title: "正则测试",
    description: "验证正则表达式并查看匹配结果。",
    category: "text",
    icon: "SearchOutlined",
    status: "available",
    accent: "#13c2c2",
  },
  {
    id: "sql-generator",
    title: "SQL IN 生成器",
    description: "将多行数据转换为 SQL IN 语句。",
    category: "text",
    icon: "DatabaseOutlined",
    status: "available",
    accent: "#52c41a",
  },
  {
    id: "escape-tool",
    title: "转义工具",
    description: "在 JS / JSON / 正则 / SQL / Shell 之间转义。",
    category: "text",
    icon: "SafetyOutlined",
    status: "available",
    accent: "#f5222d",
  },
  {
    id: "uuid-generator",
    title: "UUID 生成器",
    description: "批量生成 v1 / v4 / v7 版本的 UUID。",
    category: "text",
    icon: "KeyOutlined",
    status: "available",
    accent: "#722ed1",
  },
  {
    id: "text-diff",
    title: "文本 Diff",
    description: "对比两段文本的差异，按行高亮。",
    category: "text",
    icon: "SwapOutlined",
    status: "available",
    accent: "#1890ff",
  },
  {
    id: "case-converter",
    title: "大小写转换",
    description: "在 UPPER / lower / camel / snake 等命名风格间转换。",
    category: "text",
    icon: "FontColorsOutlined",
    status: "available",
    accent: "#faad14",
  },
  {
    id: "line-ops",
    title: "行处理",
    description: "对多行文本做排序、去重、去空行与 trim。",
    category: "text",
    icon: "OrderedListOutlined",
    status: "available",
    accent: "#52c41a",
  },
];

export const defaultToolId = "json-formatter";

export function findToolById(toolId: string) {
  return tools.find((tool) => tool.id === toolId);
}
