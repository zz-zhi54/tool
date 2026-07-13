/**
 * 窗口 drag IPC 兜底。
 *
 * 走 Tauri 提供的 `startDragging()` —— 内部走
 * plugin:window|start_dragging IPC，由 Rust 端调 NSWindow.beginDrag。
 *
 * 这是**唯一** 跨 Tauri / WKWebView / macOS 版本都稳的路径，
 * CSS 的 data-tauri-drag-region / -webkit-app-region 在某些组合下
 * 会因 WebKit 不转发 mousedown 给原生窗口而不触发 —— 这种情况下
 * 必须由 JS 主动调用 startDragging 来桥接。
 *
 * 设计：监听 mousedown，落在 drag bar 上就调用 startDragging，
 * 落在 button / a 等交互控件上就让点击行为正常冒泡。
 *
 * 在非 Tauri 上下文（纯 Vite dev / Storybook / 单元测试）下，`getCurrentWindow`
 * 会因为没有 `__TAURI_INTERNALS__` IPC bridge 而抛错，这里直接返回 no-op，
 * 让页面可以照常加载，只是不再接管拖拽。
 */

import { getCurrentWindow } from "@tauri-apps/api/window";

const NO_DRAG_SELECTOR =
  "button, a, input, select, textarea, label, [role='button'], [data-no-drag], [data-tauri-no-drag]";

function isInteractive(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return target.closest(NO_DRAG_SELECTOR) !== null;
}

function hasTauriIpc(): boolean {
  // Tauri 2 在 webview 注入的全局 IPC bridge。Vite dev 独立打开时不存在。
  return (
    typeof window !== "undefined" &&
    typeof (window as unknown as { __TAURI_INTERNALS__?: unknown })
      .__TAURI_INTERNALS__ !== "undefined"
  );
}

export function bindWindowDrag(el: Element | null): () => void {
  if (!hasTauriIpc()) {
    // 非 Tauri 环境直接放弃接管，避免把上层 mounted hook 拖崩。
    return () => {};
  }

  if (!(el instanceof HTMLElement)) {
    // 组件实例 ref 传进来时不会触发这里，但留个守卫避免误用。
    return () => {};
  }

  let win: ReturnType<typeof getCurrentWindow>;
  try {
    win = getCurrentWindow();
  } catch {
    return () => {};
  }

  function onMouseDown(event: MouseEvent) {
    if (event.button !== 0) return;
    if (isInteractive(event.target)) return;

    // 阻止默认行为避免 click 误触发；
    // 后续若有 button 落在 drag bar 内部，它们的 isInteractive 守卫已经让事件冒泡。
    event.preventDefault();
    event.stopPropagation();

    // startDragging 在极少数情况下（窗口已销毁 / 权限被回收）会 reject，
    // 这里吞掉，避免变成未处理的 promise rejection。
    win.startDragging().catch(() => {});
  }

  // capture: true 让 drag 触发早于 antdv 的内部 pointer 监听
  el.addEventListener("mousedown", onMouseDown, true);

  return () => {
    el.removeEventListener("mousedown", onMouseDown, true);
  };
}
