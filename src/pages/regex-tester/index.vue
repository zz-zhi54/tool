<script setup lang="ts">
import { computed, ref, watch } from "vue";

import { CopyOutlined, DeleteOutlined } from "@ant-design/icons-vue";

import PanelCard from "../../components/PanelCard.vue";
import SplitPanel from "../../components/SplitPanel.vue";
import { showInfo } from "../../composables/useMessage";
import { testRegex, validateRegex } from "../../tools/regex/regexTester";
import { load, save, REGEX_FLAGS_KEY, PANEL_KEYS } from "../../utils/storage";
import type { RegexFlag, RegexFlagsPreference } from "../../utils/storage";

const pattern = ref("");
const testString = ref("");
const flags = ref<RegexFlagsPreference>(
  load(REGEX_FLAGS_KEY, { g: true, i: false, m: false, s: false, u: false }),
);

/** 可用的正则标志位 */
const flagOptions: Array<{ key: RegexFlag; label: string; title: string }> = [
  { key: "g", label: "g", title: "全局匹配" },
  { key: "i", label: "i", title: "忽略大小写" },
  { key: "m", label: "m", title: "多行模式" },
  { key: "s", label: "s", title: "dotAll 模式" },
  { key: "u", label: "u", title: "Unicode 模式" },
];

/**
 * 当前标志位字符串。
 */
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
    return { success: true, matches: [] };
  }

  return testRegex(pattern.value, activeFlags.value, testString.value);
});

const matchCount = computed(() => result.value.matches.length);

const hasPattern = computed(() => pattern.value.trim().length > 0);
const hasTestString = computed(() => testString.value.trim().length > 0);

/**
 * 高亮后的测试字符串 HTML。
 *
 * 将每个匹配区域用带背景色的 span 包裹，方便用户直观看到匹配位置。
 * 使用不同的背景色交替显示，区分相邻匹配。
 */
