<script setup lang="ts">
import { ref } from "vue";

import {
  getAllStorageItems,
  resetStorage,
  setStorage,
  STORAGE_KEYS,
} from "../../utils/storage";
import type { StorageItemMeta } from "../../utils/storage";

/**
 * 存储项常量名 → 中文标签映射。
 *
 * 新增存储项后需同步更新此映射。
 */
const ITEM_LABELS: Record<string, string> = {
  JSON_FORMATTER_PANEL_PERCENT: "JSON 格式化",
  YAML_FORMATTER_PANEL_PERCENT: "YAML 格式化",
  BASE64_CODEC_PANEL_PERCENT: "Base64 编解码",
  REGEX_TESTER_PANEL_PERCENT: "正则测试",
  SQL_GENERATOR_PANEL_PERCENT: "SQL IN 生成器",
};

/** 面板比例可拖拽范围，与 SplitPanel.clampPercent 一致 */
const SLIDER_MIN = 15;
const SLIDER_MAX = 85;

const snackbar = ref(false);
const snackbarText = ref("");

/**
 * 所有存储项的响应式列表。
 *
 * 每次修改后通过 refresh() 重新读取，保证 UI 与 localStorage 同步。
 */
const storageItems = ref<StorageItemMeta[]>(getAllStorageItems());

/** 刷新存储项列表 */
function refresh() {
  storageItems.value = getAllStorageItems();
}

/**
 * 获取存储项的中文标签，未映射时回退为常量名。
 */
function getLabel(name: string): string {
  return ITEM_LABELS[name] ?? name;
}

/**
 * 根据存储项常量名获取 STORAGE_KEYS 中的定义。
 * 用于 setStorage / resetStorage 调用。
 */
function getStorageItem(name: string) {
  return STORAGE_KEYS[name as keyof typeof STORAGE_KEYS];
}

/**
 * 滑块值变更时持久化到 localStorage。
 */
function handleSliderChange(name: string, value: number) {
  const item = getStorageItem(name);
  if (item) {
    setStorage(item, value);
    refresh();
  }
}

/**
 * 重置单个存储项为默认值。
 */
function handleResetItem(name: string) {
  const item = getStorageItem(name);
  if (item) {
    resetStorage(item);
    refresh();
    showMessage(`${getLabel(name)} 已重置为默认值`);
  }
}

/**
 * 重置所有存储项为默认值。
 */
function handleResetAll() {
  for (const name of Object.keys(STORAGE_KEYS)) {
    const item = getStorageItem(name);
    if (item) {
      resetStorage(item);
    }
  }
  refresh();
  showMessage("所有设置已重置为默认值");
}

function showMessage(message: string) {
  snackbarText.value = message;
  snackbar.value = true;
}
</script>

<template>
  <div
    class="d-flex flex-column ga-2 h-100"
    style="min-height: 0; overflow: hidden"
  >
    <!-- 顶部工具栏 -->
    <v-toolbar border density="compact" flat rounded style="flex: 0 0 auto">
      <v-toolbar-title class="text-body-2 font-weight-medium">
        设置
      </v-toolbar-title>

      <v-btn
        color="warning"
        density="compact"
        prepend-icon="$refresh"
        size="small"
        text="重置全部"
        variant="text"
        @click="handleResetAll"
      />
    </v-toolbar>

    <!-- 可滚动内容区 -->
    <div style="flex: 1 1 auto; min-height: 0; overflow: auto">
      <!-- 面板比例设置 -->
      <v-card border flat rounded>
        <v-card-title class="text-body-2 font-weight-medium">
          面板比例
        </v-card-title>

        <v-divider />

        <v-card-text class="d-flex flex-column ga-4">
          <div
            v-for="item in storageItems"
            :key="item.name"
            class="d-flex align-center ga-3"
          >
            <!-- 标签 -->
            <span class="text-body-2" style="min-width: 110px; flex-shrink: 0">
              {{ getLabel(item.name) }}
            </span>

            <!-- 滑块 -->
            <v-slider
              :model-value="item.value"
              :min="SLIDER_MIN"
              :max="SLIDER_MAX"
              :step="1"
              density="compact"
              hide-details
              thumb-label
              @update:model-value="
                (v: number) => handleSliderChange(item.name, v)
              "
            />

            <!-- 默认值提示 -->
            <span
              class="text-caption text-medium-emphasis"
              style="min-width: 65px; flex-shrink: 0; text-align: right"
            >
              默认: {{ item.defaultValue }}%
            </span>

            <!-- 单项重置按钮 -->
            <v-btn
              density="compact"
              icon="$refresh"
              size="x-small"
              variant="text"
              @click="handleResetItem(item.name)"
            />
          </div>
        </v-card-text>
      </v-card>
    </div>

    <v-snackbar v-model="snackbar" timeout="2000">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>
