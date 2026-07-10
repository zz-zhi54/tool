/**
 * 二维码生成纯逻辑模块。
 *
 * 封装 `qrcode` npm 包，向上层 Vue 页面提供：
 * - generateQrDataURL：把文本编码为 PNG 的 dataURL（用于 <img> 渲染 + 下载 PNG）。
 * - generateQrSvg：把文本编码为 SVG 字符串（下载 SVG 用，矢量缩放无失真）。
 * - downloadQrDataURL：浏览器侧触发文件下载，不依赖 Tauri。
 * - validateQrInput：状态条用的轻量校验（空 / 非空 / 过长）。
 *
 * 故意不依赖 Vue，方便后续单测和复用。
 */
import QRCode from "qrcode";

/** 二维码容错级别（与 qrcode 库的 errorCorrectionLevel 取值对齐）。 */
export type QrErrorLevel = "L" | "M" | "Q" | "H";

/**
 * 生成选项。
 *
 * 字段名沿用 qrcode 库原生命名（color.dark / color.light）以减少映射成本；
 * 外部传入 hex 字符串即可。
 */
export interface QrGenerateOptions {
  /** 像素尺寸（正方形），默认 320 */
  size?: number;
  /** 静默区（白边）模块数，0-10，默认 2 */
  margin?: number;
  /** 容错级别，默认 M（~15%） */
  errorLevel?: QrErrorLevel;
  /** 前景色 hex，默认 #000000 */
  fgColor?: string;
  /** 背景色 hex，默认 #FFFFFF */
  bgColor?: string;
}

const DEFAULTS = {
  size: 320,
  margin: 2,
  errorLevel: "M" as QrErrorLevel,
  fgColor: "#000000",
  bgColor: "#FFFFFF",
};

/** 二维码最大可编码字节数（保守估计，按 L 容错 + 8-bit 模式）。 */
const MAX_QR_BYTES = 2953;

/**
 * 校验函数：用于状态条 tag。
 *
 * qrcode 库本身能容错（超长会自动降级模式甚至抛错），UI 这里只做
 * "空 / 非空 / 太长" 三态判定，更细的编码错误交给库抛错后由 UI 捕获。
 */
export function validateQrInput(text: string): {
  valid: boolean;
  empty: boolean;
  errorMessage?: string;
} {
  if (text.length === 0) {
    return { valid: false, empty: true };
  }
  // 按 UTF-8 字节粗算（很多 emoji 字符占 4 字节；这里只是 UI 友好提示）
  const bytes = new TextEncoder().encode(text).length;
  if (bytes > MAX_QR_BYTES) {
    return {
      valid: false,
      empty: false,
      errorMessage: `内容过长（${bytes} 字节 > ${MAX_QR_BYTES}），请缩短或提高容错级别`,
    };
  }
  return { valid: true, empty: false };
}

/** 把用户的 QrGenerateOptions 与默认值合并，得到 qrcode 库可消费的参数。 */
function toLibraryOptions(opts: QrGenerateOptions) {
  return {
    width: opts.size ?? DEFAULTS.size,
    margin: opts.margin ?? DEFAULTS.margin,
    errorCorrectionLevel: opts.errorLevel ?? DEFAULTS.errorLevel,
    color: {
      dark: opts.fgColor ?? DEFAULTS.fgColor,
      light: opts.bgColor ?? DEFAULTS.bgColor,
    },
  };
}

/** 生成 PNG dataURL。前后端通用，返回 "data:image/png;base64,..." 字符串。 */
export async function generateQrDataURL(
  text: string,
  opts: QrGenerateOptions = {},
): Promise<string> {
  return QRCode.toDataURL(text, toLibraryOptions(opts));
}

/** 生成 SVG 字符串（矢量格式，无背景填充矩形由 svg 标签表示）。 */
export async function generateQrSvg(
  text: string,
  opts: QrGenerateOptions = {},
): Promise<string> {
  return QRCode.toString(text, {
    ...toLibraryOptions(opts),
    type: "svg",
  });
}

/**
 * 触发浏览器下载。
 *
 * - dataURL 形式：直接 <a download>，无需 canvas。
 * - svg 字符串：包成 Blob 用 URL.createObjectURL，再用 revokeObjectURL 释放。
 *
 * 不依赖 Tauri 写盘能力，浏览器内置的下载流程足够桌面 + Web 通用。
 */
export function downloadDataURL(dataURL: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataURL;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function downloadSvg(svg: string, filename: string): void {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** 同步复制纯文本到剪贴板。失败时抛错由调用方处理。 */
export async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
