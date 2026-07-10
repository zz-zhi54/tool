<script setup lang="ts">
/**
 * 主界面左侧栏底部「更新」入口按钮。
 *
 * 响应 useAutoUpdater 的共享状态：
 *
 * - available → 红色 + 红点，tooltip 提示新版本号
 * - up-to-date → 绿色 + 对勾图标，标识「运行在最新版本」
 * - 其他状态   → 灰色 + 下载图标（默认）
 *
 * 点击行为：始终打开共享 Modal（由 AppShell 通过 inject 提供打开函数）。
 * 这样把"流程是否要立刻跑"统一交给 Modal 内部根据 status 决定。
 */

import { computed, inject, type InjectionKey } from "vue";
import {
  CheckCircleOutlined,
  CloudDownloadOutlined,
  RocketOutlined,
} from "@ant-design/icons-vue";

import { useAutoUpdater } from "../composables/useAutoUpdater";
import packageInfo from "../../package.json";

type UpdateModalOpener = () => void;

/**
 * AppShell 提供、外部按钮消费的「打开更新 Modal」函数。
 *
 * 用 InjectionKey + 类型断言保 TS 类型一致。
 */
const OPEN_UPDATE_MODAL_KEY: InjectionKey<UpdateModalOpener> =
  Symbol("open-update-modal");

const props = withDefaults(
  defineProps<{
    /** 折叠态下只显示图标和 tooltip。 */
    collapsed?: boolean;
  }>(),
  { collapsed: false },
);

const { status, info } = useAutoUpdater();
const appVersion = packageInfo.version;

const hasUpdate = computed(() => status.value === "available");
const isUpToDate = computed(() => status.value === "up-to-date");
const newVersion = computed(() => info.value?.version ?? "");
const isChecking = computed(() => status.value === "checking");

const tooltip = computed(() => {
  if (hasUpdate.value && newVersion.value) {
    return `有新版本 v${newVersion.value} 可安装`;
  }
  if (isUpToDate.value) {
    return `已是最新 v${appVersion}`;
  }
  return `更新 v${appVersion}`;
});

const openModal = inject(OPEN_UPDATE_MODAL_KEY, null);

function onClick() {
  openModal?.();
}
</script>

<template>
  <a-tooltip :title="tooltip" placement="right">
    <a-badge
      :dot="hasUpdate"
      :offset="[-2, 2]"
      :number-style="{ backgroundColor: '#d4380d' }"
    >
      <a-button
        block
        size="small"
        type="text"
        :class="{
          'is-update-available': hasUpdate,
          'is-update-up-to-date': isUpToDate,
          'is-checking': isChecking,
        }"
        data-tauri-no-drag
        @click="onClick"
      >
        <template #icon>
          <RocketOutlined v-if="hasUpdate" />
          <CheckCircleOutlined v-else-if="isUpToDate" />
          <CloudDownloadOutlined v-else />
        </template>
        <span v-if="!props.collapsed" class="sidebar-footer-label">
          更新 ·
          <span class="sidebar-footer-value">v{{ appVersion }}</span>
        </span>
      </a-button>
    </a-badge>
  </a-tooltip>
</template>

<style scoped>
/* 有新版本：图标 + 文字变红 */
:deep(.is-update-available) {
  color: #d4380d;
}
:deep(.is-update-available .ant-btn-icon) {
  color: #d4380d !important;
}

/* 已是最新：图标 + 文字变绿（用 antdv success 色，浅/深主题都跟手） */
:deep(.is-update-up-to-date) {
  color: #52c41a;
}
:deep(.is-update-up-to-date .ant-btn-icon) {
  color: #52c41a !important;
}

/* 检查中：按钮跟着 status 转 loading 视觉 */
:deep(.is-checking) {
  cursor: progress;
}
</style>
