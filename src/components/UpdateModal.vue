<script setup lang="ts">
/**
 * 更新 Modal：仅作「重启确认」与「错误信息展示」入口。
 *
 * 设计要点：
 *
 * - **不再锁屏**：所有 status 都允许关闭（点遮罩 / 右上叉 / ESC 均生效）。
 *   modal 唯一的责任是把 ready / error 等需要「明确动作」的状态呈现给用户。
 * - **检查 / 下载都交给 useUpdateNotification 走通知**，本组件不主动调用
 *   checkOnly。
 * - **两个外部入口**：
 *   - `openRelaunch` — 打开 modal 走重启流程；status 不是 ready 时会跑一次
 *     `runUpdateFlow` 推到 ready（处理用户错过通知后主动点 sidebar 的场景）。
 *   - `openInfo` — 打开 modal 查看当前 status 对应的内容，不主动推进状态。
 *
 * 边界：
 * - 官方 `@tauri-apps/plugin-updater` 2.x 的 check / downloadAndInstall /
 *   relaunch 都没有 cancel / abort 句柄 —— 这里的"不锁屏"纯粹是为了让用户
 *   能在下载中切换别的工具页用，不是为了"取消下载"。如果想中断下载，只能
 *   等到 ready / error 后再操作。
 */

import { ref } from "vue";
import { CloudDownloadOutlined, RocketOutlined } from "@ant-design/icons-vue";
import { isTauri } from "@tauri-apps/api/core";

import { useAutoUpdater } from "../composables/useAutoUpdater";
import { showError } from "../composables/useMessage";
import type { UpdateModalAction } from "../composables/useUpdateModal";
import packageInfo from "../../package.json";

const open = ref(false);
const appVersion = packageInfo.version;

const {
  status,
  info,
  progress,
  error,
  runUpdateFlow,
  relaunch,
  reset,
} = useAutoUpdater();

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
 * - `openRelaunch`：从通知「立即重启」/ sidebar 主动点入。若当前 status
 *   不是 ready，会先跑一次 runUpdateFlow 把状态推到 ready 再展示「立即重启」。
 * - `openInfo`：仅展示当前 status 对应内容，不主动跑流程。
 *
 * 检查交给 useUpdateNotification 走通知；本组件不再调 checkOnly。
 */
async function openModal(action: UpdateModalAction = "openInfo"): Promise<void> {
  // 「立即重启」流程：若还没准备好（idle / error），先跑一次完整更新流；
  // 否则（如 status 已经是 ready）直接开 modal 让用户点重启。
  if (action === "openRelaunch") {
    if (!isTauri()) {
      showError("自动更新仅在桌面端可用");
      return;
    }
    if (status.value === "idle" || status.value === "error") {
      reset();
      open.value = true;
      const final = await runUpdateFlow();
      if (final === "error" && error.value) {
        showError(describeError(error.value));
      }
      return;
    }
  }

  // openInfo（或 openRelaunch 且 status 已经在 available/downloading/ready
  // 等中间态）：直接展示当前状态，不动状态机。
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
</script>

<template>
  <!--
    不再锁屏：maskClosable / closable / keyboard 全开。
    所有 status 用户都可以关掉 modal 去做别的事。
  -->
  <a-modal
    v-model:open="open"
    :footer="null"
    :mask-closable="true"
    :closable="true"
    :keyboard="true"
    width="420px"
  >
    <!-- 初始 / 检查中：通常是 openRelaunch 从 idle 起步在跑的阶段 -->
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

    <!--
      发现新版本：本组件不再主动走到这里（通知先拦截），但保留兜底分支
      应对用户手动跳过的边界。
    -->
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
        <a-button type="primary" @click="onConfirmDownload">
          <template #icon><CloudDownloadOutlined /></template>
          立即下载
        </a-button>
      </a-flex>
    </a-flex>

    <!-- 下载中：用户打开 modal 想看进度，但不锁屏 -->
    <a-flex v-else-if="status === 'downloading'" vertical :gap="12">
      <span>正在下载 v{{ info?.version }}…</span>
      <a-progress :percent="progress" />
      <a-typography-text type="secondary" style="font-size: 12px">
        下载在后台继续，关闭此弹窗不影响进度。
      </a-typography-text>
    </a-flex>

    <!-- 下载完成：modal 主要目的之一就是承载「立即重启」按钮 -->
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

    <!-- 重启中：成功调用 relaunch() 后到进程真正退出之间的窗口 -->
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