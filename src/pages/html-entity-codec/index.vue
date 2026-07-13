<script setup lang="ts">
import { ref } from "vue";

import PanelCard from "../../components/PanelCard.vue";
import SplitPanel from "../../components/SplitPanel.vue";
import { showError, showInfo, showSuccess } from "../../composables/useMessage";
import {
  decodeHtmlEntities,
  encodeHtmlEntities,
} from "../../tools/html-entity/htmlEntityCodec";

const input = ref("");
const output = ref("");

function handleEncode() {
  try {
    output.value = encodeHtmlEntities(input.value);
    showSuccess("已编码为 HTML 实体");
  } catch {
    showError("编码失败，请检查输入内容");
  }
}

function handleDecode() {
  try {
    output.value = decodeHtmlEntities(input.value);
    showSuccess("已从 HTML 实体解码");
  } catch {
    showError("解码失败，请检查输入");
  }
}

function handleSwap() {
  input.value = output.value;
  output.value = "";
  showSuccess("已交换输入和输出");
}

async function handleCopyOutput() {
  await navigator.clipboard.writeText(output.value);
  showInfo("输出已复制");
}

function handleClear() {
  input.value = "";
  output.value = "";
  showInfo("已清空");
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
        <strong>HTML 实体编解码</strong>

        <a-flex :flex="'1 1 auto'" />

        <a-button size="small" type="primary" @click="handleEncode">
          编码
        </a-button>

        <a-button size="small" type="default" @click="handleDecode">
          解码
        </a-button>

        <a-button size="small" type="dashed" @click="handleSwap">交换</a-button>

        <a-button size="small" type="primary" @click="handleCopyOutput">
          复制输出
        </a-button>

        <a-button size="small" type="default" @click="handleClear"
          >清空</a-button
        >
      </a-flex>
    </a-card>

    <SplitPanel style="flex: 1 1 auto">
      <template #top>
        <PanelCard icon="FileTextOutlined" title="输入文本">
          <a-textarea
            v-model:value="input"
            :allow-clear="false"
            placeholder="输入需要编码的文本（如 <p>hello & 'world'</p>），或粘贴 HTML 实体字符串进行解码"
            style="flex: 1 1 auto; min-height: 0"
          />
        </PanelCard>
      </template>

      <template #bottom>
        <PanelCard icon="RightOutlined" title="输出结果">
          <a-textarea
            :value="output"
            readonly
            :allow-clear="false"
            placeholder="编码或解码结果将显示在这里"
            style="flex: 1 1 auto; min-height: 0"
          />
        </PanelCard>
      </template>
    </SplitPanel>
  </a-flex>
</template>
