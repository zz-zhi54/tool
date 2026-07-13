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
  { id: "qrcode", title: "二维码", accent: "#595959" },
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
    id: "encoding-hub",
    title: "编码转换",
    description:
      "在 Base64 / URL / Hex / Unicode 之间快速编码、解码或互相转换。",
    category: "encoding",
    icon: "SwapOutlined",
    status: "available",
    accent: "#722ed1",
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
    id: "sql-generator",
    title: "SQL 生成器",
    description: "把多行数据快速拼装为 SQL IN 片段。",
    category: "encoding",
    icon: "DatabaseOutlined",
    status: "available",
    accent: "#9254de",
  },
  {
    id: "time-hub",
    title: "时间工具",
    description: "时间戳、时区与日期计算的统一入口。",
    category: "time",
    icon: "ClockCircleOutlined",
    status: "available",
    accent: "#fa8c16",
  },
  {
    id: "text-hub",
    title: "文本工具",
    description: "转义、大小写转换与行处理的统一入口。",
    category: "text",
    icon: "FontColorsOutlined",
    status: "available",
    accent: "#13c2c2",
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
    id: "text-diff",
    title: "文本 Diff",
    description: "对比两段文本的差异，按行高亮新增 / 删除 / 相同行。",
    category: "text",
    icon: "SwapOutlined",
    status: "available",
    accent: "#13c2c2",
  },
  {
    id: "qrcode-tool",
    title: "二维码工具",
    description: "生成任意内容的二维码，或从图片中识别二维码内容。",
    category: "qrcode",
    icon: "BarcodeOutlined",
    status: "available",
    accent: "#595959",
  },
];

export const defaultToolId = "json-formatter";

export function findToolById(toolId: string) {
  return tools.find((tool) => tool.id === toolId);
}
