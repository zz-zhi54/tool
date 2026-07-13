<script setup lang="ts">
import { computed, ref } from "vue";

import { DeleteOutlined, FileTextOutlined } from "@ant-design/icons-vue";

import PanelCard from "../../components/PanelCard.vue";
import { showError, showInfo } from "../../composables/useMessage";
import { computeLineDiff } from "../../tools/diff/textDiff";

const leftText = ref("");
const rightText = ref("");
const ignoreWhitespace = ref<boolean>(false);

const result = computed(() =>
  computeLineDiff(leftText.value, rightText.value, {
    ignoreWhitespace: ignoreWhitespace.value,
  }),
);

const hasInput = computed(
  () => leftText.value.trim().length > 0 || rightText.value.trim().length > 0,
);

/**
 * 选择本地文本文件并读入对应 textarea。
 *
 * antdv <a-upload :before-upload> 在 beforeUpload 返回 false 时阻断上传，
 * 我们借这一时机用 FileReader.readAsText 读取文件内容塞进 ref。
 */
async function handleFilePick(
  target: "left" | "right",
  file: File,
): Promise<boolean> {
  try {
    const text = await file.text();
    if (target === "left") leftText.value = text;
    else rightText.value = text;
    showInfo(`已读取 ${file.name}（${text.length} 字符）`);
  } catch (err) {
    showError(
      `读取文件失败：${err instanceof Error ? err.message : String(err)}`,
    );
  }
  return false;
}

function handleClear() {
  leftText.value = "";
  rightText.value = "";
  showInfo("已清空");
}

/** 差异行类型 → antdv tag color。 */
const ROW_TAG_COLOR: Record<string, string> = {
  added: "green",
  removed: "red",
  equal: "default",
};

const ROW_SIGN: Record<string, string> = {
  added: "+",
  removed: "-",
  equal: " ",
};

const MONO_STYLE =
  "font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px";
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
        <strong>文本 Diff</strong>

        <a-tag color="green" size="small"> +{{ result.addedCount }} </a-tag>
        <a-tag color="red" size="small"> -{{ result.removedCount }} </a-tag>
        <a-tag size="default"> ={{ result.equalCount }} </a-tag>

        <a-checkbox v-model:checked="ignoreWhitespace">忽略空白</a-checkbox>

        <a-flex :flex="'1 1 auto'" />

        <a-button
          size="small"
          type="default"
          :disabled="!hasInput"
          @click="handleClear"
        >
          <template #icon>
            <DeleteOutlined />
          </template>
          清空
        </a-button>
      </a-flex>
    </a-card>

    <!-- 输入区：左右两个 PanelCard -->
    <a-row :gutter="8" style="flex: 0 0 auto">
      <a-col :span="12">
        <PanelCard icon="FileTextOutlined" title="原文" overflow="hidden">
          <template #actions>
            <a-upload
              :before-upload="(file: File) => handleFilePick('left', file)"
              :show-upload-list="false"
              accept="text/*,.json,.xml,.yaml,.yml,.toml,.md,.log,.csv,.tsv,.ini,.conf,.env,.sh,.js,.ts,.jsx,.tsx,.vue,.py,.rb,.go,.rs,.java,.kt,.swift,.c,.cpp,.h,.hpp,.cs,.php,.sql,.html,.css,.scss,.sass,.less,.txt"
            >
              <a-button size="small" type="default">
                <template #icon>
                  <FileTextOutlined />
                </template>
                选择文件
              </a-button>
            </a-upload>
          </template>
          <a-textarea
            v-model:value="leftText"
            :allow-clear="false"
            placeholder="粘贴原始文本，或点击右上角「选择文件」"
            style="height: 200px; min-height: 200px"
          />
        </PanelCard>
      </a-col>
      <a-col :span="12">
        <PanelCard icon="FileTextOutlined" title="新文" overflow="hidden">
          <template #actions>
            <a-upload
              :before-upload="(file: File) => handleFilePick('right', file)"
              :show-upload-list="false"
              accept="text/*,.json,.xml,.yaml,.yml,.toml,.md,.log,.csv,.tsv,.ini,.conf,.env,.sh,.js,.ts,.jsx,.tsx,.vue,.py,.rb,.go,.rs,.java,.kt,.swift,.c,.cpp,.h,.hpp,.cs,.php,.sql,.html,.css,.scss,.sass,.less,.txt"
            >
              <a-button size="small" type="default">
                <template #icon>
                  <FileTextOutlined />
                </template>
                选择文件
              </a-button>
            </a-upload>
          </template>
          <a-textarea
            v-model:value="rightText"
            :allow-clear="false"
            placeholder="粘贴新文本，或点击右上角「选择文件」"
            style="height: 200px; min-height: 200px"
          />
        </PanelCard>
      </a-col>
    </a-row>

    <!-- 结果区 -->
    <PanelCard icon="AlignLeftOutlined" title="差异结果" overflow="auto">
      <a-flex vertical :gap="0">
        <a-typography-text type="secondary">
          共 {{ result.lines.length }} 行
        </a-typography-text>

        <a-flex
          v-if="result.lines.length === 0"
          align="center"
          justify="center"
          style="flex: 1 1 auto; min-height: 100px"
        >
          <a-empty
            description="在左右两侧输入文本后，结果会实时显示。"
            :image="undefined"
          >
            <template #image>
              <span />
            </template>
          </a-empty>
        </a-flex>

        <a-flex v-else vertical :gap="2" :style="MONO_STYLE">
          <a-flex
            v-for="(line, idx) in result.lines"
            :key="idx"
            align="center"
            :gap="4"
            :style="
              line.type === 'added'
                ? 'background-color: rgba(82, 196, 26, 0.15)'
                : line.type === 'removed'
                  ? 'background-color: rgba(255, 77, 79, 0.15)'
                  : ''
            "
          >
            <a-typography-text
              type="secondary"
              style="min-width: 32px; text-align: right; user-select: none"
            >
              {{ line.oldLineNo ?? "" }}
            </a-typography-text>
            <a-typography-text
              type="secondary"
              style="min-width: 32px; text-align: right; user-select: none"
            >
              {{ line.newLineNo ?? "" }}
            </a-typography-text>
            <a-tag
              :color="ROW_TAG_COLOR[line.type]"
              size="small"
              style="min-width: 22px; text-align: center; margin: 0"
            >
              {{ ROW_SIGN[line.type] }}
            </a-tag>
            <span
              style="flex: 1 1 auto; word-break: break-all; white-space: pre"
            >
              {{ line.text }}
            </span>
          </a-flex>
        </a-flex>
      </a-flex>
    </PanelCard>
  </a-flex>
</template>
