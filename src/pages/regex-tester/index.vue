<script setup lang="ts">
/**
 * 正则表达式测试器（独立页）。
 *
 * 控件行 → 测试字符串输入 → 匹配结果多列网格。
 *   - 控件行：标题 + /pattern/ + flags + 状态 tag + 复制/清空按钮
 *   - 测试字符串：固定 180px
 *   - 匹配结果：多列卡片网格
 *
 * flags 默认值持久化到 localStorage（REGEX_FLAGS_KEY），刷新页面保留。
 *
 * 完全基于 antdv 组件实现，不使用任何自定义 class 与 inline style。
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
</script>

<template>
  <a-flex
    vertical
    :gap="8"
    style="height: 100%; padding: 8px; box-sizing: border-box; min-height: 0"
  >
    <!-- 控件行 -->
    <a-card size="small" :body-style="{ padding: '6px 12px' }">
      <a-flex align="center" :gap="4" wrap>
        <strong>正则测试</strong>

        <a-typography-text type="secondary">/</a-typography-text>
        <a-input
          v-model:value="pattern"
          placeholder="输入正则表达式"
          size="small"
          style="flex: 1 1 120px"
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
            validation.valid ? 'green' : validation.empty ? 'default' : 'red'
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

        <a-flex :flex="'1 1 auto'" />

        <a-button
          size="small"
          type="primary"
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
          :disabled="!hasPattern && !input"
          @click="handleClear"
        >
          <template #icon>
            <DeleteOutlined />
          </template>
          清空
        </a-button>
      </a-flex>
    </a-card>

    <!-- 语法错误提示 -->
    <a-alert
      v-if="!validation.valid && !validation.empty && validation.errorMessage"
      type="error"
      :message="validation.errorMessage"
      show-icon
    />

    <!-- 测试字符串输入区 -->
    <a-card size="small" title="测试字符串">
      <a-textarea
        v-model:value="input"
        placeholder="输入需要测试的文本"
        :auto-size="{ minRows: 5 }"
      />
    </a-card>

    <!-- 匹配结果区 -->
    <a-flex
      vertical
      :gap="6"
      style="flex: 1 1 auto; min-height: 0; overflow: auto"
    >
      <a-flex align="center" :gap="6">
        <strong>匹配结果</strong>
        <a-tag v-if="result.matches.length > 0" color="blue" size="small">
          共 {{ matchCount }} 个
        </a-tag>
      </a-flex>

      <a-row v-if="result.matches.length > 0" :gutter="[8, 8]">
        <a-col
          v-for="(match, idx) in result.matches"
          :key="idx"
          :xs="24"
          :sm="12"
          :md="12"
          :lg="8"
          :xl="6"
        >
          <a-card size="small">
            <a-flex align="center" :gap="6" style="margin-bottom: 6px">
              <a-tag color="blue" size="small">#{{ idx + 1 }}</a-tag>
              <a-typography-text type="secondary">
                位置 {{ match.index }}–{{ match.index + match.text.length - 1 }}
              </a-typography-text>
            </a-flex>
            <a-descriptions
              size="small"
              :column="1"
              :label-style="{ width: '60px', textAlign: 'right' }"
            >
              <a-descriptions-item label="匹配">
                <a-typography-text code copyable style="word-break: break-all">
                  {{ match.text }}
                </a-typography-text>
              </a-descriptions-item>
              <a-descriptions-item
                v-for="(group, gIdx) in match.groups"
                :key="gIdx"
                :label="`组 ${gIdx + 1}`"
              >
                <a-typography-text code copyable style="word-break: break-all">
                  {{ group ?? "(未匹配)" }}
                </a-typography-text>
              </a-descriptions-item>
            </a-descriptions>
          </a-card>
        </a-col>
      </a-row>

      <a-empty
        v-else-if="hasPattern && input"
        description="没有找到匹配项。"
        :image="undefined"
      >
        <template #image>
          <span />
        </template>
      </a-empty>

      <a-empty
        v-else
        description="输入正则与测试字符串后，结果会显示在这里。"
        :image="undefined"
      >
        <template #image>
          <span />
        </template>
      </a-empty>
    </a-flex>
  </a-flex>
</template>
