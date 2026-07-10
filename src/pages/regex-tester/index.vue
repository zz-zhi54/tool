<script setup lang="ts">
/**
 * 正则表达式测试器（独立页）。
 *
 * 上下结构：控件行 → 测试字符串输入 → 匹配结果多列网格。
 *   - 控件行：标题 + /pattern/ + flags + 状态 tag + 复制/清空按钮
 *   - 测试字符串：满宽 textarea（高度 180px，可滚）
 *   - 匹配结果：多列卡片网格（每卡 280px），自动换行，溢出可上下滚动
 *
 * flags 默认值持久化到 localStorage（REGEX_FLAGS_KEY），刷新页面保留。
 */
import { computed, ref, watch } from "vue";

import { CopyOutlined, DeleteOutlined } from "@ant-design/icons-vue";

import { showInfo } from "../../composables/useMessage";
import { testRegex, validateRegex } from "../../tools/regex/regexTester";
import {
  load,
  save,
  REGEX_FLAGS_KEY,
  type RegexFlag,
  type RegexFlagsPreference,
} from "../../utils/storage";

/* ── 状态 ───────────────────────────────────────────── */

const pattern = ref("");
const input = ref("");
const flags = ref<RegexFlagsPreference>(
  load(REGEX_FLAGS_KEY, { g: true, i: false, m: false, s: false, u: false }),
);

const flagOptions: Array<{ key: RegexFlag; label: string; title: string }> = [
  { key: "g", label: "g", title: "全局匹配" },
  { key: "i", label: "i", title: "忽略大小写" },
  { key: "m", label: "m", title: "多行模式" },
  { key: "s", label: "s", title: "dotAll 模式" },
  { key: "u", label: "u", title: "Unicode 模式" },
];

const activeFlags = computed(() =>
  flagOptions
    .filter((opt) => flags.value[opt.key])
    .map((opt) => opt.key)
    .join(""),
);

watch(
  flags,
  (value) => {
    save(REGEX_FLAGS_KEY, { ...value });
  },
  { deep: true },
);

const validation = computed(() =>
  validateRegex(pattern.value, activeFlags.value),
);

const result = computed(() => {
  if (!pattern.value.trim()) {
    return {
      success: true,
      matches: [] as Array<{ text: string; index: number; groups: string[] }>,
    };
  }
  return testRegex(pattern.value, activeFlags.value, input.value);
});

const matchCount = computed(() => result.value.matches.length);
const hasPattern = computed(() => pattern.value.trim().length > 0);

/* ── 操作 ───────────────────────────────────────────── */

async function handleCopyMatches() {
  if (matchCount.value === 0) return;
  const text = result.value.matches
    .map(
      (m, i) =>
        `匹配 ${i + 1}: "${m.text}" (位置: ${m.index})${m.groups.length ? `  捕获组: [${m.groups.map((g) => `"${g}"`).join(", ")}]` : ""}`,
    )
    .join("\n");
  await navigator.clipboard.writeText(text);
  showInfo("匹配结果已复制");
}

function handleClear() {
  pattern.value = "";
  input.value = "";
  showInfo("已清空");
}

/* ── 布局常量 ───────────────────────────────────────── */

// 整页根容器：纵向两段（输入 + 结果），各占 50%
const rootCol = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
  height: "100%",
  padding: "8px",
  boxSizing: "border-box" as const,
  minHeight: 0,
};

// 测试字符串区：固定 180px
const inputSection = {
  flex: "0 0 auto",
  minHeight: 0,
  display: "flex",
  flexDirection: "column" as const,
  gap: "4px",
};

// 匹配结果区：填满剩余空间
const resultSection = {
  flex: "1 1 auto",
  minHeight: 0,
  display: "flex",
  flexDirection: "column" as const,
  gap: "4px",
};

// 滚动列表容器：多列网格，超出宽度自动换行，整体仍可上下滚动
const scrollListStyle = {
  flex: "1 1 auto",
  minHeight: 0,
  overflow: "auto" as const,
  display: "flex",
  flexWrap: "wrap" as const,
  alignContent: "flex-start",
  gap: "8px",
  padding: "2px",
};

// 匹配卡片：固定宽度，超出容器自动换行；max-width 100% 避免窄窗溢出
const matchCardWidth = {
  flex: "0 0 280px",
  maxWidth: "100%",
};

// 匹配卡片 body 样式
const matchCardBody = { padding: "8px 12px" };

// 控件行：flex 横向，gap 4px，超出换行
const toolbarStyle = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  flexWrap: "wrap" as const,
};
</script>

