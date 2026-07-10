<script setup lang="ts">
import { computed, ref } from "vue";

import {
  CloudDownloadOutlined,
  ReloadOutlined,
  RocketOutlined,
} from "@ant-design/icons-vue";

import SettingItem from "../../components/SettingItem.vue";
import { useAutoUpdater } from "../../composables/useAutoUpdater";
import { showError, showInfo } from "../../composables/useMessage";
import {
  getSettings,
  remove,
  save,
  SETTING_GROUPS,
  SETTINGS,
} from "../../utils/storage";
import type {
  RegexFlag,
  RegexFlagsPreference,
  SqlQuoteStyle,
  SettingGroupMeta,
  SettingSnapshot,
} from "../../utils/storage";

import packageInfo from "../../../package.json";

const appVersion = packageInfo.version;

const items = ref<SettingSnapshot[]>(getSettings());

/**
 * 分组后的设置项：每个顶层分组下挂项或子分组。
 *
 * - 顶层分组：无 parent 的 SETTING_GROUPS 条目。
 * - 布局类（layout）：item 挂在子分组上（数据格式/编码/时间/文本），
 *   顶层组只作为容器和说明。
 * - 工具类（regexTester / sqlGenerator）：item 直接挂在顶层组上。
 * - 没有项目的子分组自动隐藏。
 */
interface GroupedSetting {
  meta: SettingGroupMeta;
  items: SettingSnapshot[];
  children: { meta: SettingGroupMeta; items: SettingSnapshot[] }[];
}

const grouped = computed<GroupedSetting[]>(() =>
  SETTING_GROUPS.filter((g) => !g.parent)
    .map((top) => {
      const directItems = items.value.filter((item) => item.group === top.id);
      const children = SETTING_GROUPS.filter((s) => s.parent === top.id)
        .map((sub) => ({
          meta: sub,
          items: items.value.filter((item) => item.group === sub.id),
        }))
        .filter((sub) => sub.items.length > 0);
      return { meta: top, items: directItems, children };
    })
    // 隐藏空组（既无直接项又无子分组）
    .filter((g) => g.items.length > 0 || g.children.length > 0),
);

function refresh() {
  items.value = getSettings();
}

function getSnapshot(key: string): SettingSnapshot {
  return items.value.find((item) => item.key === key)!;
}

// ── handlers ────────────────────────────────────────

function onSlider(key: string, value: number) {
  save(key, value);
  refresh();
}

function onToggle(key: string, value: string | number) {
  save(key, String(value) as SqlQuoteStyle);
  refresh();
}

function onCheckbox(key: string, flag: string, checked: boolean) {
  const snap = getSnapshot(key);
  save(key, {
    ...(snap.value as RegexFlagsPreference),
    [flag as RegexFlag]: Boolean(checked),
  });
  refresh();
}

/**
 * SettingItem 的统一 change 事件入口。
 * - slider / toggle：args = [value]
 * - checkbox：       args = [flag, checked]
 */
