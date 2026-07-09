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
</script>

<template>
  <div
    class="d-flex flex-column ga-2 h-100"
    style="min-height: 0; overflow: hidden"
  >
    <header
      class="d-flex align-center ga-1 px-2 py-1"
      style="
        flex: 0 0 auto;
        gap: 4px;
        border: 1px solid var(--app-border);
        border-radius: 4px;
        background-color: var(--app-surface);
      "
    >
      <span class="text-body-2 font-weight-medium">UUID 生成器</span>

      <a-tag color="cyan" size="small">{{ uuids.length }} 个</a-tag>

      <span style="flex: 1 1 auto" />

      <a-button
        :disabled="uuids.length === 0"
        size="small"
        type="primary"
        ghost
        @click="handleCopyAll"
      >
        <template #icon>
          <CopyOutlined />
        </template>
        复制全部
      </a-button>

      <a-button
        :disabled="uuids.length === 0"
        size="small"
        type="default"
        ghost
        @click="handleClear"
      >
        <template #icon>
          <DeleteOutlined />
        </template>
        清空
      </a-button>
    </header>

    <!-- 控件区 -->
    <section
      class="d-flex flex-column ga-2 px-3 py-2"
      style="
        flex: 0 0 auto;
        border: 1px solid var(--app-border);
        border-radius: 4px;
        background-color: var(--app-surface);
      "
    >
      <div class="d-flex align-center ga-2 flex-wrap">
        <span class="text-caption" style="min-width: 60px">版本</span>
        <a-select
          v-model:value="version"
          size="small"
          style="width: 220px"
          :options="versionOptions"
        />
      </div>
      <div class="d-flex align-center ga-2 flex-wrap">
        <span class="text-caption" style="min-width: 60px">数量</span>
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
        <span style="flex: 1 1 auto" />
        <a-button size="small" type="primary" ghost @click="handleGenerate">
          <template #icon>
            <ReloadOutlined />
          </template>
          生成
        </a-button>
      </div>
    </section>

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

      <section
        v-else
        class="d-flex flex-column ga-1"
        style="
          border: 1px solid var(--app-border);
          border-radius: 4px;
          background-color: var(--app-surface);
          padding: 8px;
        "
      >
        <textarea
          :value="preview"
          class="app-textarea"
          readonly
          style="min-height: 80px; max-height: 30vh"
        />
        <div
          class="d-flex flex-column ga-1"
          style="max-height: 35vh; overflow: auto"
        >
          <div
            v-for="(id, idx) in uuids"
            :key="idx"
            class="d-flex align-center ga-2 px-2 py-1"
            style="
              border: 1px solid var(--app-border);
              border-radius: 4px;
              background-color: var(--app-surface);
            "
          >
            <a-tag color="blue" size="small">#{{ idx + 1 }}</a-tag>
            <code class="text-body-2" style="flex: 1; word-break: break-all">
              {{ id }}
            </code>
            <a-button size="small" type="text" @click="handleCopyOne(id)">
              <template #icon>
                <CopyOutlined />
              </template>
            </a-button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
