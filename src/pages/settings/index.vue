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
  SqlQuoteStyle,
  SettingGroupMeta,
  SettingSnapshot,
} from "../../utils/storage";

const items = ref<SettingSnapshot[]>(getSettings());

/**
 * 分组后的设置项：仅顶层分组（当前只有 sqlGenerator），
 * 每个分组下平铺 SettingItem。
 */
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

// ── handlers ────────────────────────────────────────

function onToggle(key: string, value: string | number) {
  save(key, String(value) as SqlQuoteStyle);
  refresh();
}

/**
 * SettingItem 的统一 change 事件入口。
 * - toggle：args = [value]
 */
function onItemChange(snap: SettingSnapshot, ...args: unknown[]) {
  onToggle(snap.key, args[0] as string | number);
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
    </a-flex>
  </a-flex>
</template>
