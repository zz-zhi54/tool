import xmlFormat from "xml-formatter";

import type {
  XmlNode,
  XmlProcessResult,
  XmlTextStats,
  XmlValidationResult,
} from "./xmlTypes";

/**
 * XML 格式化工具函数。
 *
 * 校验：使用浏览器原生 DOMParser（按 text/xml 解析）。
 * 格式化/压缩：使用 xml-formatter 包。
 * 树视图：通过 DOMParser 解析后递归构建 a-tree 兼容的结构。
 */

/** 统计文本基础信息。 */
export function getXmlTextStats(input: string): XmlTextStats {
  return {
    bytes: new TextEncoder().encode(input).length,
    characters: input.length,
    lines: input.length === 0 ? 0 : input.split(/\r\n|\r|\n/).length,
  };
}

/**
 * 校验 XML 文本是否合法。
 *
 * 空输入不视为错误，避免用户刚打开工具时看到红色提示。
 * DOMParser 解析失败时会插入 <parsererror> 节点，从中提取错误文本。
 */
export function validateXml(input: string): XmlValidationResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { valid: false, empty: true };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(trimmed, "text/xml");
    const errorNode = doc.querySelector("parsererror");
    if (errorNode) {
      return {
        valid: false,
        empty: false,
        errorMessage: errorNode.textContent?.trim() ?? "XML 格式错误",
      };
    }
    return { valid: true, empty: false };
  } catch (error) {
    return {
      valid: false,
      empty: false,
      errorMessage: error instanceof Error ? error.message : "XML 格式错误",
    };
  }
}

/**
 * 把 XML 文本解析为树形结构，用于右侧结构视图。
 *
 * 不合法 XML 返回 undefined，由调用方决定降级显示。
 */
export function parseXmlToTree(input: string): XmlNode | undefined {
  const trimmed = input.trim();
  if (trimmed.length === 0) return undefined;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(trimmed, "text/xml");
    if (doc.querySelector("parsererror")) return undefined;

    const root = doc.documentElement;
    if (!root) return undefined;

    return domToNode(root);
  } catch {
    return undefined;
  }
}

function domToNode(element: Element): XmlNode {
  const attributes: Record<string, string> = {};
  for (const attr of Array.from(element.attributes)) {
    attributes[attr.name] = attr.value;
  }

  const children: XmlNode[] = [];
  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === 1 /* ELEMENT_NODE */) {
      children.push(domToNode(child as Element));
    } else if (child.nodeType === 3 /* TEXT_NODE */) {
      const text = child.textContent?.trim();
      if (text) {
        children.push({ name: "#text", type: "text", value: text });
      }
    } else if (child.nodeType === 4 /* CDATA_SECTION_NODE */) {
      children.push({
        name: "#cdata",
        type: "cdata",
        value: child.textContent ?? "",
      });
    } else if (child.nodeType === 8 /* COMMENT_NODE */) {
      const text = child.textContent?.trim();
      if (text) {
        children.push({ name: "#comment", type: "comment", value: text });
      }
    }
  }

  return {
    name: element.tagName,
    type: "element",
    attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
    children: children.length > 0 ? children : undefined,
  };
}

/** 格式化 XML：缩进 2 空格，标签内容同行。 */
export function formatXml(input: string): XmlProcessResult {
  const stats = getXmlTextStats(input);
  const validation = validateXml(input);

  if (!validation.valid) {
    return { success: false, output: "", validation, stats };
  }

  try {
    const output = xmlFormat(input.trim(), {
      indentation: "  ",
      lineSeparator: "\n",
      collapseContent: true,
    });
    return { success: true, output, validation, stats };
  } catch (error) {
    return {
      success: false,
      output: "",
      validation: {
        valid: false,
        empty: false,
        errorMessage: error instanceof Error ? error.message : "XML 格式化失败",
      },
      stats,
    };
  }
}

/** 压缩 XML：去掉多余空白。 */
export function minifyXml(input: string): XmlProcessResult {
  const stats = getXmlTextStats(input);
  const validation = validateXml(input);

  if (!validation.valid) {
    return { success: false, output: "", validation, stats };
  }

  try {
    const output = xmlFormat.minify(input.trim(), {
      collapseContent: true,
    });
    return { success: true, output, validation, stats };
  } catch (error) {
    return {
      success: false,
      output: "",
      validation: {
        valid: false,
        empty: false,
        errorMessage: error instanceof Error ? error.message : "XML 压缩失败",
      },
      stats,
    };
  }
}
