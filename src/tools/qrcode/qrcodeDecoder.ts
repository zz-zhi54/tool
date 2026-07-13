/**
 * 二维码识别纯逻辑模块。
 *
 * 封装 `jsqr` 库，从图片源（HTMLImageElement / File / 剪贴板）提取 QR 内容。
 *
 * 设计：
 * - 所有函数都返回统一结构 `DecodeResult`，让 UI 层无需关心错误类型差异。
 * - 内部统一通过 "Image → Canvas → getImageData → jsQR" 桥接，jsQR 只接受
 *   RGBA 字节 + 宽高。
 * - 不依赖 Vue，方便单测和复用。
 */
import jsQR from "jsqr";

/** 解码结果。ok=false 时 text 不存在，errorMessage 必有值。 */
export interface DecodeResult {
  ok: boolean;
  text?: string;
  errorMessage?: string;
}

/** 10MB：过大的图片解码性能差且容易 OOM，UI 层提前拦截。 */
const MAX_FILE_BYTES = 10 * 1024 * 1024;

/**
 * 把任意 HTMLImageElement 绘制到离屏 canvas，返回 RGBA 数据。
 * 复用同一个 canvas 减少内存抖动。
 */
let sharedCanvas: HTMLCanvasElement | null = null;
function getSharedCanvas(): HTMLCanvasElement {
  if (!sharedCanvas) {
    sharedCanvas = document.createElement("canvas");
  }
  return sharedCanvas;
}

function imageToImageData(img: HTMLImageElement): ImageData {
  const canvas = getSharedCanvas();
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("无法创建 2D 画布上下文");
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/** 从已加载的 <img> 解码。 */
export function decodeQrFromImage(img: HTMLImageElement): DecodeResult {
  if (!img.complete || img.naturalWidth === 0) {
    return { ok: false, errorMessage: "图片尚未加载完成" };
  }
  try {
    const data = imageToImageData(img);
    const code = jsQR(data.data, data.width, data.height, {
      inversionAttempts: "attemptBoth",
    });
    if (!code) {
      return { ok: false, errorMessage: "未识别到二维码内容" };
    }
    return { ok: true, text: code.data };
  } catch (err) {
    return {
      ok: false,
      errorMessage: err instanceof Error ? err.message : "解码失败",
    };
  }
}

/** 内部工具：把 File 加载为 HTMLImageElement。 */
function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("图片加载失败（可能格式不受支持）"));
    };
    img.src = url;
  });
}

/**
 * 从用户拖拽 / 选择的文件解码。
 *
 * 自动校验：
 * - 类型必须为图片；
 * - 大小不超过 10MB。
 */
export async function decodeQrFromFile(file: File): Promise<DecodeResult> {
  if (!file.type.startsWith("image/")) {
    return { ok: false, errorMessage: "请选择图片文件" };
  }
  if (file.size > MAX_FILE_BYTES) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    return {
      ok: false,
      errorMessage: `图片过大（${sizeMB} MB > 10 MB），请压缩后再试`,
    };
  }
  try {
    const img = await fileToImage(file);
    return decodeQrFromImage(img);
  } catch (err) {
    return {
      ok: false,
      errorMessage: err instanceof Error ? err.message : "解码失败",
    };
  }
}

/**
 * 从系统剪贴板读取图片并解码。
 *
 * 用 navigator.clipboard.read() 拿到 ClipboardItem，遍历所有 type
 * 找到 image/* 的 blob，然后走 decodeQrFromFile 同一条路径。
 *
 * 兼容性：现代浏览器 / Tauri WebView 默认可用。
 * 权限：首次调用会弹用户授权。
 */
export async function decodeQrFromClipboard(): Promise<DecodeResult> {
  if (!navigator.clipboard || !navigator.clipboard.read) {
    return {
      ok: false,
      errorMessage: "当前环境不支持读取剪贴板（需要 HTTPS / 本地应用上下文）",
    };
  }
  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      for (const type of item.types) {
        if (type.startsWith("image/")) {
          const blob = await item.getType(type);
          const file = new File([blob], "clipboard.png", { type });
          return decodeQrFromFile(file);
        }
      }
    }
    return { ok: false, errorMessage: "剪贴板中没有图片" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // 用户取消授权会被当成 error 抛出，UI 上要区分
    return { ok: false, errorMessage: `读取剪贴板失败：${msg}` };
  }
}
