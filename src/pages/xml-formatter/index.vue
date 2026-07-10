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

const input = ref("");

const validation = computed(() => validateXml(input.value));
const stats = computed(() => getXmlTextStats(input.value));
const parsedDocument = computed(() =>
  validation.value.valid ? parseXmlToTree(input.value) : undefined,
);

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
  await navigator.clipboard.writeText(input.value);
  showInfo("XML 已复制");
}

function handleClear() {
  input.value = "";
  showInfo("已清空输入");
}
</script>

<template>
  <a-flex
    vertical
    :gap="8"
    style="height: 100%; padding: 8px; box-sizing: border-box"
  >
    <a-card size="small" :body-style="{ padding: '4px 12px' }">
      <a-flex align="center" :gap="8" wrap>
        <strong>XML 格式化</strong>

        <a-tag
          :color="
            validation.valid ? 'green' : validation.empty ? 'default' : 'red'
          "
          size="small"
        >
          {{
            validation.valid ? "合法" : validation.empty ? "等待输入" : "错误"
          }}
        </a-tag>

        <a-tag color="cyan" size="small">{{ stats.bytes }} B</a-tag>

        <a-tag color="cyan" size="small">{{ stats.lines }} 行</a-tag>

        <a-flex :flex="'1 1 auto'" />

        <a-button size="small" type="primary" @click="handleFormat">
          <template #icon>
            <CheckCircleOutlined />
          </template>
          格式化
        </a-button>

        <a-button size="small" type="default" @click="handleMinify">
          <template #icon>
            <CompressOutlined />
          </template>
          压缩
        </a-button>

        <a-button size="small" type="primary" @click="handleCopy">
          <template #icon>
            <CopyOutlined />
          </template>
          复制
        </a-button>

        <a-button size="small" type="default" @click="handleClear">
          <template #icon>
            <DeleteOutlined />
          </template>
          清空
        </a-button>
      </a-flex>
    </a-card>

    <SplitPanel style="flex: 1 1 auto">
      <template #top>
        <InputPanel v-model="input" />
      </template>

      <template #bottom>
        <XmlTreePanel :value="parsedDocument" />
      </template>
    </SplitPanel>
  </a-flex>
</template>
