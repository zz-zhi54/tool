<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { CloudDownloadOutlined, RocketOutlined } from "@ant-design/icons-vue";

import { useAutoUpdater } from "../composables/useAutoUpdater";
import { showError } from "../composables/useMessage";
import { isTauri } from "@tauri-apps/api/core";
import packageInfo from "../../package.json";

const open = ref(false);
const appVersion = packageInfo.version;

const { status, info, progress, error, runUpdateFlow, relaunch, reset } =
  useAutoUpdater();

/**
 * 允许关闭 Modal 的状态：空闲 / 已是最新 / 失败 / 下载完成（待重启）。
 * 检查中 / 发现新版本 / 下载中 / 重启中 锁住 modal。
 *
 * 设计（与 useUpdateNotification 配套）：
 * - 通知里的「立即下载」会带 `goDownload=true` 打开 modal → 走 runUpdateFlow。
 * - 通知里不显示下载中状态 —— modal 出现时下载已经在跑。
 * - 用户在「下载中」看到 modal 是「后台下载 + 锁屏」而不是「卡死」：
 *   进度条持续更新、界面无法操作（官方 updater 行为：下载中无可取消句柄）。
 * - 官方边界（@tauri-apps/plugin-updater 2.10.1）：
 *   check / downloadAndInstall / relaunch 都没有 cancel / abort 句柄；
 *   这里锁 modal 不是为了避免 race，而是把「下载确实在跑」明示给用户。
 */
const canClose = computed(
  () =>
    status.value === "idle" ||
    status.value === "up-to-date" ||
    status.value === "ready" ||
    status.value === "error",
);

const isDownloading = computed(() => status.value === "downloading");

function describeError(err: { stage: string; cause: unknown }): string {
  const detail =
    err.cause instanceof Error
      ? err.cause.message
      : typeof err.cause === "string"
        ? err.cause
        : "未知错误";
  switch (err.stage) {
    case "check":
      return `检查更新失败：${detail}`;
    case "download":
      return `下载更新失败：${detail}`;
    case "relaunch":
      return `重启失败：${detail}`;
    default:
      return detail;
  }
}

/**
 * 外部入口。
 *
 * - `open()` 不带参 / `goDownload=false`：仅打开 modal 用于查看 ready / 错误。
 * - `open(true)`：从通知的「立即下载」进入，先 reset 再走 runUpdateFlow。
 *
 * 检查（checkOnly）由 useUpdateNotification 触发，本组件不再做。
 */
async function openModal(goDownload = false) {
  if (!goDownload) {
    open.value = true;
    return;
  }

  // 非 Tauri 环境下不应该到这里（通知也只在 Tauri 内有意义），但守住兜底。
  if (!isTauri()) {
    showError("自动更新仅在桌面端可用");
    return;
  }

  // 仅在「空闲 / 错误」态下从下载入口走完整 runUpdateFlow；
  // available / downloading / ready 阶段说明通知已经把状态推到正确位置，
  // 直接开 modal 让用户看到当前进度。
  if (status.value === "idle" || status.value === "error") {
    reset();
    open.value = true;
    status.value = "checking";
    // runUpdateFlow 内部会重新 check + download，过程中 modal 显示检查/下载阶段。
    const final = await runUpdateFlow();
    if (final === "error" && error.value) {
      showError(describeError(error.value));
    }
    return;
  }

  open.value = true;
}
defineExpose({ open: openModal });

async function onConfirmDownload() {
  await runUpdateFlow();
  if (status.value === "error" && error.value) {
    showError(describeError(error.value));
  }
}

async function onRelaunch() {
  await relaunch();
  if (error.value) {
    showError(describeError(error.value));
  }
}

/**
 * ready 阶段关闭 modal 后允许重新点 sidebar 触发新一轮检查；
 * 这里监听 status 变化把 modal 同步为「关闭」即可，不需要再调 reset —— reset
 * 会清掉 info，导致 sidebar 失去版本号显示。
 */
watch(status, (s) => {
  if (s === "idle" || s === "up-to-date" || s === "error") {
    // 不主动关 modal —— 让用户自己点「好的 / 关闭」。
  }
});
</script>

<template>
  <a-modal
    v-model:open="open"
    :footer="null"
    :mask-closable="canClose"
    :closable="canClose"
    :keyboard="canClose"
    width="420px"
  >
    <!-- 初始 / 检查中：modal 出现说明是走 open(true) 的下载路径 -->
    <a-flex
      v-if="status === 'idle' || status === 'checking'"
      vertical
      align="center"
      :gap="12"
    >
      <a-spin v-if="status === 'checking'" />
      <span>正在检查更新…</span>
    </a-flex>

    <!-- 已是最新 -->
    <a-flex
      v-else-if="status === 'up-to-date'"
      vertical
      align="center"
      :gap="8"
    >
      <a-typography-title :level="5" style="margin: 0">
        已是最新版本
      </a-typography-title>
      <a-typography-text type="secondary">
        当前已是 v{{ appVersion }}，无需更新。
      </a-typography-text>
      <a-button type="primary" @click="open = false">好的</a-button>
    </a-flex>

    <!-- 发现新版本：modal 不会主动走到这里（通知先拦截），但保留兜底 -->
    <a-flex v-else-if="status === 'available'" vertical :gap="12">
      <span>
        发现新版本 <strong>v{{ info?.version }}</strong>
      </span>
      <a-alert
        v-if="info?.notes"
        type="info"
        :message="info.notes"
        show-icon
        style="max-height: 200px; overflow: auto"
      />
      <a-flex :gap="8" justify="flex-end">
        <a-button @click="open = false">稍后</a-button>
        <a-button
          type="primary"
          :loading="isDownloading"
          @click="onConfirmDownload"
        >
          <template #icon><CloudDownloadOutlined /></template>
          立即下载
        </a-button>
      </a-flex>
    </a-flex>

    <!-- 下载中 -->
    <a-flex v-else-if="status === 'downloading'" vertical :gap="12">
      <span>正在下载 v{{ info?.version }}…</span>
      <a-progress :percent="progress" />
    </a-flex>

    <!-- 下载完成 -->
    <a-flex v-else-if="status === 'ready'" vertical align="center" :gap="12">
      <a-typography-title :level="5" style="margin: 0">
        下载完成
      </a-typography-title>
      <a-typography-text type="secondary">
        点击「立即重启」应用更新。
      </a-typography-text>
      <a-flex :gap="8">
        <a-button @click="open = false">稍后重启</a-button>
        <a-button type="primary" @click="onRelaunch">
          <template #icon><RocketOutlined /></template>
          立即重启
        </a-button>
      </a-flex>
    </a-flex>

    <!-- 重启中 -->
    <a-flex
      v-else-if="status === 'relaunching'"
      vertical
      align="center"
      :gap="12"
    >
      <a-spin />
      <span>正在重启应用…</span>
    </a-flex>

    <!-- 失败 -->
    <a-flex v-else-if="status === 'error'" vertical align="center" :gap="12">
      <a-alert
        type="error"
        show-icon
        :message="error ? describeError(error) : '更新失败'"
      />
      <a-button @click="open = false">关闭</a-button>
    </a-flex>
  </a-modal>
</template>