<template>
  <div :style="rootCol">
    <!-- 控件行：pattern + flags + 状态 + 按钮 -->
    <a-card size="small" :body-style="{ padding: '6px 12px' }">
      <div :style="toolbarStyle">
        <a-typography-text strong>正则测试</a-typography-text>

        <a-typography-text type="secondary">/</a-typography-text>
        <a-input
          v-model:value="pattern"
          placeholder="输入正则表达式"
          size="small"
          style="flex: 1 1 auto; min-width: 120px"
        />
        <a-typography-text type="secondary">/</a-typography-text>

        <a-checkbox
          v-for="opt in flagOptions"
          :key="opt.key"
          :checked="flags[opt.key]"
          :title="opt.title"
          @update:checked="
            (v: boolean | string | number) => (flags[opt.key] = Boolean(v))
          "
        >
          {{ opt.label }}
        </a-checkbox>

        <a-tag
          :color="
            validation.valid
              ? 'green'
              : validation.empty
                ? 'default'
                : 'red'
          "
          size="small"
        >
          {{
            validation.valid
              ? matchCount > 0
                ? `${matchCount} 个匹配`
                : "语法正确"
              : validation.empty
                ? "等待输入"
                : "语法错误"
          }}
        </a-tag>

        <span style="flex: 1 1 auto" />

        <a-button
          size="small"
          type="primary"
          ghost
          :disabled="matchCount === 0"
          @click="handleCopyMatches"
        >
          <template #icon>
            <CopyOutlined />
          </template>
          复制结果
        </a-button>

        <a-button
          size="small"
          type="default"
          ghost
          :disabled="!hasPattern && !input"
          @click="handleClear"
        >
          <template #icon>
            <DeleteOutlined />
          </template>
          清空
        </a-button>
      </div>
    </a-card>

    <!-- 语法错误提示 -->
    <a-alert
      v-if="
        !validation.valid && !validation.empty && validation.errorMessage
      "
      type="error"
      :message="validation.errorMessage"
      show-icon
      style="margin-bottom: 0"
    />

    <!-- 测试字符串输入区：固定 180px -->
    <div :style="inputSection">
      <a-typography-text type="secondary" style="font-size: 12px">
        测试字符串
      </a-typography-text>
      <a-textarea
        v-model:value="input"
        placeholder="输入需要测试的文本"
        :auto-size="false"
        style="height: 180px; min-height: 180px"
      />
    </div>

    <!-- 匹配结果区：填满剩余空间 -->
    <div :style="resultSection">
      <div class="d-flex align-center" style="gap: 6px">
        <a-typography-text type="secondary" style="font-size: 12px">
          匹配结果
        </a-typography-text>
        <a-tag
          v-if="result.matches.length > 0"
          color="blue"
          size="small"
        >
          共 {{ matchCount }} 个
        </a-tag>
      </div>

      <div v-if="result.matches.length > 0" :style="scrollListStyle">
        <a-card
          v-for="(match, idx) in result.matches"
          :key="idx"
          size="small"
          :body-style="matchCardBody"
          :style="matchCardWidth"
        >
          <div class="d-flex align-center" style="gap: 6px; margin-bottom: 6px">
            <a-tag color="blue" size="small">#{{ idx + 1 }}</a-tag>
            <a-typography-text type="secondary">
              位置 {{ match.index }}–{{
                match.index + match.text.length - 1
              }}
            </a-typography-text>
          </div>
          <a-descriptions
            size="small"
            :column="1"
            :label-style="{ width: '60px', textAlign: 'right' }"
          >
            <a-descriptions-item label="匹配">
              <code style="word-break: break-all; white-space: pre-wrap">{{
                match.text
              }}</code>
            </a-descriptions-item>
            <a-descriptions-item
              v-for="(group, gIdx) in match.groups"
              :key="gIdx"
              :label="`组 ${gIdx + 1}`"
            >
              <code style="word-break: break-all; white-space: pre-wrap">{{
                group ?? "(未匹配)"
              }}</code>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </div>

      <div
        v-else
        style="
          flex: 1 1 auto;
          min-height: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        "
      >
        <a-empty
          v-if="hasPattern && input"
          description="没有找到匹配项。"
          :image="undefined"
        >
          <template #image>
            <span />
          </template>
        </a-empty>

        <a-empty
          v-else
          description="输入正则表达式和测试字符串，结果会实时显示。"
          :image="undefined"
        >
          <template #image>
            <span />
          </template>
        </a-empty>
      </div>
    </div>
  </div>
</template>