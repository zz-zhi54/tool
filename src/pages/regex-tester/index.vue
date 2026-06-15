<script setup lang="ts">
import { computed, ref, watch } from "vue";

import PanelCard from "../../components/PanelCard.vue";
import SplitPanel from "../../components/SplitPanel.vue";
import { testRegex, validateRegex } from "../../tools/regex/regexTester";
import { load, save, REGEX_FLAGS_KEY, PANEL_KEYS } from "../../utils/storage";
import type { RegexFlag, RegexFlagsPreference } from "../../utils/storage";

const pattern = ref("");
const testString = ref("");
const flags = ref<RegexFlagsPreference>(
  load(REGEX_FLAGS_KEY, { g: true, i: false, m: false, s: false, u: false }),
);
const snackbar = ref(false);
const snackbarText = ref("");

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

/**
 * 正则语法校验。
 */
const validation = computed(() =>
  validateRegex(pattern.value, activeFlags.value),
);

/**
 * 实时匹配结果。
 *
 * pattern 或 testString 变化时自动重新匹配。
 */
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
    // 匹配之前的普通文本
    if (match.index > lastEnd) {
      parts.push(escapeHtml(text.slice(lastEnd, match.index)));
    }

    // 匹配文本，高亮显示
    parts.push(
      `<mark style="background:#bbdefb;border-radius:2px;padding:0 1px">${escapeHtml(match.text)}</mark>`,
    );
    lastEnd = match.index + match.text.length;
  }

  // 最后一段普通文本
  if (lastEnd < text.length) {
    parts.push(escapeHtml(text.slice(lastEnd)));
  }

  return parts.join("");
});

/**
 * 转义 HTML 特殊字符，防止 XSS。
 */
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
  showMessage("匹配结果已复制");
}

/**
 * 清空所有输入。
 */
function handleClear() {
  pattern.value = "";
  testString.value = "";
  showMessage("已清空");
}

function showMessage(message: string) {
  snackbarText.value = message;
  snackbar.value = true;
}
</script>

<template>
  <div
    class="d-flex flex-column ga-2 h-100"
    style="min-height: 0; overflow: hidden"
  >
    <!-- 顶部工具栏：正则输入 + 标志位 -->
    <v-toolbar border density="compact" flat rounded style="flex: 0 0 auto">
      <v-toolbar-title class="text-body-2 font-weight-medium">
        正则测试
      </v-toolbar-title>

      <v-chip
        :color="
          validation.valid ? 'success' : validation.empty ? 'info' : 'error'
        "
        class="mr-1"
        label
        size="x-small"
        variant="tonal"
      >
        {{
          validation.valid
            ? "语法正确"
            : validation.empty
              ? "等待输入"
              : "语法错误"
        }}
      </v-chip>

      <v-chip
        v-if="hasPattern && hasTestString"
        class="mr-1"
        color="info"
        label
        size="x-small"
        variant="tonal"
      >
        {{ matchCount }} 个匹配
      </v-chip>

      <div class="d-flex align-center ga-1">
        <v-btn
          color="success"
          density="compact"
          prepend-icon="$file"
          :disabled="matchCount === 0"
          size="small"
          text="复制结果"
          variant="tonal"
          @click="handleCopyResults"
        />

        <v-btn
          color="warning"
          density="compact"
          prepend-icon="$clear"
          :disabled="!hasPattern && !hasTestString"
          size="small"
          text="清空"
          variant="text"
          @click="handleClear"
        />
      </div>
    </v-toolbar>

    <!-- 正则输入行：pattern + flags -->
    <v-card border density="compact" flat rounded style="flex: 0 0 auto">
      <v-card-text class="d-flex align-center ga-2 py-2 px-3">
        <span class="text-body-2 text-medium-emphasis">/</span>
        <v-text-field
          v-model="pattern"
          density="compact"
          hide-details
          placeholder="输入正则表达式"
          variant="outlined"
        />
        <span class="text-body-2 text-medium-emphasis">/</span>

        <!-- 标志位复选框 -->
        <div class="d-flex ga-1 ml-1">
          <v-checkbox-btn
            v-for="opt in flagOptions"
            :key="opt.key"
            v-model="flags[opt.key]"
            :label="opt.label"
            :title="opt.title"
            density="compact"
            hide-details
          />
        </div>
      </v-card-text>

      <!-- 语法错误提示 -->
      <v-alert
        v-if="!validation.valid && !validation.empty && validation.errorMessage"
        class="mx-3 mb-2"
        density="compact"
        type="error"
        variant="tonal"
      >
        {{ validation.errorMessage }}
      </v-alert>
    </v-card>

    <!-- 工作区：左侧测试文本 + 右侧匹配结果，比例持久化到 localStorage -->
    <SplitPanel :panel-key="PANEL_KEYS.regexTester">
      <template #left>
        <PanelCard icon="$file" title="测试字符串">
          <textarea
            v-model="testString"
            placeholder="输入需要测试的文本"
            style="
              width: 100%;
              height: 100%;
              resize: none;
              border: none;
              outline: none;
              background: transparent;
              font-family: inherit;
              font-size: inherit;
              line-height: inherit;
              color: inherit;
            "
          />
        </PanelCard>
      </template>

      <template #right>
        <PanelCard icon="$search" overflow="auto" title="匹配结果">
          <!-- 高亮预览 -->
          <v-card
            v-if="hasTestString"
            border="sm"
            class="mb-2"
            flat
            variant="tonal"
          >
            <v-card-text
              class="text-body-2 pa-2"
              style="
                white-space: pre-wrap;
                word-break: break-all;
                line-height: 1.6;
              "
              v-html="highlightedHtml"
            />
          </v-card>

          <!-- 匹配列表 -->
          <template v-if="result.matches.length > 0">
            <v-card
              v-for="(match, idx) in result.matches"
              :key="idx"
              border="sm"
              class="mb-1"
              flat
            >
              <v-card-text class="py-1 px-2">
                <div class="d-flex align-center ga-1 mb-1">
                  <v-chip color="primary" label size="x-small" variant="tonal">
                    #{{ idx + 1 }}
                  </v-chip>
                  <span class="text-caption text-medium-emphasis">
                    位置 {{ match.index }}–{{
                      match.index + match.text.length - 1
                    }}
                  </span>
                </div>

                <div class="text-body-2" style="word-break: break-all">
                  <span class="text-medium-emphasis text-caption">匹配：</span>
                  <code class="ml-1">{{ match.text }}</code>
                </div>

                <div v-if="match.groups.length > 0" class="mt-1">
                  <div
                    v-for="(group, gIdx) in match.groups"
                    :key="gIdx"
                    class="text-body-2"
                    style="word-break: break-all"
                  >
                    <span class="text-medium-emphasis text-caption">
                      组 {{ gIdx + 1 }}：
                    </span>
                    <code class="ml-1">{{ group ?? "(未匹配)" }}</code>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </template>

          <!-- 无匹配时的提示 -->
          <v-alert
            v-else-if="hasPattern && hasTestString && result.success"
            density="compact"
            type="info"
            variant="tonal"
          >
            没有找到匹配项。
          </v-alert>

          <v-alert
            v-else-if="!hasPattern"
            density="compact"
            type="info"
            variant="tonal"
          >
            输入正则表达式和测试字符串，结果会实时显示。
          </v-alert>
        </PanelCard>
      </template>
    </SplitPanel>

    <v-snackbar v-model="snackbar" timeout="2000">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>
