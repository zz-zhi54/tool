<script setup lang="ts">
import { computed, ref } from "vue";
import type { Component } from "vue";

import {
  CloudDownloadOutlined,
  ReloadOutlined,
  RocketOutlined,
} from "@ant-design/icons-vue";

import SettingItem from "../../components/SettingItem.vue";
import { useAutoUpdater } from "../../composables/useAutoUpdater";
import { showInfo } from "../../composables/useMessage";
import {
  getSettings,
  remove,
  save,
  SETTING_GROUPS,
  SETTINGS,
} from "../../utils/storage";
import type {
  SqlQuoteStyle,
  SettingGroupMeta,
  SettingSnapshot,
} from "../../utils/storage";

import packageInfo from "../../../package.json";

const appVersion = packageInfo.version;

// ── 通用设置项（持久化偏好）──────────────────────────────

const items = ref<SettingSnapshot[]>(getSettings());

/** 分组后的设置项：仅顶层分组（当前只有 sqlGenerator），每个分组下平铺 SettingItem。 */
interface GroupedSetting {
  meta: SettingGroupMeta;
  items: SettingSnapshot[];
}

const grouped = computed<GroupedSetting[]>(() =>
  SETTING_GROUPS.map((meta) => ({
    meta,
    items: items.value.filter((item) => item.group === meta.id),
  })).filter((g) => g.items.length > 0),
);

function refresh() {
  items.value = getSettings();
}

/** SettingItem 的统一 change 事件入口（toggle: args = [value]）。 */
function onItemChange(snap: SettingSnapshot, ...args: unknown[]) {
  save(snap.key, String(args[0]) as SqlQuoteStyle);
  refresh();
}

function resetItem(snap: SettingSnapshot) {
  remove(snap.key);
  refresh();
  showInfo(`${snap.label} 已重置为默认值`);
}

function resetAll() {
  for (const meta of SETTINGS) remove(meta.key);
  refresh();
  showInfo("所有设置已重置为默认值");
}

// ── 版本与更新 ──────────────────────────────────────────
//
// 复用 useAutoUpdater 单例状态机：本组件只把 status 映射成「按钮文案 / loading /
// 回调」，不重复定义状态机。AppShell / useUpdateNotification 与本组件共享同一组 ref。
//
// UI 形态随 status 切换，覆盖 8 种状态：
//   idle             → 「检查更新」
//   checking         → disabled「检查中…」+ spinner
//   up-to-date       → 「重新检查」+ message「已是最新」
//   available        → 「立即更新」
//   downloading      → disabled「下载中 N%」+ 内联进度条
//   ready            → 「立即重启」
//   relaunching      → disabled「重启中…」+ spinner
//   error            → 「重试」

const {
  status,
  info,
  progress,
  hasUpdate,
  remoteVersion,
  remoteVersionStatus,
  checkOnly,
  runUpdateFlow,
  relaunch,
} = useAutoUpdater();

interface VersionAction {
  /** 按钮当前的语义动作：用于埋点 / 后续扩展（如键盘快捷键）。 */
  key: "check" | "download" | "relaunch" | "retry";
  text: string;
  icon: Component;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}

const versionAction = computed<VersionAction>(() => {
  // 优先级：进行中态（relaunching / downloading / checking）优先于终态，
  // 这样 checkOnly 失败 → error → 重试，不会被之前的「下载中」残留按钮覆盖。
  switch (status.value) {
    case "relaunching":
      return {
        key: "relaunch",
        text: "重启中…",
        icon: RocketOutlined,
        loading: true,
        disabled: true,
        onClick: noop,
      };
    case "downloading":
      return {
        key: "download",
        text: `下载中 ${progress.value}%`,
        icon: CloudDownloadOutlined,
        loading: true,
        disabled: true,
        onClick: noop,
      };
    case "ready":
      return {
        key: "relaunch",
        text: "立即重启",
        icon: RocketOutlined,
        loading: false,
        disabled: false,
        onClick: () => {
          void relaunch();
        },
      };
    case "available":
      return {
        key: "download",
        text: "立即更新",
        icon: CloudDownloadOutlined,
        loading: false,
        disabled: false,
        onClick: () => {
          void runUpdateFlow();
        },
      };
    case "checking":
      return {
        key: "check",
        text: "检查中…",
        icon: ReloadOutlined,
        loading: true,
        disabled: true,
        onClick: noop,
      };
    case "error":
      return {
        key: "retry",
        text: "重试",
        icon: ReloadOutlined,
        loading: false,
        disabled: false,
        onClick: () => {
          void onCheck();
        },
      };
    case "up-to-date":
    case "idle":
    default:
      // up-to-date 用「重新检查」而不是「检查更新」，避免给用户「刚才没查到」的错觉。
      return {
        key: "check",
        text: status.value === "up-to-date" ? "重新检查" : "检查更新",
        icon: ReloadOutlined,
        loading: false,
        disabled: false,
        onClick: () => {
          void onCheck();
        },
      };
  }
});

