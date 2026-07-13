/**
 * 应用内自动更新 composable。
 *
 * 封装 Tauri 官方 updater 插件（@tauri-apps/plugin-updater）。
 *
 * 设计要点：
 *
 * - **单例状态**：所有 ref 都在模块顶层，多个组件同时调用 `useAutoUpdater()`
 *   会拿到同一组响应式状态。这样挂在不同位置的更新入口（侧边栏、设置页）
 *   能看到一致的 status / info / progress。
 * - **状态机**：`idle | checking | up-to-date | available | downloading | ready | error`。
 *   UI 只需绑定一个 status + 一个 progress（0-100），不直接处理 Update 对象，
 *   避免组件里堆 try/catch。
 * - **使用官方 API**：
 *   - `check({ timeout })` 原生支持超时，不在前端再包一层 Promise.race
 *   - `update.downloadAndInstall(cb)` 的 cb 签名就是 `{event, data}` 格式，
 *     Started/Progress/Finished 是官方事件名，不是自己造的协议
 *   - 不缓存 Update 对象：每次 check 都是新对象，避免 stale handle
 * - **避免后台检查与用户主动检查互相打断**：
 *   AppShell 启动时的静默后台检查只读 latest.json，不操作 status；
 *   真正"动状态机"的只有用户主动行为（点 sidebar/设置页的更新按钮）。
 *   之前两个 checkOnly 并发跑会让 status 反复被 reset，状态机混乱。
 * - **dev / 浏览器环境**：`checkOnly` 静默返回 idle 不污染 error；
 *   `runUpdateFlow` 把错误状态写入 error（用户主动点击时给出明确提示）。
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

/** check() 超时：30s 拿不到 latest.json 就 reject，避免任何 hang 场景。 */
const CHECK_TIMEOUT_MS = 30_000;

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

/**
 * AppShell 启动时静默跑 check()，仅更新 "hasUpdate" 红点，不动 status。
 *
 * 与"用户主动检查"分离：避免两个 checkOnly 并发把 status 反复 reset。
 */
const hasUpdate = ref(false);

function reset() {
  status.value = "idle";
  info.value = null;
  downloaded.value = 0;
  total.value = 0;
  error.value = null;
}

export function useAutoUpdater() {
  /**
   * 静默后台检查：仅刷新 hasUpdate 红点，不动 status / info。
   *
   * 用在 AppShell onMounted —— 启动 app 后悄悄看一眼 latest.json，
   * 有更新就在 sidebar 的"更新"按钮上点个红点，不打扰用户。
   *
   * 网络失败静默忽略（不要给用户弹错误信息——他根本没主动点击）。
   */
  async function checkSilently(): Promise<void> {
    if (!import.meta.env.PROD || !isTauri()) return;

    try {
      const update = await check({ timeout: CHECK_TIMEOUT_MS });
      hasUpdate.value = update !== null;
    } catch {
      // 网络错 / 签名错 / 超时 —— 静默忽略，保持上次状态
      hasUpdate.value = false;
    }
  }

  /**
   * 仅检查更新，不触发下载。会被"点更新按钮"主动调用，操作完整状态机。
   *
   * 不复用后台静默检查的结果：用户主动点 = 拿"现在"的结果，不拿几秒前的缓存。
   */
  async function checkOnly(): Promise<UpdateStatus> {
    if (!import.meta.env.PROD || !isTauri()) return "idle";

    reset();
    status.value = "checking";

    let update;
    try {
      update = await check({ timeout: CHECK_TIMEOUT_MS });
    } catch (cause) {
      status.value = "error";
      error.value = { stage: "check", cause };
      return status.value;
    }

    if (!update) {
      status.value = "up-to-date";
      hasUpdate.value = false;
      return status.value;
    }

    info.value = {
      version: update.version,
      notes: update.body ?? undefined,
      date: update.date ?? undefined,
    };
    hasUpdate.value = true;
    status.value = "available";
    return status.value;
  }

  /**
   * 检查 + 下载 + 安装。完成后**不**自动重启 —— 调用方在用户确认后调 {@link relaunch}。
   *
   * 流程：checkOnly → 拿到 update → downloadAndInstall。
   * downloadAndInstall 是官方单步 API，下载完成后自动 install，无需手动调 install()。
   */
  async function runUpdateFlow(): Promise<UpdateStatus> {
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
      update = await check({ timeout: CHECK_TIMEOUT_MS });
    } catch (cause) {
      status.value = "error";
      error.value = { stage: "check", cause };
      return status.value;
    }

    if (!update) {
      status.value = "up-to-date";
      hasUpdate.value = false;
      return status.value;
    }

    info.value = {
      version: update.version,
      notes: update.body ?? undefined,
      date: update.date ?? undefined,
    };
    hasUpdate.value = true;

    // ── 下载 + 安装 ────────────────────────────────────
    // 进度 callback 形参就是官方 {event, data} 协议：
    //   Started  → event.data.contentLength
    //   Progress → event.data.chunkLength
    //   Finished → no data
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
    hasUpdate,
    // 行为
    checkOnly,
    checkSilently,
    runUpdateFlow,
    relaunch,
    reset,
  };
}