function onItemChange(snap: SettingSnapshot, ...args: unknown[]) {
  if (snap.control.type === "checkboxes") {
    const [flag, checked] = args;
    onCheckbox(snap.key, String(flag), Boolean(checked));
  } else if (snap.control.type === "toggle") {
    onToggle(snap.key, args[0] as string | number);
  } else {
    onSlider(snap.key, Number(args[0]));
  }
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

// ── 自动更新 ─────────────────────────────────────────

const updater = useAutoUpdater();
const updaterOpen = ref(false);

// 模板直接访问这些顶层 ref，比 updaterStatus 干净
const {
  status: updaterStatus,
  info: updaterInfo,
  progress: updaterProgress,
  error: updaterError,
  runUpdateFlow,
  relaunch,
  reset: resetUpdater,
} = updater;

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

async function onCheckUpdate() {
  resetUpdater();
  updaterOpen.value = true;
  await runUpdateFlow();
  if (updaterStatus.value === "error" && updaterError.value) {
    showError(describeError(updaterError.value));
  }
}

async function onRelaunch() {
  await relaunch();
  if (updaterError.value) {
    showError(describeError(updaterError.value));
  }
}
</script>

<template>
  <div
    class="d-flex flex-column ga-2 h-100"
    style="min-height: 0; overflow: hidden"
  >
    <header
      class="d-flex align-center px-2 py-1"
      style="
        flex: 0 0 auto;
        border: 1px solid var(--app-border);
        border-radius: 4px;
        background-color: var(--app-surface);
        gap: 8px;
      "
    >
      <span class="text-body-2 font-weight-medium">设置</span>
      <span style="flex: 1 1 auto" />
      <a-button size="small" type="default" ghost @click="resetAll">
        <template #icon>
          <ReloadOutlined />
        </template>
        重置全部
      </a-button>
    </header>

    <div
      class="d-flex flex-column ga-3"
      style="flex: 1 1 auto; min-height: 0; overflow: auto"
    >
      <section
        v-for="group in grouped"
        :key="group.meta.id"
        style="
          border: 1px solid var(--app-border);
          border-radius: 4px;
          background-color: var(--app-surface);
        "
      >
        <header
          class="px-3 py-2"
          style="border-bottom: 1px solid var(--app-border)"
        >
          <div class="text-body-2 font-weight-medium">
            {{ group.meta.title }}
          </div>
          <div class="text-caption" style="color: var(--app-text-muted)">
            {{ group.meta.description }}
          </div>
        </header>

        <div class="d-flex flex-column ga-3 px-3 py-3">
          <!-- 直接挂在顶层下的项（regexTester / sqlGenerator 用） -->
          <div v-if="group.items.length > 0" class="d-flex flex-column ga-2">
            <SettingItem
              v-for="snap in group.items"
              :key="snap.key"
              :snap="snap"
              @change="onItemChange"
              @reset="resetItem"
            />
          </div>

          <!-- 子分组项（layout 类用：数据格式 / 编码 / 时间 / 文本） -->
          <div
            v-for="sub in group.children"
            :key="sub.meta.id"
            class="d-flex flex-column ga-2"
          >
            <div
              class="text-body-2"
              style="color: var(--app-text-muted); margin-top: 4px"
            >
              {{ sub.meta.title }}
            </div>
            <div
              v-if="sub.meta.description"
              class="text-caption"
              style="color: var(--app-text-muted); margin-bottom: 4px"
            >
              {{ sub.meta.description }}
            </div>
            <SettingItem
              v-for="snap in sub.items"
              :key="snap.key"
              :snap="snap"
              @change="onItemChange"
              @reset="resetItem"
            />
          </div>
        </div>
      </section>

      <!-- 关于 / 自动更新 -->
      <section
        style="
          border: 1px solid var(--app-border);
          border-radius: 4px;
          background-color: var(--app-surface);
        "
      >
        <header
          class="px-3 py-2"
          style="border-bottom: 1px solid var(--app-border)"
        >
          <div class="text-body-2 font-weight-medium">关于 Tool Workbench</div>
          <div class="text-caption" style="color: var(--app-text-muted)">
            当前版本、在线更新
          </div>
        </header>

        <div class="px-3 py-3 d-flex flex-column ga-3">
          <div class="d-flex align-center" style="gap: 8px">
            <span class="text-body-2" style="color: var(--app-text-muted)"
              >当前版本</span
            >
            <code class="text-body-2">v{{ appVersion }}</code>
          </div>
          <a-button
            type="default"
            :loading="updaterStatus === 'checking'"
            @click="onCheckUpdate"
          >
            <template #icon>
              <CloudDownloadOutlined />
            </template>
            检查更新
          </a-button>
        </div>
      </section>
    </div>

    <!-- 更新流程 Modal：单 Modal 多状态 -->
    <a-modal
      v-model:open="updaterOpen"
      :footer="null"
      :mask-closable="
        updaterStatus === 'up-to-date' ||
        updaterStatus === 'error' ||
        updaterStatus === 'idle'
      "
      :closable="
        updaterStatus === 'up-to-date' ||
        updaterStatus === 'error' ||
        updaterStatus === 'idle'
      "
      :keyboard="
        updaterStatus === 'up-to-date' ||
        updaterStatus === 'error' ||
        updaterStatus === 'idle'
      "
      width="420px"
    >
      <!-- 初始 / 检查中 -->
      <div
        v-if="updaterStatus === 'idle' || updaterStatus === 'checking'"
        class="d-flex flex-column align-center ga-3 py-3"
      >
        <a-spin v-if="updaterStatus === 'checking'" />
        <div class="text-body-2">正在检查更新…</div>
      </div>

      <!-- 已是最新 -->
      <div
        v-else-if="updaterStatus === 'up-to-date'"
        class="d-flex flex-column align-center ga-2 py-3"
      >
        <div class="text-body-2 font-weight-medium">已是最新版本</div>
        <div class="text-caption" style="color: var(--app-text-muted)">
          当前已是 v{{ appVersion }}，无需更新。
        </div>
        <a-button type="primary" @click="updaterOpen = false">好的</a-button>
      </div>

      <!-- 发现新版本 -->
      <div
        v-else-if="updaterStatus === 'available'"
        class="d-flex flex-column ga-3 py-2"
      >
        <div class="text-body-2">
          发现新版本
          <strong>v{{ updaterInfo?.version }}</strong>
        </div>
        <div
          v-if="updaterInfo?.notes"
          class="text-caption"
          style="
            color: var(--app-text-muted);
            max-height: 200px;
            overflow: auto;
            white-space: pre-wrap;
            border: 1px solid var(--app-border);
            border-radius: 4px;
            padding: 8px;
          "
        >
          {{ updaterInfo.notes }}
        </div>
        <div class="d-flex" style="gap: 8px; justify-content: flex-end">
          <a-button @click="updaterOpen = false">稍后</a-button>
          <a-button type="primary" @click="runUpdateFlow()">
            <template #icon><CloudDownloadOutlined /></template>
            立即下载
          </a-button>
        </div>
      </div>

      <!-- 下载中 -->
      <div
        v-else-if="updaterStatus === 'downloading'"
        class="d-flex flex-column ga-3 py-3"
      >
        <div class="text-body-2">正在下载 v{{ updaterInfo?.version }}…</div>
        <a-progress :percent="updaterProgress" />
      </div>

      <!-- 下载完成 -->
      <div
        v-else-if="updaterStatus === 'ready'"
        class="d-flex flex-column align-center ga-3 py-3"
      >
        <div class="text-body-2 font-weight-medium">下载完成</div>
        <div class="text-caption" style="color: var(--app-text-muted)">
          点击「立即重启」应用更新。
        </div>
        <a-button type="primary" @click="onRelaunch">
          <template #icon><RocketOutlined /></template>
          立即重启
        </a-button>
      </div>

      <!-- 失败 -->
      <div
        v-else-if="updaterStatus === 'error'"
        class="d-flex flex-column align-center ga-3 py-3"
      >
        <div class="text-body-2" style="color: var(--app-error, #d4380d)">
          {{ updaterError ? describeError(updaterError) : "更新失败" }}
        </div>
        <a-button @click="updaterOpen = false">关闭</a-button>
      </div>
    </a-modal>
  </div>
</template>
