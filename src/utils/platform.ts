/**
 * 环境检测工具。
 *
 * - 平台检测（isMac / isWindows / isLinux）：用 navigator.userAgent + navigator.platform
 *   做轻量判断，SSR / 无 navigator 环境不抛错。
 * - Tauri 环境检测（isTauri）：通过 __TAURI_INTERNALS__ 全局判断。
 *
 * 设计参考 cc-switch/src/lib/platform.ts。
 */

function readPlatform(): { ua: string; plat: string } {
  try {
    return {
      ua: navigator.userAgent || "",
      // navigator.platform 已被 W3C 弃用，但 Tauri webview 在 Linux/Wayland 等场景下
      // userAgent 常不带平台标识，需要 platform 作 fallback。
      plat: ((navigator as { platform?: string }).platform || "").toLowerCase(),
    };
  } catch {
    return { ua: "", plat: "" };
  }
}

export function isMac(): boolean {
  const { ua, plat } = readPlatform();
  return /mac/i.test(ua) || plat.includes("mac");
}

export function isWindows(): boolean {
  const { ua } = readPlatform();
  return /windows|win32|win64/i.test(ua);
}

export function isLinux(): boolean {
  const { ua } = readPlatform();
  return (
    /linux|x11/i.test(ua) && !/android/i.test(ua) && !isMac() && !isWindows()
  );
}

/**
 * 是否运行在 Tauri webview 内。
 *
 * Tauri 2 在 webview 注入 __TAURI_INTERNALS__ 全局作为 IPC bridge，
 * Vite dev 独立打开的浏览器里没有这个对象。
 */
export function isTauri(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      typeof (window as unknown as { __TAURI_INTERNALS__?: unknown })
        .__TAURI_INTERNALS__ !== "undefined"
    );
  } catch {
    return false;
  }
}

/**
 * 是否需要渲染窗口顶部 drag bar。
 *
 * 仅在 Tauri webview 内渲染——无论 macOS / Windows / Linux：
 * - macOS Tauri (titleBarStyle: Overlay) → web 内容延伸到原生标题栏下方，红绿灯浮在 web 上，需要 28px 让位
 * - Windows / Linux Tauri → 默认原生装饰，理论上不需要 drag bar
 * - 浏览器（任何平台） → 没有 Tauri 注入，没有红绿灯需要让位，不渲染
 *
 * 简化版：只要在 Tauri 内 + macOS 才需要（其他组合由 OS 原生装饰处理）。
 */
export function showDragBar(): boolean {
  return isTauri() && isMac();
}
