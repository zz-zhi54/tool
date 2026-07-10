<script setup lang="ts">
import { computed, ref } from "vue";
import { parse } from "yaml";

import {
  CheckCircleOutlined,
  CompressOutlined,
  CopyOutlined,
  DeleteOutlined,
} from "@ant-design/icons-vue";

import InputPanel from "./InputPanel.vue";
import YamlTreePanel from "./YamlTreePanel.vue";
import SplitPanel from "../../components/SplitPanel.vue";
import { showInfo, showWarning } from "../../composables/useMessage";
import {
  formatYaml,
  getYamlTextStats,
  minifyYaml,
  validateYaml,
} from "../../tools/yaml/yamlFormatter";

const input = ref("");

const validation = computed(() => validateYaml(input.value));
const stats = computed(() => getYamlTextStats(input.value));
const parsedValue = computed<unknown | undefined>(() => {
  if (!validation.value.valid) {
    return undefined;
  }

  return parse(input.value.trim());
});

function handleFormat() {
  const result = formatYaml(input.value);

  if (result.success) {
    input.value = result.output;
    showInfo("已在输入框内格式化 YAML");
    return;
  }

  showWarning("YAML 格式错误，请先修正输入");
}

function handleMinify() {
  const result = minifyYaml(input.value);

  if (result.success) {
    input.value = result.output;
    showInfo("已在输入框内压缩 YAML");
    return;
  }

  showWarning("YAML 格式错误，请先修正输入");
}

async function handleCopy() {
  await navigator.clipboard.writeText(input.value);
  showInfo("YAML 已复制");
}

function handleClear() {
  input.value = "";
  showInfo("已清空输入");
}
</script>

<template>
  <a-flex
    vertical
    gap="small"
    style="height: 100%; padding: 8px; box-sizing: border-box"
  >
    <a-card size="small" :body-style="{ padding: '4px 12px' }">
      <a-flex align="center" gap="small" wrap>
        <span class="ant-typography">YAML 格式化</span>

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

        <div style="flex: 1 1 auto" />

        <a-button
          size="small"
          type="primary"
          @click="handleFormat"
        >
          <template #icon>
            <CheckCircleOutlined />
          </template>
          格式化
        </a-button>

        <a-button
          size="small"
          type="default"
          @click="handleMinify"
        >
          <template #icon>
            <CompressOutlined />
          </template>
          压缩
        </a-button>

        <a-button
          size="small"
          type="primary"
          @click="handleCopy"
        >
          <template #icon>
            <CopyOutlined />
          </template>
          复制
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

    <SplitPanel style="flex: 1 1 auto">
      <template #top>
        <InputPanel v-model="input" />
      </template>

      <template #bottom>
        <YamlTreePanel :value="parsedValue" />
      </template>
    </SplitPanel>
  </a-flex>
</template>
