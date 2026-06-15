<script setup lang="ts">
import { computed, ref } from "vue";

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
  SettingSnapshot,
} from "../../utils/storage";

const snackbar = ref(false);
const snackbarText = ref("");

const items = ref<SettingSnapshot[]>(getSettings());

const grouped = computed(() =>
  SETTING_GROUPS.map((g) => ({
    ...g,
    items: items.value.filter((item) => item.group === g.id),
  })).filter((g) => g.items.length > 0),
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

function onToggle(key: string, value: string) {
  save(key, value as SqlQuoteStyle);
  refresh();
}

function onCheckbox(key: string, flag: string, checked: boolean | null) {
  const snap = getSnapshot(key);
  save(key, {
    ...(snap.value as RegexFlagsPreference),
    [flag as RegexFlag]: Boolean(checked),
  });
  refresh();
}

function resetItem(snap: SettingSnapshot) {
  remove(snap.key);
  refresh();
  showMessage(`${snap.label} 已重置为默认值`);
}

function resetAll() {
  for (const meta of SETTINGS) remove(meta.key);
  refresh();
  showMessage("所有设置已重置为默认值");
}

function showMessage(msg: string) {
  snackbarText.value = msg;
  snackbar.value = true;
}
</script>

<template>
  <div
    class="d-flex flex-column ga-2 h-100"
    style="min-height: 0; overflow: hidden"
  >
    <v-toolbar border density="compact" flat rounded style="flex: 0 0 auto">
      <v-toolbar-title class="text-body-2 font-weight-medium"
        >设置</v-toolbar-title
      >
      <v-spacer />
      <v-btn
        color="warning"
        density="compact"
        prepend-icon="$refresh"
        size="small"
        text="重置全部"
        variant="text"
        @click="resetAll"
      />
    </v-toolbar>

    <div
      class="d-flex flex-column ga-3"
      style="flex: 1 1 auto; min-height: 0; overflow: auto"
    >
      <v-card v-for="group in grouped" :key="group.id" border flat rounded>
        <v-card-item :subtitle="group.description" :title="group.title" />
        <v-divider />
        <v-card-text class="d-flex flex-column ga-4">
          <div
            v-for="snap in group.items"
            :key="snap.key"
            class="d-flex align-center ga-3 flex-wrap"
          >
            <!-- 标签 -->
            <div style="min-width: 150px; flex: 0 0 150px">
              <div class="text-body-2 font-weight-medium">{{ snap.label }}</div>
              <div
                v-if="snap.description"
                class="text-caption text-medium-emphasis"
              >
                {{ snap.description }}
              </div>
            </div>

            <!-- 控件 -->
            <div style="min-width: 220px; flex: 1 1 260px">
              <v-slider
                v-if="snap.control.type === 'slider'"
                :model-value="snap.value as number"
                :min="snap.control.min"
                :max="snap.control.max"
                :step="snap.control.step"
                density="compact"
                hide-details
                thumb-label
                @update:model-value="(v: number) => onSlider(snap.key, v)"
              />

              <v-btn-toggle
                v-else-if="snap.control.type === 'toggle'"
                :model-value="snap.value as string"
                density="compact"
                mandatory
                variant="outlined"
                @update:model-value="(v: string) => onToggle(snap.key, v)"
              >
                <v-btn
                  v-for="opt in snap.control.options"
                  :key="opt.value"
                  size="small"
                  :text="opt.title"
                  :value="opt.value"
                />
              </v-btn-toggle>

              <div v-else class="d-flex ga-2 flex-wrap">
                <v-checkbox-btn
                  v-for="opt in snap.control.options"
                  :key="opt.value"
                  :model-value="
                    (snap.value as RegexFlagsPreference)[opt.value as RegexFlag]
                  "
                  :label="opt.title"
                  :title="opt.description"
                  density="compact"
                  hide-details
                  @update:model-value="
                    (v: boolean | null) => onCheckbox(snap.key, opt.value, v)
                  "
                />
              </div>
            </div>

            <!-- 当前值/默认值 -->
            <div class="d-flex align-center ga-1" style="flex: 0 0 auto">
              <v-chip color="primary" label size="x-small" variant="tonal">
                当前：{{ snap.display }}
              </v-chip>
              <v-chip label size="x-small" variant="outlined">
                默认：{{ snap.defaultDisplay }}
              </v-chip>
              <v-chip
                v-if="!snap.isDefault"
                color="warning"
                label
                size="x-small"
                variant="tonal"
              >
                已自定义
              </v-chip>
            </div>

            <v-btn
              :disabled="snap.isDefault"
              density="compact"
              icon="$refresh"
              size="x-small"
              variant="text"
              @click="resetItem(snap)"
            />
          </div>
        </v-card-text>
      </v-card>
    </div>

    <v-snackbar v-model="snackbar" timeout="2000">{{
      snackbarText
    }}</v-snackbar>
  </div>
</template>
