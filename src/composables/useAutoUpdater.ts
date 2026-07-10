/**
 * 应用内自动更新 composable。
 *
 * 封装 Tauri 官方 updater 插件（@tauri-apps/plugin-updater）的两条调用链：
 *
 * 1. 仅检查（不下、不弹窗）→ {@link useAutoUpdater#checkOnly}
 * 2. 检查 + 下载 + 安装    → {@link useAutoUpdater#runUpdateFlow}
 * 3. 安装完成后立即重启    → {@link useAutoUpdater#relaunch}
 *
 * 设计要点：
 *
 * - **单例状态**：所有 ref 都在模块顶层，多个组件同时调用 `useAutoUpdater()`
 *   会拿到同一组响应式状态。这样挂在不同位置的更新入口（侧边栏、顶部导航）
 *   能看到一致的 status / info / progress。
 * - 状态机：`idle | checking | up-to-date | available | downloading | ready | error`。
 *   UI 只需绑定一个 status + 一个 progress（0-100），不直接处理 Update 对象，
 *   避免组件里堆 try/catch。
 * - `isTauri() && import.meta.env.PROD` 双重短路：dev / 纯 Vite 打开时
 *   check() 会拿真实远端 latest.json 与 0.0.0 比较，误判为"有更新"，
 *   还会真的触发下载。`checkOnly` 在非生产环境静默返回 idle 不污染状态；
 *   `runUpdateFlow` 则把错误状态写入 error（用户主动点击时给出明确提示）。
 * - 下载进度走 Update.downloadAndInstall 的事件回调（Started / Progress / Finished），
 *   这里只对外暴露 `downloaded` / `total` 两个 ref，UI 算 percent。
 *
 * 后端配套：
 *
 * - `src-tauri/src/lib.rs` 注册 `tauri_plugin_updater::Builder::new().build()`
 * - `src-tauri/capabilities/default.json` 加 `"updater:default"`
 * - `src-tauri/tauri.conf.json` 的 `plugins.updater` 提供 `pubkey` + `endpoints`
 */

import { computed, ref, shallowRef } from "vue";

import { isTauri } from "@tauri-apps/api/core";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch as relaunchProcess } from "@tauri-apps/plugin-process";

/** 更新流程的状态机。UI 据此切换 Modal 内容。 */
export type UpdateStatus =
  | "idle"
  | "checking"
  | "up-to-date"
  | "available"
  | "downloading"
  | "ready"
  | "error";

/** 从 check() 拿到的版本信息，UI 用来展示新版本号 / release notes。 */
export interface UpdateInfo {
  version: string;
  notes?: string;
  date?: string;
}

/** 错误对象（向上抛给 message.error 时使用）。 */
export interface UpdateError {
  stage: "check" | "download" | "relaunch";
  cause: unknown;
}

// ── 模块级单例状态 ──────────────────────────────────────

const status = ref<UpdateStatus>("idle");
const info = shallowRef<UpdateInfo | null>(null);
const downloaded = ref(0);
const total = ref(0);
const error = shallowRef<UpdateError | null>(null);

const progress = computed(() =>
  total.value > 0
    ? Math.min(100, Math.round((downloaded.value / total.value) * 100))
    : 0,
);

function reset() {
  status.value = "idle";
  info.value = null;
  downloaded.value = 0;
  total.value = 0;
  error.value = null;
}

export function useAutoUpdater() {
  /**
   * 仅检查更新，不触发下载。
   *
   * 用在 AppShell 启动时跑一次静默后台检查 —— 让 chrome 上的"更新"按钮
   * 在没人点时也能根据 status 切换成"有更新"红点状态。
   *
   * dev / 非 Tauri 环境直接返回 idle，不污染 error。
   * 失败也会把 status 写到 "error"，但调用方选择忽略即可。
   */
  async function checkOnly(): Promise<UpdateStatus> {
    if (!import.meta.env.PROD || !isTauri()) {
      return "idle";
    }

    reset();
    status.value = "checking";

    let update;
    try {
      update = await check();
    } catch (cause) {
      status.value = "error";
      error.value = { stage: "check", cause };
      return status.value;
    }

    if (!update) {
      status.value = "up-to-date";
      return status.value;
    }

    info.value = {
      version: update.version,
      notes: update.body ?? undefined,
      date: update.date ?? undefined,
    };
    status.value = "available";
    return status.value;
  }

  /**
   * 检查 + 下载 + 安装。完成后**不**自动重启 —— 调用方在用户确认后调 {@link relaunch}。
   *
   * 返回最终状态：调用方若想自己兜底重试可以看这个；通常直接观察 `status.value` 即可。
   */
  async function runUpdateFlow(): Promise<UpdateStatus> {
    // 双重短路：dev / 浏览器环境直接返回带错误的结果，让 UI 给出明确提示。
    if (!import.meta.env.PROD || !isTauri()) {
      status.value = "error";
      error.value = {
        stage: "check",
        cause: new Error("自动更新仅在生产构建的桌面端可用"),
      };
      return status.value;
    }

    // ── 检查 ────────────────────────────────────────────
    reset();
    status.value = "checking";

    let update;
    try {
      update = await check();
    } catch (cause) {
      status.value = "error";
      error.value = { stage: "check", cause };
      return status.value;
    }

    if (!update) {
      status.value = "up-to-date";
      return status.value;
    }

    info.value = {
      version: update.version,
      notes: update.body ?? undefined,
      date: update.date ?? undefined,
    };
    status.value = "available";

    // ── 下载 + 安装 ────────────────────────────────────
    status.value = "downloading";

    try {
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            total.value = event.data.contentLength ?? 0;
            downloaded.value = 0;
            break;
          case "Progress":
            downloaded.value += event.data.chunkLength;
            break;
          case "Finished":
            downloaded.value = total.value;
            break;
        }
      });
    } catch (cause) {
      status.value = "error";
      error.value = { stage: "download", cause };
      return status.value;
    }

    status.value = "ready";
    return status.value;
  }

  /** 调起应用重启以应用更新。Windows 上安装包会自动退出进程，此处不需要再退。 */
  async function relaunch(): Promise<void> {
    try {
      await relaunchProcess();
    } catch (cause) {
      status.value = "error";
      error.value = { stage: "relaunch", cause };
    }
  }

  return {
    // 状态
    status,
    info,
    downloaded,
    total,
    progress,
    error,
    // 行为
    checkOnly,
    runUpdateFlow,
    relaunch,
    reset,
  };
}
