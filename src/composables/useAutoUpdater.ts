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
 * - **状态机**：`idle | checking | up-to-date | available | downloading | ready | relaunching | error`。
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
  | "relaunching"
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

/** 远程版本检查状态；独立于下载 / 安装状态机，仅供只读信息展示。 */
type RemoteVersionStatus =
  | "idle"
  | "checking"
  | "checked"
  | "error"
  | "unavailable";

/** 远程服务器上的最新版本号。启动静默检查与手动检查都会写入；未成功 check 时保持 null，展示层回退为当前版本。 */
const remoteVersion = shallowRef<string | null>(null);
const remoteVersionStatus = ref<RemoteVersionStatus>("idle");

/**
 * 用户主动检查正在进行中。静默检查看到此标志会**完全跳过本轮**，
 * 避免：
 *
 * 1. 后台 catch 把刚刚由主动检查发现的 hasUpdate 抹回 false；
 * 2. 后台成功的返回值覆盖主动检查正在跑的 status；
 * 3. 后台与主动 reset() 互相踩踏 error ref。
 *
 * 注意：此标志**只**在主动检查（checkOnly / runUpdateFlow）侧写入，
 * 静默检查只读不写，否则两轮静默检查相互等待会死锁。
 */
const userCheckInFlight = ref(false);

