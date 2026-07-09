/**
 * 转义工具函数。
 *
 * 支持 5 种模式：JS / JSON / 正则 / SQL / Shell。
 * 每种模式各提供一对 encode/decode 函数。
 */

export type EscapeMode = "js" | "json" | "regex" | "sql" | "shell";

export interface EscapeModeMeta {
  id: EscapeMode;
  label: string;
  description: string;
}

export const ESCAPE_MODES: EscapeModeMeta[] = [
  {
    id: "js",
    label: "JS 字符串",
    description: "适合 JavaScript / TypeScript 字符串字面量（单/双引号包裹）",
  },
  {
    id: "json",
    label: "JSON",
    description: "适合嵌入到 JSON 值中，自动处理 \\uXXXX 与基本转义",
  },
  {
    id: "regex",
    label: "正则",
    description: "转义正则元字符，可安全嵌入到 new RegExp() 中",
  },
  {
    id: "sql",
    label: "SQL",
    description: "把 ' 替换为 ''（ANSI SQL 标准转义）",
  },
  {
    id: "shell",
    label: "Shell",
    description: "把单引号字符串中需要保留原样的字符用 '\\'' 包起来",
  },
];

/**
 * JS 字符串字面量：把原始字符替换为 \n \r \t \\ \' \" 等转义形式。
 * 同时把非 ASCII 控制字符转为 \uXXXX。
 */
export function encodeJs(input: string): string {
  let result = "";
  for (const ch of input) {
    const code = ch.codePointAt(0);
    if (code === undefined) continue;
    switch (ch) {
      case "\b":
        result += "\\b";
        break;
      case "\f":
        result += "\\f";
        break;
      case "\n":
        result += "\\n";
        break;
      case "\r":
        result += "\\r";
        break;
      case "\t":
        result += "\\t";
        break;
      case "\v":
        result += "\\v";
        break;
      case "\\":
        result += "\\\\";
        break;
      case "'":
        result += "\\'";
        break;
      case '"':
        result += '\\"';
        break;
      default:
        if (code < 0x20 || (code >= 0x7f && code <= 0xffff)) {
          result += `\\u${code.toString(16).padStart(4, "0")}`;
        } else if (code > 0xffff) {
          result += `\\u{${code.toString(16)}}`;
        } else {
          result += ch;
        }
    }
  }
  return result;
}

/**
 * JS 反转义：使用 JSON.parse 兼容的处理（支持 \uXXXX 与 \u{XX} 有限子集）。
 * 由于 JSON.parse 不支持 \v 与 \', 这里做兼容处理。
 */
export function decodeJs(input: string): string {
  // 把 \v 转换为 \u000b 这种 JSON 接受的形态
  const sanitized = input.replace(/\\v/g, "\\u000b");
  // 包成 JSON 字符串，让浏览器帮我们解
  try {
    return JSON.parse(`"${sanitized.replace(/"/g, '\\"')}"`);
  } catch {
    // 退化：手动处理常见转义
    return input.replace(
      /\\(u[0-9A-Fa-f]{4}|u\{[0-9A-Fa-f]+\}|x[0-9A-Fa-f]{2}|[nrtbf'"\\/])/g,
      (_match, esc: string) => unescapeOne(esc),
    );
  }
}

function unescapeOne(esc: string): string {
  if (esc.startsWith("u")) {
    if (esc.startsWith("u{") && esc.endsWith("}")) {
      return String.fromCodePoint(parseInt(esc.slice(2, -1), 16));
    }
    return String.fromCodePoint(parseInt(esc.slice(1), 16));
  }
  if (esc.startsWith("x")) {
    return String.fromCodePoint(parseInt(esc.slice(1), 16));
  }
  switch (esc) {
    case "n":
      return "\n";
    case "r":
      return "\r";
    case "t":
      return "\t";
    case "b":
      return "\b";
    case "f":
      return "\f";
    case "v":
      return "\v";
    case "\\":
      return "\\";
    case "'":
      return "'";
    case '"':
      return '"';
    case "/":
      return "/";
    default:
      return esc;
  }
}

/**
 * JSON 转义：与 JSON.stringify 输出一致。
 */
export function encodeJson(input: string): string {
  return JSON.stringify(input);
}

/** JSON 反转义：把 JSON 字符串字面量还原。 */
export function decodeJson(input: string): string {
  try {
    return JSON.parse(input);
  } catch {
    // 兼容用户忘了加包裹引号的情况
    return JSON.parse(`"${input.replace(/"/g, '\\"')}"`);
  }
}

/** 正则元字符转义。 */
const REGEX_SPECIAL = /[.*+?^${}()|[\]\\]/g;

export function encodeRegex(input: string): string {
  return input.replace(REGEX_SPECIAL, "\\$&");
}

/** 正则反转义：去除 \ 前缀，仅处理常见元字符。 */
export function decodeRegex(input: string): string {
  return input.replace(/\\(.)/g, "$1");
}

/**
 * SQL 单引号转义：' → ''（ANSI 标准）。
 */
export function encodeSql(input: string): string {
  return input.replace(/'/g, "''");
}

/** SQL 反转义：'' → '。 */
export function decodeSql(input: string): string {
  return input.replace(/''/g, "'");
}

/**
 * Shell 单引号字符串安全化：
 * - 用 ' 包住整个串
 * - 串内出现的 ' 替换为 '\''
 */
export function encodeShell(input: string): string {
  if (input.length === 0) return "''";
  return `'${input.replace(/'/g, "'\\''")}'`;
}

/** Shell 反向：去掉外层包裹的 '，把 '\'' 还原为 '。 */
export function decodeShell(input: string): string {
  let text = input.trim();
  if (text.startsWith("'") && text.endsWith("'")) {
    text = text.slice(1, -1);
  }
  return text.replace(/'\\''/g, "'");
}

/**
 * 入口：根据模式选择编码函数。
 */
export function encodeByMode(input: string, mode: EscapeMode): string {
  switch (mode) {
    case "js":
      return encodeJs(input);
    case "json":
      return encodeJson(input);
    case "regex":
      return encodeRegex(input);
    case "sql":
      return encodeSql(input);
    case "shell":
      return encodeShell(input);
  }
}

export function decodeByMode(input: string, mode: EscapeMode): string {
  switch (mode) {
    case "js":
      return decodeJs(input);
    case "json":
      return decodeJson(input);
    case "regex":
      return decodeRegex(input);
    case "sql":
      return decodeSql(input);
    case "shell":
      return decodeShell(input);
  }
}
