/** 文本基础统计 */
export interface XmlTextStats {
  bytes: number;
  characters: number;
  lines: number;
}

/** XML 校验结果 */
export interface XmlValidationResult {
  valid: boolean;
  empty: boolean;
  errorMessage?: string;
}

/** 树视图节点 */
export interface XmlNode {
  /** 节点名（元素名为标签名，文本节点为 #text 等） */
  name: string;
  type: "element" | "text" | "cdata" | "comment";
  /** 元素属性 */
  attributes?: Record<string, string>;
  /** 子节点 */
  children?: XmlNode[];
  /** 文本 / CDATA / 注释 内容 */
  value?: string;
}

/** XML 处理结果 */
export interface XmlProcessResult {
  success: boolean;
  output: string;
  validation: XmlValidationResult;
  stats: XmlTextStats;
  document?: XmlNode;
}