/** 静默检查自身的"正在跑"标记。主动检查通过 waitForSilentlyIdle() 等本标志。 */
const silentCheckInFlight = ref(false);

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

    // 用户主动检查正在进行：完全跳过本轮静默检查，不要写任何共享状态。
    // 这是为防止后台 catch 把 hasUpdate 抹掉、或后台 success 抢在主动 reset 之前。
    //
    // 静默检查自己只持 silentCheckInFlight，与 userCheckInFlight 完全独立，
    // 主动检查通过 waitForSilentlyIdle() 等本轮结束。
    if (userCheckInFlight.value) return;

    silentCheckInFlight.value = true;
    try {
      const update = await check({ timeout: CHECK_TIMEOUT_MS });
      hasUpdate.value = update !== null;
    } catch {
      // 网络错 / 签名错 / 超时 —— 静默忽略，**保留** hasUpdate 上次状态
      // （不要清零，否则用户主动检查刚刚拿到的结果会被这次失败抹掉）。
    } finally {
      silentCheckInFlight.value = false;
    }
  }

  /**
   * 静默检查 + 直接后台下载。给 AppShell 启动用：
   * 如果发现新版本，立即在后台拉取安装包，不弹任何"询问"通知打扰用户；
   * 下载完成后由通知侧决定是否提示重启。
   *
   * 行为：
   * - 有 update → 把进度同步到 status / progress / info；下载完成进 ready
   * - 无 update → 直接返回，不动状态机
   * - 任何错（check 失败 / 签名错 / 下载失败）静默忽略，与启动静默检查同等待遇
   *
   * 用 userCheckInFlight + silentCheckInFlight 互斥，避免与主动检查抢状态。
   */
  async function checkAndDownloadSilently(): Promise<void> {
    if (!import.meta.env.PROD || !isTauri()) {
      remoteVersionStatus.value = "unavailable";
      return;
    }

    await waitForSilentlyIdle();
    if (userCheckInFlight.value) return;

    silentCheckInFlight.value = true;
    userCheckInFlight.value = true;
    remoteVersionStatus.value = "checking";
    try {
      const update = await check({ timeout: CHECK_TIMEOUT_MS });
      remoteVersion.value = update?.version ?? null;
      remoteVersionStatus.value = "checked";
      if (!update) return;

      info.value = {
        version: update.version,
        notes: update.body ?? undefined,
        date: update.date ?? undefined,
      };
      hasUpdate.value = true;
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
        status.value = "ready";
      } catch {
        // 下载失败静默；不污染 error（启动场景下用户没主动点击）
        status.value = "error";
        error.value = { stage: "download", cause: new Error("静默下载失败") };
      }
    } catch {
      // check() 失败静默；仅记录远程版本获取失败，不污染下载状态机
      remoteVersion.value = null;
      remoteVersionStatus.value = "error";
    } finally {
      silentCheckInFlight.value = false;
      userCheckInFlight.value = false;
    }
  }

  /**
   * 主动检查启动前调用：等到当前静默检查（若在跑）结束。
   *
   * 用一个轻量轮询，不引入额外的状态字段；空跑的轮询间隔短到肉眼不可见，
   * 实际场景下 99% 不会进入循环。
   */
  async function waitForSilentlyIdle(): Promise<void> {
    // 静默检查只在 silentCheckInFlight 持锁；不持 userCheckInFlight（那是主动检查用的）。
    while (silentCheckInFlight.value) {
      await new Promise((r) => setTimeout(r, 16));
    }
  }

  /**
   * 仅检查更新，不触发下载。会被"点更新按钮"主动调用，操作完整状态机。
   *
   * 不复用后台静默检查的结果：用户主动点 = 拿"现在"的结果，不拿几秒前的缓存。
   */
  async function checkOnly(): Promise<UpdateStatus> {
    if (!import.meta.env.PROD || !isTauri()) return "idle";

    // 等后台静默检查退出，避免它在我们 reset 后覆盖 hasUpdate。
    await waitForSilentlyIdle();

    userCheckInFlight.value = true;
    try {
      reset();
      status.value = "checking";

      let update;
      try {
        update = await check({ timeout: CHECK_TIMEOUT_MS });
      } catch (cause) {
        status.value = "error";
        error.value = { stage: "check", cause };
        // 同步远端版本状态：手动检查失败时设置页也要显示「获取失败」
        remoteVersionStatus.value = "error";
        return status.value;
      }

      // 远端版本探测成功（无论有没有新版本）。设置页的版本号展示直接据此
      // 渲染，不另起一个并行状态机——「启动静默检查」与「手动检查」共享同一组 ref。
      remoteVersionStatus.value = "checked";

      if (!update) {
        status.value = "up-to-date";
        hasUpdate.value = false;
        return status.value;
      }

      // 与 checkAndDownloadSilently 保持一致：拿到 update 时把远端版本号
      // 写入 remoteVersion，避免「下载中却仍显示当前版本」的不一致。
      remoteVersion.value = update.version;
      info.value = {
        version: update.version,
        notes: update.body ?? undefined,
        date: update.date ?? undefined,
      };
      hasUpdate.value = true;
      status.value = "available";
      return status.value;
    } finally {
      userCheckInFlight.value = false;
    }
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

    // 等后台静默检查退出
    await waitForSilentlyIdle();

    // 防御：极端时序下（Modal 的遮罩层几乎杜绝了这种可能）避免并发两次
    // runUpdateFlow 导致两个 check() 竞态共享状态。
    if (userCheckInFlight.value) return status.value;

    userCheckInFlight.value = true;
    try {
      // ── 检查 ────────────────────────────────────────
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

      // 与 checkOnly 对齐：手动点「立即更新」时把远端版本号也写进 remoteVersion。
      remoteVersion.value = update.version;
      info.value = {
        version: update.version,
        notes: update.body ?? undefined,
        date: update.date ?? undefined,
      };
      hasUpdate.value = true;

      // ── 下载 + 安装 ────────────────────────────────
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
    } finally {
      userCheckInFlight.value = false;
    }
  }

  /**
   * 调起应用重启以应用更新。
   *
   * Windows 上 NSIS 安装器启动后会自动退出当前进程，macOS / Linux 上
   * `relaunch` 立即重启。因此成功后 status 进入 "relaunching"，
   * 让 Modal 展示"正在重启…"转圈且不可关闭 —— 用户不会再以为"卡住了"。
   *
   * 失败时回退到 "ready" 而非保持 "ready" / "error"：用户可立即重试，
   * 不必关掉 Modal 再点一次更新按钮。
   */
  async function relaunch(): Promise<void> {
    const prevStatus = status.value;
    status.value = "relaunching";
    try {
      await relaunchProcess();
    } catch (cause) {
      // 失败回退到 ready：用户可以再次点击"立即重启"。
      status.value = prevStatus === "relaunching" ? "ready" : prevStatus;
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
    remoteVersion,
    remoteVersionStatus,
    // 行为
    checkOnly,
    checkSilently,
    checkAndDownloadSilently,
    runUpdateFlow,
    relaunch,
    reset,
  };
}
