<script setup lang="ts">
import { computed, ref } from "vue";
import { CloudDownloadOutlined, RocketOutlined } from "@ant-design/icons-vue";

import { useAutoUpdater } from "../composables/useAutoUpdater";
import { showError } from "../composables/useMessage";
import packageInfo from "../../package.json";

const open = ref(false);
const appVersion = packageInfo.version;

const {
  status,
  info,
  progress,
  error,
  runUpdateFlow,
  checkOnly,
  relaunch,
} = useAutoUpdater();

/**
 * 允许关闭 Modal 的状态：空闲 / 已是最新 / 失败。
 * 检查中 / 发现新版本 / 下载中 / 下载完成 / 重启中 时点遮罩/关闭键/ESC 都无效，
 * 避免误操作打断下载或安装流程。
 */
const canClose = computed(
  () =>
    status.value === "idle" ||
    status.value === "up-to-date" ||
    status.value === "ready" ||
    status.value === "error",
);

/**
 * "立即下载"按钮是否处于 loading 状态。
 * 用 ref 包一层避免在 v-else-if="status === 'available'" 块内
 * 直接比较 status === 'downloading' 触发 TS2367（类型已收窄）。
 */
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
 * 主动打开 Modal 的入口。
 *
 * 由 chrome 上的"更新"按钮（侧边栏 / 顶部导航）通过 inject 拿到本组件 ref 后调用。
 *
 * 行为：reset → 打开 Modal → 立刻跑一次 checkOnly —— 进入 Modal 后用户看到
 * 的是真实的检查进度，而不是停在 "idle" 分支的"正在检查更新…"占位文案
 * （之前 openModal 不调检查，所以点按钮后 Modal 永远显示 idle 文案，看似卡死）。
 *
 * 如果发现新版本，status 走 available 分支，用户点"立即下载"才进入下载/安装。
 */
async function openModal() {
  open.value = true;
  // 提前设 checking，确保 waitForSilentlyIdle() 等待期间 Modal 也有转圈，
  // 而不是停在 idle 分支的"正在检查更新…"无反馈文字上。
  status.value = "checking";
  await checkOnly();
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
  <a-modal
    v-model:open="open"
    :footer="null"
    :mask-closable="canClose"
    :closable="canClose"
    :keyboard="canClose"
    width="420px"
  >
    <!-- 初始 / 检查中 -->
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

    <!-- 发现新版本 -->
    <a-flex v-else-if="status === 'available'" vertical :gap="12">
      <span>
        发现新版本 <strong>v{{ info?.version }}</strong>
      </span>
      <!--
        版本说明容器：高度约束 (max-height) 是必要的滚动行为，
        保留 inline style。
      -->
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

    <!-- 重启中：成功调用 relaunch() 后到进程真正退出之间的窗口。
         锁定 Modal，避免用户以为"卡住"再去点。 -->
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
