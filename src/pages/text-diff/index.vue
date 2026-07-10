<script setup lang="ts">
import { computed, ref } from "vue";

import { DeleteOutlined } from "@ant-design/icons-vue";

import { showInfo } from "../../composables/useMessage";
import { computeLineDiff } from "../../tools/diff/textDiff";

const leftText = ref("");
const rightText = ref("");
const ignoreWhitespace = ref<boolean>(false);

const result = computed(() =>
  computeLineDiff(leftText.value, rightText.value, {
    ignoreWhitespace: ignoreWhitespace.value,
  }),
);

function getRowStyle(type: string): Record<string, string> {
  switch (type) {
    case "added":
      return {
        backgroundColor: "rgba(82, 196, 26, 0.15)",
        borderLeft: "3px solid #52c41a",
      };
    case "removed":
      return {
        backgroundColor: "rgba(255, 77, 79, 0.15)",
        borderLeft: "3px solid #ff4d4f",
      };
    default:
      return { borderLeft: "3px solid transparent" };
  }
}

function handleClear() {
  leftText.value = "";
  rightText.value = "";
  showInfo("已清空");
}

const panelBaseStyle = {
  flex: 1,
  minWidth: 0,
  border: "1px solid var(--app-border)",
  borderRadius: "4px",
  backgroundColor: "var(--app-surface)",
  display: "flex",
  flexDirection: "column" as const,
};

const panelHeaderStyle = {
  borderBottom: "1px solid var(--app-border)",
  color: "var(--app-text-muted)",
  padding: "4px 8px",
  fontSize: "12px",
};
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
        <span style="font-weight: 500">文本 Diff</span>

        <a-tag color="green" size="small"> +{{ result.addedCount }} </a-tag>
        <a-tag color="red" size="small"> -{{ result.removedCount }} </a-tag>
        <a-tag color="default" size="small"> ={{ result.equalCount }} </a-tag>

        <a-checkbox v-model:checked="ignoreWhitespace">忽略空白</a-checkbox>

        <div style="flex: 1 1 auto" />

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

    <!-- 输入区：左右两个 textarea -->
    <a-flex :gap="8" style="flex: 0 0 auto; height: 200px; min-height: 200px">
      <div :style="panelBaseStyle">
        <div :style="panelHeaderStyle">原文</div>
        <textarea
          v-model="leftText"
          class="app-textarea"
          placeholder="粘贴原始文本"
          style="flex: 1; border: none; border-radius: 0 0 4px 4px"
        />
      </div>
      <div :style="panelBaseStyle">
        <div :style="panelHeaderStyle">新文</div>
        <textarea
          v-model="rightText"
          class="app-textarea"
          placeholder="粘贴新文本"
          style="flex: 1; border: none; border-radius: 0 0 4px 4px"
        />
      </div>
    </a-flex>

    <!-- 结果区 -->
    <div
      style="
        flex: 1 1 auto;
        min-height: 0;
        border: 1px solid var(--app-border);
        border-radius: 4px;
        background-color: var(--app-surface);
        overflow: auto;
        display: flex;
        flex-direction: column;
      "
    >
      <div
        style="
          flex: 0 0 auto;
          border-bottom: 1px solid var(--app-border);
          color: var(--app-text-muted);
          padding: 4px 8px;
          font-size: 12px;
        "
      >
        差异结果（共 {{ result.lines.length }} 行）
      </div>

      <div
        v-if="result.lines.length === 0"
        style="
          flex: 1 1 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--app-text-muted);
          font-size: 12px;
        "
      >
        <a-empty
          description="在左右两侧输入文本后，结果会实时显示。"
          :image="undefined"
        >
          <template #image>
            <span />
          </template>
        </a-empty>
      </div>

      <div
        v-else
        style="
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 12px;
        "
      >
        <div
          v-for="(line, idx) in result.lines"
          :key="idx"
          :style="{
            display: 'flex',
            ...getRowStyle(line.type),
            padding: '2px 8px',
            whiteSpace: 'pre',
          }"
        >
          <span
            style="
              width: 44px;
              color: var(--app-text-muted);
              user-select: none;
              text-align: right;
              padding-right: 6px;
              font-size: 12px;
            "
          >
            {{ line.oldLineNo ?? "" }}
          </span>
          <span
            style="
              width: 44px;
              color: var(--app-text-muted);
              user-select: none;
              text-align: right;
              padding-right: 6px;
              font-size: 12px;
            "
          >
            {{ line.newLineNo ?? "" }}
          </span>
          <span
            style="width: 16px; color: var(--app-text-muted); user-select: none"
          >
            {{
              line.type === "added" ? "+" : line.type === "removed" ? "-" : " "
            }}
          </span>
          <span style="flex: 1; word-break: break-all">{{ line.text }}</span>
        </div>
      </div>
    </div>
  </a-flex>
</template>
