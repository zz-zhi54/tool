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
 * 基于 antdv `<a-row>` + `<a-col>` + `<a-flex>` 实现单行布局，
 * 不依赖任何自定义 class。
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
  <!--
    单行设置项：24 栅格分四段。
    - label: span 5（标签 + 描述，单行截断）
    - control: span 11（控件，自动收缩）
    - value tags: span 6（当前值/默认值/已自定义）
    - reset: span 2（重置按钮）
  -->
  <a-row :gutter="12" align="middle" wrap="{false}">
    <!-- 标签（含描述） -->
    <a-col :span="5" style="min-width: 0">
      <a-flex align="baseline" :gap="6" style="min-width: 0">
        <strong style="white-space: nowrap; flex: 0 0 auto">
          {{ snap.label }}
        </strong>
        <a-typography-text
          v-if="snap.description"
          type="secondary"
          style="
            font-size: 12px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            min-width: 0;
          "
          :title="snap.description"
        >
          · {{ snap.description }}
        </a-typography-text>
      </a-flex>
    </a-col>

    <!-- 控件 -->
    <a-col :span="11" style="min-width: 0; overflow: hidden">
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
          选项文字 + tooltip 描述。
        -->
        <a-flex
          :gap="4"
          align="center"
          style="overflow-x: auto; padding: 2px 0"
        >
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
        </a-flex>
      </template>
    </a-col>

    <!-- 当前值/默认值 -->
    <a-col :span="6">
      <a-flex :gap="4" align="center" wrap>
        <a-tag color="blue" size="small">当前：{{ snap.display }}</a-tag>
        <a-tag size="small">默认：{{ snap.defaultDisplay }}</a-tag>
        <a-tag v-if="!snap.isDefault" color="orange" size="small">
          已自定义
        </a-tag>
      </a-flex>
    </a-col>

    <!-- 重置按钮 -->
    <a-col :span="2">
      <a-button
        size="small"
        type="text"
        :disabled="snap.isDefault"
        @click="emit('reset', snap)"
      >
        <template #icon>
          <ReloadOutlined />
        </template>
      </a-button>
    </a-col>
  </a-row>
</template>
