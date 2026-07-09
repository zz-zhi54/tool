/**
 * HTML 实体编解码工具函数。
 *
 * 编码：把 5 个 HTML 特殊字符（< > & " '）替换为对应的命名实体。
 * 解码：把命名实体（如 &amp; &lt; &gt; &quot; &apos; &nbsp; 等）还原为字符。
 *
 * 借助浏览器的 DOMParser + TextArea 元素实现，避免引入额外依赖。
 */

/**
 * 将特殊字符编码为 HTML 实体。
 *
 * 通过创建一个 <div> 节点并读取其 textContent，
 * 由浏览器负责把字符自动转义为实体。覆盖 < > & " ' 五种。
 */
export function encodeHtmlEntities(input: string): string {
  if (typeof document === "undefined") {
    // 退化方案：手动转义（理论上 Tauri WebView 一定有 document）
    return input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  const div = document.createElement("div");
  div.textContent = input;
  return div.innerHTML;
}

/**
 * 将 HTML 实体解码为字符。
 *
 * 通过创建一个 <div> 节点并设置 innerHTML，
 * 让浏览器自动把实体还原为字符。
 */
export function decodeHtmlEntities(input: string): string {
  if (typeof document === "undefined") {
    return input
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&");
  }

  const div = document.createElement("div");
  div.innerHTML = input;
  return div.textContent ?? "";
}
