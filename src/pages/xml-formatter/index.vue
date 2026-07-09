<script setup lang="ts">
import { computed, ref } from "vue";

import {
  CheckCircleOutlined,
  CompressOutlined,
  CopyOutlined,
  DeleteOutlined,
} from "@ant-design/icons-vue";

import InputPanel from "./InputPanel.vue";
import XmlTreePanel from "./XmlTreePanel.vue";
import SplitPanel from "../../components/SplitPanel.vue";
import { showInfo, showWarning } from "../../composables/useMessage";
import {
  formatXml,
  getXmlTextStats,
  minifyXml,
  parseXmlToTree,
  validateXml,
} from "../../tools/xml/xmlFormatter";
import { PANEL_KEYS } from "../../utils/storage";

const input = ref("");

const validation = computed(() => validateXml(input.value));
const stats = computed(() => getXmlTextStats(input.value));
const parsedDocument = computed(() =>
  validation.value.valid ? parseXmlToTree(input.value) : undefined,
);

const hasInput = computed(() => input.value.trim().length > 0);

function handleFormat() {
  const result = formatXml(input.value);
  if (result.success) {
    input.value = result.output;
    showInfo("已在输入框内格式化 XML");
    return;
  }
  showWarning("XML 格式错误，请先修正输入");
}

function handleMinify() {
  const result = minifyXml(input.value);
  if (result.success) {
    input.value = result.output;
    showInfo("已在输入框内压缩 XML");
    return;
  }
  showWarning("XML 格式错误，请先修正输入");
}

async function handleCopy() {
  if (!hasInput.value) return;
  await navigator.clipboard.writeText(input.value);
  showInfo("XML 已复制");
}

function handleClear() {
  input.value = "";
  showInfo("已清空输入");
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
      <span class="text-body-2 font-weight-medium">XML 格式化</span>

      <a-tag
        :color="
          validation.valid ? 'green' : validation.empty ? 'default' : 'red'
        "
        size="small"
      >
        {{ validation.valid ? "合法" : validation.empty ? "等待输入" : "错误" }}
      </a-tag>

      <a-tag color="cyan" size="small">{{ stats.bytes }} B</a-tag>

      <a-tag color="cyan" size="small">{{ stats.lines }} 行</a-tag>

      <span style="flex: 1 1 auto" />

      <a-button
        :disabled="!hasInput"
        size="small"
        type="primary"
        ghost
        @click="handleFormat"
      >
        <template #icon>
          <CheckCircleOutlined />
        </template>
        格式化
      </a-button>

      <a-button
        :disabled="!hasInput"
        size="small"
        type="default"
        ghost
        @click="handleMinify"
      >
        <template #icon>
          <CompressOutlined />
        </template>
        压缩
      </a-button>

      <a-button
        :disabled="!hasInput"
        size="small"
        type="primary"
        ghost
        @click="handleCopy"
      >
        <template #icon>
          <CopyOutlined />
        </template>
        复制
      </a-button>

      <a-button
        :disabled="!hasInput"
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

    <SplitPanel :panel-key="PANEL_KEYS.xmlFormatter">
      <template #left>
        <InputPanel v-model="input" />
      </template>

      <template #right>
        <XmlTreePanel :value="parsedDocument" />
      </template>
    </SplitPanel>
  </div>
</template>
