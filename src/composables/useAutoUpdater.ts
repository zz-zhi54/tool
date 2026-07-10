/**
 * 应用内自动更新 composable。
 *
 * 封装 Tauri 官方 updater 插件（@tauri-apps/plugin-updater）的两条调用链：
 *
 * 1. 检查 + 下载 + 安装  →  {@link useAutoUpdater#runUpdateFlow}
 * 2. 安装完成后立即重启  →  {@link useAutoUpdater#relaunch}
 *
 * 设计要点：
 *
 * - 状态机：`idle | checking | up-to-date | available | downloading | ready | error`。
 *   UI 只需绑定一个 status + 一个 progress（0-100），不直接处理 Update 对象，
 *   避免组件里堆 try/catch。
 * - `isTauri() && import.meta.env.PROD` 双重短路：dev / 纯 Vite 打开时
 *   check() 会拿真实远端 latest.json 与 0.0.0 比较，误判为"有更新"，
 *   还会真的触发下载。这里直接把整个流程关掉。
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

export function useAutoUpdater() {
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

  /**
   * 检查 + 下载 + 安装。完成后**不**自动重启 —— 调用方在用户确认后调 {@link relaunch}。
   *
   * 返回最终状态：调用方若想自己兜底重试可以看这个；通常直接观察 `status.value` 即可。
   */
  async function runUpdateFlow(): Promise<UpdateStatus> {
    // 双重短路：dev / 浏览器环境直接返回，避免误触发真实下载。
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
    runUpdateFlow,
    relaunch,
    reset,
  };
}