function noop(): void {
  /* disabled 态按钮不会触发 click —— 仅占位 */
}

/**
 * 手动检查入口。runUpdateFlow 内部自带完整错误处理，这里只调 checkOnly，
 * 并对「无更新」场景给一条轻量 toast 反馈。
 */
async function onCheck(): Promise<void> {
  const result = await checkOnly();
  if (result === "up-to-date") {
    showInfo("当前已是最新版本");
  }
}

/**
 * 「远程最新版本」展示拆成 4 个独立 computed：模板里 v-if 链更直观，
 * 避免用 discriminated union 在模板里写 `view.kind === 'tag'` 这种 TS 难以收窄的判断。
 *
 * 优先级：检查中 → 已查到（有更新 / 无更新）→ 失败 → 等待检查。
 */
const showRemoteSpinner = computed(
  () => status.value === "checking" || remoteVersionStatus.value === "checking",
);

const showRemoteTag = computed(
  () =>
    remoteVersionStatus.value === "checked" &&
    status.value !== "checking" &&
    status.value !== "downloading",
);

/** 远程 tag 颜色：有可用更新 → 橙；已是最新 → 绿。 */
const remoteTagColor = computed<"orange" | "green">(() =>
  hasUpdate.value && info.value?.version ? "orange" : "green",
);

/** 远程 tag 文本：有可用更新时优先用 info.version（最权威），否则回退 remoteVersion。 */
const remoteTagVersion = computed(() => {
  if (hasUpdate.value && info.value?.version) return info.value.version;
  return remoteVersion.value ?? appVersion;
});

const showRemoteError = computed(
  () => remoteVersionStatus.value === "error" || status.value === "error",
);

const remoteText = computed(() =>
  remoteVersionStatus.value === "unavailable" ? "仅正式桌面版可用" : "等待检查",
);

/** 下载中才显示进度条；ready / idle / error 都不显示。 */
const showProgress = computed(() => status.value === "downloading");
</script>

<template>
  <a-flex
    vertical
    :gap="8"
    style="height: 100%; padding: 8px; box-sizing: border-box"
  >
    <a-card size="small" :body-style="{ padding: '4px 12px' }">
      <a-flex align="center" :gap="8">
        <strong>设置</strong>
        <a-flex :flex="'1 1 auto'" />
        <a-button size="small" type="default" @click="resetAll">
          <template #icon>
            <ReloadOutlined />
          </template>
          重置全部
        </a-button>
      </a-flex>
    </a-card>

    <a-flex
      vertical
      :gap="16"
      style="flex: 1 1 auto; min-height: 0; overflow: auto"
    >
      <a-card
        v-for="group in grouped"
        :key="group.meta.id"
        size="small"
        :title="group.meta.title"
      >
        <template #extra>
          <a-typography-text type="secondary">
            {{ group.meta.description }}
          </a-typography-text>
        </template>

        <a-flex vertical :gap="16">
          <SettingItem
            v-for="snap in group.items"
            :key="snap.key"
            :snap="snap"
            @change="onItemChange"
            @reset="resetItem"
          />
        </a-flex>
      </a-card>

      <!--
        版本与更新：当前版本（固定） + 远程最新版本（状态驱动） + 操作按钮（状态驱动）。
        操作按钮覆盖 useAutoUpdater 全部 8 种状态，避免用户面对「按钮不动」的死状态。
      -->
      <a-card size="small" title="版本与更新">
        <a-descriptions size="small" :column="1">
          <a-descriptions-item label="当前版本">
            <a-tag color="blue">v{{ appVersion }}</a-tag>
          </a-descriptions-item>

          <a-descriptions-item label="远程最新版本">
            <a-tag v-if="showRemoteTag" :color="remoteTagColor">
              v{{ remoteTagVersion }}
            </a-tag>
            <a-spin v-else-if="showRemoteSpinner" size="small" />
            <a-typography-text v-else-if="showRemoteError" type="danger">
              获取失败
            </a-typography-text>
            <a-typography-text v-else type="secondary">
              {{ remoteText }}
            </a-typography-text>
          </a-descriptions-item>

          <a-descriptions-item label="操作">
            <a-flex vertical :gap="6">
              <a-button
                size="small"
                type="primary"
                :loading="versionAction.loading"
                :disabled="versionAction.disabled"
                @click="versionAction.onClick"
              >
                <template #icon>
                  <component :is="versionAction.icon" />
                </template>
                {{ versionAction.text }}
              </a-button>

              <!--
                下载中内联进度条：与 useUpdateNotification 底部 message 同步显示。
                两者绑定同一组 ref（progress），来源唯一，不会出现百分比不一致。
                留在设置页看到的是进度条；切到其他工具看到的是底部 message，
                两个 surface 各司其职，不引入路由判断来抑制（避免组件间耦合）。
              -->
              <a-progress
                v-if="showProgress"
                :percent="progress"
                :show-info="false"
                size="small"
              />
            </a-flex>
          </a-descriptions-item>
        </a-descriptions>
      </a-card>
    </a-flex>
  </a-flex>
</template>