const highlightedHtml = computed(() => {
  if (!result.value.success || result.value.matches.length === 0) {
    return escapeHtml(testString.value);
  }

  const text = testString.value;
  const matches = result.value.matches;
  const parts: string[] = [];
  let lastEnd = 0;

  for (const match of matches) {
    if (match.index > lastEnd) {
      parts.push(escapeHtml(text.slice(lastEnd, match.index)));
    }

    parts.push(
      `<mark style="background:#bbdefb;border-radius:2px;padding:0 1px;color:inherit">${escapeHtml(match.text)}</mark>`,
    );
    lastEnd = match.index + match.text.length;
  }

  if (lastEnd < text.length) {
    parts.push(escapeHtml(text.slice(lastEnd)));
  }

  return parts.join("");
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br>")
    .replace(/ /g, "&nbsp;");
}

/**
 * 复制匹配结果。
 */
async function handleCopyResults() {
  if (matchCount.value === 0) {
    return;
  }

  const text = result.value.matches
    .map(
      (m, i) =>
        `匹配 ${i + 1}: "${m.text}" (位置: ${m.index})${m.groups.length ? `  捕获组: [${m.groups.map((g) => `"${g}"`).join(", ")}]` : ""}`,
    )
    .join("\n");

  await navigator.clipboard.writeText(text);
  showInfo("匹配结果已复制");
}

/**
 * 清空所有输入。
 */
function handleClear() {
  pattern.value = "";
  testString.value = "";
  showInfo("已清空");
}
</script>

<template>
  <div
    class="d-flex flex-column ga-2 h-100"
    style="min-height: 0; overflow: hidden"
  >
    <!-- 顶部工具栏 -->
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
      <span class="text-body-2 font-weight-medium">正则测试</span>

      <a-tag
        :color="
          validation.valid ? 'green' : validation.empty ? 'default' : 'red'
        "
        size="small"
      >
        {{
          validation.valid
            ? "语法正确"
            : validation.empty
              ? "等待输入"
              : "语法错误"
        }}
      </a-tag>

      <a-tag v-if="hasPattern && hasTestString" color="blue" size="small">
        {{ matchCount }} 个匹配
      </a-tag>

      <span style="flex: 1 1 auto" />

      <a-button
        size="small"
        type="primary"
        ghost
        :disabled="matchCount === 0"
        @click="handleCopyResults"
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
        :disabled="!hasPattern && !hasTestString"
        @click="handleClear"
      >
        <template #icon>
          <DeleteOutlined />
        </template>
        清空
      </a-button>
    </header>

    <!-- 正则输入行 -->
    <section
      class="d-flex align-center ga-2 px-3 py-2"
      style="
        flex: 0 0 auto;
        border: 1px solid var(--app-border);
        border-radius: 4px;
        background-color: var(--app-surface);
      "
    >
      <span class="text-body-2" style="color: var(--app-text-muted)">/</span>
      <a-input
        v-model:value="pattern"
        placeholder="输入正则表达式"
        size="small"
        style="flex: 1 1 auto"
      />
      <span class="text-body-2" style="color: var(--app-text-muted)">/</span>

      <!-- 标志位复选框 -->
      <div class="d-flex ga-1 ml-1" style="margin-left: 8px">
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
      </div>
    </section>

    <!-- 语法错误提示 -->
    <a-alert
      v-if="!validation.valid && !validation.empty && validation.errorMessage"
      type="error"
      :message="validation.errorMessage"
      show-icon
    />

    <!-- 工作区 -->
    <SplitPanel :panel-key="PANEL_KEYS.regexTester">
      <template #left>
        <PanelCard icon="FileTextOutlined" title="测试字符串">
          <textarea
            v-model="testString"
            class="app-textarea"
            placeholder="输入需要测试的文本"
          />
        </PanelCard>
      </template>

      <template #right>
        <PanelCard icon="SearchOutlined" overflow="auto" title="匹配结果">
          <!-- 高亮预览 -->
          <section
            v-if="hasTestString"
            class="text-body-2 pa-2"
            style="
              margin-bottom: 8px;
              border: 1px solid var(--app-border);
              border-radius: 4px;
              white-space: pre-wrap;
              word-break: break-all;
              line-height: 1.6;
              background-color: var(--app-surface);
            "
            v-html="highlightedHtml"
          />

          <!-- 匹配列表 -->
          <template v-if="result.matches.length > 0">
            <section
              v-for="(match, idx) in result.matches"
              :key="idx"
              class="py-1 px-2 mb-1"
              style="
                border: 1px solid var(--app-border);
                border-radius: 4px;
                background-color: var(--app-surface);
              "
            >
              <div class="d-flex align-center ga-1 mb-1">
                <a-tag color="blue" size="small">#{{ idx + 1 }}</a-tag>
                <span class="text-caption" style="color: var(--app-text-muted)">
                  位置 {{ match.index }}–{{
                    match.index + match.text.length - 1
                  }}
                </span>
              </div>

              <div class="text-body-2" style="word-break: break-all">
                <span class="text-caption" style="color: var(--app-text-muted)">
                  匹配：
                </span>
                <code class="ml-1">{{ match.text }}</code>
              </div>

              <div v-if="match.groups.length > 0" class="mt-1">
                <div
                  v-for="(group, gIdx) in match.groups"
                  :key="gIdx"
                  class="text-body-2"
                  style="word-break: break-all"
                >
                  <span
                    class="text-caption"
                    style="color: var(--app-text-muted)"
                  >
                    组 {{ gIdx + 1 }}：
                  </span>
                  <code class="ml-1">{{ group ?? "(未匹配)" }}</code>
                </div>
              </div>
            </section>
          </template>

          <!-- 无匹配时的提示 -->
          <a-empty
            v-else-if="hasPattern && hasTestString && result.success"
            description="没有找到匹配项。"
            :image="undefined"
          >
            <template #image>
              <span />
            </template>
          </a-empty>

          <a-empty
            v-else-if="!hasPattern"
            description="输入正则表达式和测试字符串，结果会实时显示。"
            :image="undefined"
          >
            <template #image>
              <span />
            </template>
          </a-empty>
        </PanelCard>
      </template>
    </SplitPanel>
  </div>
</template>
