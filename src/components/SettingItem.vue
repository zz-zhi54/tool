<script setup lang="ts">
import { ReloadOutlined } from "@ant-design/icons-vue";

import type {
  RegexFlag,
  RegexFlagsPreference,
  SettingSnapshot,
} from "../utils/storage";

/**
 * 单条设置项：标签（含描述） + 控件 + 当前/默认值 tag + 重置按钮。
 *
 * 整体强制单行布局（flex-wrap: nowrap），控件用 min-width: 0 允许收缩。
 * 标签和描述放在一行（中间用 · 分隔），长描述用省略号截断。
 */
defineProps<{
  snap: SettingSnapshot;
}>();

const emit = defineEmits<{
  reset: [snap: SettingSnapshot];
  // slider/toggle: (snap, value)
  // checkbox:    (snap, flag, checked)
  change: [snap: SettingSnapshot, ...args: unknown[]];
}>();
</script>

<template>
  <div class="setting-item">
    <!-- 标签（含描述，单行） -->
    <div class="setting-item-label" :title="snap.description ?? snap.label">
      <span class="setting-item-title">{{ snap.label }}</span>
      <span v-if="snap.description" class="setting-item-desc">
        · {{ snap.description }}
      </span>
    </div>

    <!-- 控件 -->
    <div class="setting-item-control">
      <template v-if="snap.control.type === 'toggle'">
        <a-radio-group
          :value="snap.value as string"
          option-type="button"
          button-style="outline"
          size="small"
          @update:value="(v: string | number) => emit('change', snap, v)"
        >
          <a-radio-button
            v-for="opt in snap.control.options"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.title }}
          </a-radio-button>
        </a-radio-group>
      </template>

      <template v-else>
        <!--
          checkbox 控件：紧凑单行显示。
          选项文字 + tooltip 描述；选中态用 primary 颜色高亮。
        -->
        <div class="setting-checkboxes">
          <a-checkbox
            v-for="opt in snap.control.options"
            :key="opt.value"
            :checked="
              (snap.value as RegexFlagsPreference)[opt.value as RegexFlag]
            "
            :title="opt.description"
            @update:checked="(v: boolean) => emit('change', snap, opt.value, v)"
          >
            {{ opt.title }}
          </a-checkbox>
        </div>
      </template>
    </div>

    <!-- 当前值/默认值（固定宽度，不参与换行） -->
    <div class="setting-item-value">
      <a-tag color="blue" size="small">当前：{{ snap.display }}</a-tag>
      <a-tag size="small">默认：{{ snap.defaultDisplay }}</a-tag>
      <a-tag v-if="!snap.isDefault" color="orange" size="small">
        已自定义
      </a-tag>
    </div>

    <a-button
      size="small"
      type="text"
      :disabled="snap.isDefault"
      class="setting-item-reset"
      @click="emit('reset', snap)"
    >
      <template #icon>
        <ReloadOutlined />
      </template>
    </a-button>
  </div>
</template>

<style scoped>
/*
 * 整行固定单行布局：
 * - 标签：固定 150px 起步，但允许更长（描述长时容器跟着撑）。
 * - 控件：flex: 1，min-width: 0 允许内部收缩。
 * - 数值 tag：固定内容宽度，不换行。
 * - 重置按钮：紧凑尺寸。
 */
.setting-item {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: nowrap;
  min-width: 0;
}

.setting-item-label {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex: 0 1 auto;
  min-width: 150px;
  max-width: 320px;
  overflow: hidden;
}

.setting-item-title {
  font-weight: 500;
  white-space: nowrap;
  flex: 0 0 auto;
}

.setting-item-desc {
  color: var(--app-text-muted);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.setting-item-control {
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
}

.setting-item-value {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
}

.setting-item-reset {
  flex: 0 0 auto;
}

/*
 * checkbox 控件：强制单行 + 紧凑间距。
 * - flex-wrap: nowrap 保证不换行
 * - overflow-x: auto 极端窄时横向滚动
 * - ga-1 让 5 个选项紧凑
 */
.setting-checkboxes {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 4px;
  overflow-x: auto;
  padding: 2px 0;
}
</style>
