<script setup lang="ts">
import { computed, ref } from "vue";

import {
  CopyOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons-vue";

import { showInfo, showSuccess } from "../../composables/useMessage";
import {
  generateUuidBatch,
  type UuidOptions,
  type UuidVersion,
} from "../../tools/uuid/uuidGenerator";

const version = ref<UuidVersion>("v4");
const count = ref<number>(10);
const uppercase = ref<boolean>(false);
const withHyphens = ref<boolean>(true);

const uuids = ref<string[]>([]);

const versionOptions: { value: UuidVersion; label: string }[] = [
  { value: "v1", label: "v1（基于时间与 MAC）" },
  { value: "v4", label: "v4（随机）" },
  { value: "v7", label: "v7（基于时间，可排序）" },
];

const preview = computed(() => {
  if (uuids.value.length === 0) return "";
  return uuids.value.join("\n");
});

function handleGenerate() {
  const opts: UuidOptions = {
    count: count.value,
    uppercase: uppercase.value,
    withHyphens: withHyphens.value,
  };
  const result = generateUuidBatch(version.value, opts);
  uuids.value = result.ids;
  showSuccess(`已生成 ${result.ids.length} 个 UUID`);
}

function handleClear() {
  uuids.value = [];
  showInfo("已清空");
}

async function handleCopyOne(id: string) {
  await navigator.clipboard.writeText(id);
  showInfo("已复制");
}

async function handleCopyAll() {
  if (uuids.value.length === 0) return;
  await navigator.clipboard.writeText(uuids.value.join("\n"));
  showSuccess("已复制全部 UUID");
}

const cardStyle = {
  border: "1px solid var(--app-border)",
  borderRadius: "4px",
  backgroundColor: "var(--app-surface)",
} as const;

const uuidRowStyle = {
  border: "1px solid var(--app-border)",
  borderRadius: "4px",
  backgroundColor: "var(--app-surface)",
  padding: "4px 8px",
} as const;
</script>

<template>
  <a-flex
    vertical
    :gap="8"
    style="
      height: 100%;
      min-height: 0;
      overflow: hidden;
      padding: 8px;
      box-sizing: border-box;
    "
  >
    <a-card size="small" :body-style="{ padding: '4px 12px' }">
      <a-flex align="center" :gap="4" wrap>
        <span style="font-weight: 500">UUID 生成器</span>

        <a-tag color="cyan" size="small">{{ uuids.length }} 个</a-tag>

        <div style="flex: 1 1 auto" />

        <a-button
          size="small"
          type="primary"
          @click="handleCopyAll"
        >
          <template #icon>
            <CopyOutlined />
          </template>
          复制全部
        </a-button>

        <a-button
          size="small"
          type="default"
          @click="handleClear"
        >
          <template #icon>
            <DeleteOutlined />
          </template>
          清空
        </a-button>
      </a-flex>
    </a-card>

    <!-- 控件区 -->
    <a-card
      size="small"
      :body-style="{ padding: '8px 12px' }"
      :style="cardStyle"
    >
      <a-flex vertical :gap="8">
        <a-flex align="center" :gap="8" wrap>
          <span style="min-width: 60px; font-size: 12px">版本</span>
          <a-select
            v-model:value="version"
            size="small"
            style="width: 220px"
            :options="versionOptions"
          />
        </a-flex>
        <a-flex align="center" :gap="8" wrap>
          <span style="min-width: 60px; font-size: 12px">数量</span>
          <a-input-number
            v-model:value="count"
            size="small"
            :min="1"
            :max="1000"
            :step="1"
            style="width: 140px"
          />
          <a-checkbox v-model:checked="uppercase">大写</a-checkbox>
          <a-checkbox v-model:checked="withHyphens">带连字符</a-checkbox>
          <div style="flex: 1 1 auto" />
          <a-button size="small" type="primary" @click="handleGenerate">
            <template #icon>
              <ReloadOutlined />
            </template>
            生成
          </a-button>
        </a-flex>
      </a-flex>
    </a-card>

    <!-- 结果区 -->
    <div style="flex: 1 1 auto; min-height: 0; overflow: auto">
      <a-empty
        v-if="uuids.length === 0"
        description="选择版本与数量后点击「生成」查看 UUID 列表。"
        :image="undefined"
      >
        <template #image>
          <span />
        </template>
      </a-empty>

      <a-flex
        v-else
        vertical
        :gap="4"
        :style="{
          ...cardStyle,
          padding: '8px',
        }"
      >
        <textarea
          :value="preview"
          class="app-textarea"
          readonly
          style="min-height: 80px; max-height: 30vh"
        />
        <a-flex vertical :gap="4" style="max-height: 35vh; overflow: auto">
          <a-flex
            v-for="(id, idx) in uuids"
            :key="idx"
            align="center"
            :gap="8"
            :style="uuidRowStyle"
          >
            <a-tag color="blue" size="small">#{{ idx + 1 }}</a-tag>
            <code style="flex: 1; word-break: break-all; font-size: 14px">
              {{ id }}
            </code>
            <a-button size="small" type="text" @click="handleCopyOne(id)">
              <template #icon>
                <CopyOutlined />
              </template>
            </a-button>
          </a-flex>
        </a-flex>
      </a-flex>
    </div>
  </a-flex>
</template>
