<script setup lang="ts">
import { computed, ref } from "vue";

import {
  getAllStorageItems,
  resetStorage,
  setStorage,
  STORAGE_GROUPS,
  STORAGE_KEYS,
} from "../../utils/storage";
import type {
  RegexFlag,
  RegexFlagsPreference,
  SqlQuoteStyle,
  StorageItem,
  StorageItemMeta,
  StorageItemName,
} from "../../utils/storage";

const snackbar = ref(false);
const snackbarText = ref("");

/**
 * 所有存储项的响应式列表。
 *
 * 每次修改后通过 refresh() 重新读取，保证 UI 与 localStorage 同步。
 */
const storageItems = ref<StorageItemMeta[]>(getAllStorageItems());

const groupedItems = computed(() =>
  STORAGE_GROUPS.map((group) => ({
    ...group,
    items: storageItems.value.filter((item) => item.group === group.id),
  })).filter((group) => group.items.length > 0),
);

/** 刷新存储项列表 */
function refresh() {
  storageItems.value = getAllStorageItems();
}

/**
 * 根据存储项常量名获取 STORAGE_KEYS 中的定义。
 */
function getStorageItem(name: StorageItemName): StorageItem<unknown> {
  return STORAGE_KEYS[name] as unknown as StorageItem<unknown>;
}

function getSliderValue(item: StorageItemMeta): number {
  return typeof item.value === "number"
    ? item.value
    : Number(item.defaultValue);
}

function getToggleValue(item: StorageItemMeta): string {
  return typeof item.value === "string"
    ? item.value
    : String(item.defaultValue);
}

function getFlagsValue(item: StorageItemMeta): RegexFlagsPreference {
  return item.value as RegexFlagsPreference;
}

/**
 * 滑块值变更时持久化到 localStorage。
 */
function handleSliderChange(name: StorageItemName, value: number) {
  const item = getStorageItem(name);

  if (item.control.type !== "slider") {
    return;
  }

  setStorage(item, value);
  refresh();
}

function handleToggleChange(name: StorageItemName, value: string) {
  const item = getStorageItem(name);

  if (item.control.type !== "toggle") {
    return;
  }

  setStorage(item, value as SqlQuoteStyle);
  refresh();
}

function handleCheckboxChange(
  name: StorageItemName,
  flag: string,
  checked: boolean | null,
) {
  const item = getStorageItem(name);

  if (item.control.type !== "checkboxes") {
    return;
  }

  const current = getFlagsValue(
    storageItems.value.find((storageItem) => storageItem.name === name)!,
  );

  setStorage(item, {
    ...current,
    [flag as RegexFlag]: Boolean(checked),
  });
  refresh();
}

/**
 * 重置单个存储项为默认值。
 */
function handleResetItem(item: StorageItemMeta) {
  resetStorage(getStorageItem(item.name));
  refresh();
  showMessage(`${item.label} 已重置为默认值`);
}

/**
 * 重置所有存储项为默认值。
 */
function handleResetAll() {
  for (const name of Object.keys(STORAGE_KEYS) as StorageItemName[]) {
    resetStorage(getStorageItem(name));
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

      <v-spacer />

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
    <div
      class="d-flex flex-column ga-3"
      style="flex: 1 1 auto; min-height: 0; overflow: auto"
    >
      <v-card v-for="group in groupedItems" :key="group.id" border flat rounded>
        <v-card-item :subtitle="group.description" :title="group.title" />

        <v-divider />

        <v-card-text class="d-flex flex-column ga-4">
          <div
            v-for="item in group.items"
            :key="item.name"
            class="d-flex align-center ga-3 flex-wrap"
          >
            <!-- 标签 -->
            <div style="min-width: 150px; flex: 0 0 150px">
              <div class="text-body-2 font-weight-medium">
                {{ item.label }}
              </div>
              <div
                v-if="item.description"
                class="text-caption text-medium-emphasis"
              >
                {{ item.description }}
              </div>
            </div>

            <!-- 控件 -->
            <div style="min-width: 220px; flex: 1 1 260px">
              <v-slider
                v-if="item.control.type === 'slider'"
                :model-value="getSliderValue(item)"
                :min="item.control.min"
                :max="item.control.max"
                :step="item.control.step"
                density="compact"
                hide-details
                thumb-label
                @update:model-value="
                  (value: number) => handleSliderChange(item.name, value)
                "
              />

              <v-btn-toggle
                v-else-if="item.control.type === 'toggle'"
                :model-value="getToggleValue(item)"
                density="compact"
                mandatory
                variant="outlined"
                @update:model-value="
                  (value: string) => handleToggleChange(item.name, value)
                "
              >
                <v-btn
                  v-for="option in item.control.options"
                  :key="option.value"
                  size="small"
                  :text="option.title"
                  :value="option.value"
                />
              </v-btn-toggle>

              <div v-else class="d-flex ga-2 flex-wrap">
                <v-checkbox-btn
                  v-for="option in item.control.options"
                  :key="option.value"
                  :model-value="getFlagsValue(item)[option.value as RegexFlag]"
                  :label="option.title"
                  :title="option.description"
                  density="compact"
                  hide-details
                  @update:model-value="
                    (value: boolean | null) =>
                      handleCheckboxChange(item.name, option.value, value)
                  "
                />
              </div>
            </div>

            <!-- 当前值/默认值 -->
            <div class="d-flex align-center ga-1" style="flex: 0 0 auto">
              <v-chip color="primary" label size="x-small" variant="tonal">
                当前：{{ item.displayValue }}
              </v-chip>
              <v-chip label size="x-small" variant="outlined">
                默认：{{ item.displayDefaultValue }}
              </v-chip>
              <v-chip
                v-if="!item.isDefault"
                color="warning"
                label
                size="x-small"
                variant="tonal"
              >
                已自定义
              </v-chip>
            </div>

            <!-- 单项重置按钮 -->
            <v-btn
              :disabled="item.isDefault"
              density="compact"
              icon="$refresh"
              size="x-small"
              variant="text"
              @click="handleResetItem(item)"
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
