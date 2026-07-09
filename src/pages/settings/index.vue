<script setup lang="ts">
import { computed, ref } from "vue";

import { ReloadOutlined } from "@ant-design/icons-vue";

import SettingItem from "../../components/SettingItem.vue";
import { showInfo } from "../../composables/useMessage";
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
    </div>
  </div>
</template>
