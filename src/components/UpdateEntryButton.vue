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

import { computed, inject } from "vue";
import {
  CheckCircleOutlined,
  CloudDownloadOutlined,
  RocketOutlined,
} from "@ant-design/icons-vue";

import { useAutoUpdater } from "../composables/useAutoUpdater";
import { OPEN_UPDATE_MODAL_KEY } from "../composables/useUpdateModal";
import packageInfo from "../../package.json";

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

/** 状态对应按钮 type（颜色由 antdv 框架主题控制）。 */
const buttonType = computed<"primary" | "default" | "text">(() => {
  if (hasUpdate.value) return "primary";
  return "text";
});

/**
 * 按钮文本：根据是否有新版本显示不同文案。
 *
 * - 有更新（available）：「升级 v新」+ 火箭图标 + 红色 + 红点
 * - 已是最新（up-to-date）：「已是最新 · v当前」+ ✓ 图标
 * - 检查中（checking）：「检查更新…」+ loading
 * - 其他：兜底显示「更新 · v当前」+ 下载图标
 */
const label = computed(() => {
  if (hasUpdate.value && newVersion.value) {
    return `升级 v${newVersion.value}`;
  }
  if (isUpToDate.value) {
    return `已是最新 · v${appVersion}`;
  }
  return `更新 · v${appVersion}`;
});

const tooltip = computed(() => {
  if (hasUpdate.value && newVersion.value) {
    return `当前 v${appVersion} → v${newVersion.value}，点击查看`;
  }
  if (isUpToDate.value) {
    return `已是最新 v${appVersion}`;
  }
  if (isChecking.value) {
    return "正在检查更新…";
  }
  return `检查 v${appVersion} 是否有更新`;
});

const openModal = inject(OPEN_UPDATE_MODAL_KEY, null);

function onClick() {
  openModal?.();
}
</script>

<template>
  <a-tooltip :title="tooltip" placement="right">
    <a-badge :dot="hasUpdate" :offset="[-2, 2]">
      <a-button
        block
        size="small"
        :type="buttonType"
        :danger="hasUpdate"
        :loading="isChecking"
        data-tauri-no-drag
        @click="onClick"
      >
        <template #icon>
          <RocketOutlined v-if="hasUpdate" />
          <CheckCircleOutlined v-else-if="isUpToDate" />
          <CloudDownloadOutlined v-else />
        </template>
        <span v-if="!props.collapsed">
          {{ label }}
        </span>
      </a-button>
    </a-badge>
  </a-tooltip>
</template>
