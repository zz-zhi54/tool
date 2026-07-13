/**
 * 大小写转换工具函数。
 *
 * 把输入按"词"拆开，然后按目标命名风格重组。
 * 词边界识别：非字母数字 → 边界；连续大写 → 当成单独的词。
 */

export type CaseStyle =
  | "UPPER"
  | "lower"
  | "Title Case"
  | "camelCase"
  | "PascalCase"
  | "snake_case"
  | "kebab-case"
  | "CONSTANT_CASE";

export const CASE_STYLES: { id: CaseStyle; label: string; title: string }[] = [
  { id: "UPPER", label: "全大写", title: "UPPER CASE" },
  { id: "lower", label: "全小写", title: "lower case" },
  { id: "Title Case", label: "首字母大写", title: "Title Case" },
  { id: "camelCase", label: "小驼峰", title: "camelCase" },
  { id: "PascalCase", label: "大驼峰", title: "PascalCase" },
  { id: "snake_case", label: "下划线", title: "snake_case" },
  { id: "kebab-case", label: "连字符", title: "kebab-case" },
  { id: "CONSTANT_CASE", label: "常量", title: "CONSTANT_CASE" },
];

/** 把输入拆解为「词」数组（统一小写形式）。 */
export function tokenize(input: string): string[] {
  const trimmed = input.trim();
  if (trimmed.length === 0) return [];

  // 把常见分隔符替换成空格，再按空格拆分
  const replaced = trimmed
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[_\-\s\.\/\\]+/g, " ");

  return replaced
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((w) => w.toLowerCase());
}

/** 按指定命名风格输出。 */
export function convertCase(input: string, style: CaseStyle): string {
  const words = tokenize(input);
  if (words.length === 0) return "";

  switch (style) {
    case "UPPER":
      return words.map((w) => w.toUpperCase()).join(" ");
    case "lower":
      return words.join(" ");
    case "Title Case":
      return words.map(capitalize).join(" ");
    case "camelCase":
      return words.map((w, i) => (i === 0 ? w : capitalize(w))).join("");
    case "PascalCase":
      return words.map(capitalize).join("");
    case "snake_case":
      return words.join("_");
    case "kebab-case":
      return words.join("-");
    case "CONSTANT_CASE":
      return words.map((w) => w.toUpperCase()).join("_");
  }
}

function capitalize(word: string): string {
  if (word.length === 0) return word;
  return word[0].toUpperCase() + word.slice(1);
}
