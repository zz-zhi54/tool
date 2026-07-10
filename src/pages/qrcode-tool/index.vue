<script setup lang="ts">
/**
 * 二维码工具页面。
 *
 * 左右分栏同时显示两个功能：
 * - 左：输入文本 + 生成配置，实时生成二维码并提供下载。
 * - 右：上传 / 拖拽 / 从剪贴板读取图片，解码出原始内容。
 *
 * 两个功能互相独立，状态条各自显示。
 */
import { computed, onBeforeUnmount, ref, watch } from "vue";

import {
  CloudUploadOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ScanOutlined,
} from "@ant-design/icons-vue";

import PanelCard from "../../components/PanelCard.vue";
import { showError, showInfo, showSuccess } from "../../composables/useMessage";
import {
  copyText,
  downloadDataURL,
  downloadSvg,
  generateQrDataURL,
  generateQrSvg,
  type QrErrorLevel,
  validateQrInput,
} from "../../tools/qrcode/qrcodeGenerator";
import {
  decodeQrFromClipboard,
  decodeQrFromFile,
} from "../../tools/qrcode/qrcodeDecoder";

/** 默认生成配置。 */
const DEFAULTS = {
  size: 320,
  margin: 2,
  errorLevel: "M" as QrErrorLevel,
  fgColor: "#000000",
  bgColor: "#FFFFFF",
};

// ── 上「生成」状态 ─────────────────────────────────────
const input = ref("");
const size = ref<number>(DEFAULTS.size);
const margin = ref<number>(DEFAULTS.margin);
const errorLevel = ref<QrErrorLevel>(DEFAULTS.errorLevel);
const fgColor = ref<string>(DEFAULTS.fgColor);
const bgColor = ref<string>(DEFAULTS.bgColor);

const generatedDataURL = ref<string | null>(null);
const generatedSvg = ref<string | null>(null);
const generateError = ref<string | null>(null);
/** 当前生成请求的 token，用于忽略过时的 async 回调。 */
let generateToken = 0;
let generateTimer: ReturnType<typeof setTimeout> | null = null;

// ── 下「识别」状态 ─────────────────────────────────────
const imagePreviewURL = ref<string | null>(null);
const decodedText = ref<string | null>(null);
const decodeError = ref<string | null>(null);
const isDecoding = ref(false);
const isDragActive = ref(false);

// ── 计算属性：上「生成」 ─────────────────────────────────
const inputValidation = computed(() => validateQrInput(input.value));
const hasInput = computed(() => input.value.length > 0);
const charCount = computed(() => input.value.length);
const hasGeneratedImage = computed(() => generatedDataURL.value !== null);

const generateStatusColor = computed(() => {
  const v = inputValidation.value;
  if (v.errorMessage) return "orange";
  if (v.empty) return "default";
  if (generateError.value) return "red";
  if (generatedDataURL.value) return "green";
  return "default";
});

const generateStatusLabel = computed(() => {
  const v = inputValidation.value;
  if (v.errorMessage) return v.errorMessage;
  if (v.empty) return "等待输入";
  if (generateError.value) return `生成失败：${generateError.value}`;
  if (generatedDataURL.value) return `已生成 · ${input.value.length} 字符`;
  return "生成中…";
});

// ── 计算属性：下「识别」 ─────────────────────────────────
const hasDecodedText = computed(() => decodedText.value !== null);
const hasPreviewImage = computed(() => imagePreviewURL.value !== null);

const decodeStatusColor = computed(() => {
  if (isDecoding.value) return "blue";
  if (decodeError.value) return "red";
  if (hasDecodedText.value) return "green";
  if (hasPreviewImage.value) return "default";
  return "default";
});

const decodeStatusLabel = computed(() => {
  if (isDecoding.value) return "识别中…";
  if (decodeError.value) return decodeError.value;
  if (hasDecodedText.value) return `已识别 · ${decodedText.value!.length} 字符`;
  if (hasPreviewImage.value) return "已加载图片，等待识别";
  return "等待图片";
});

const dropZoneStyle = computed(() => ({
  borderColor: isDragActive.value ? "#000000" : "var(--app-border)",
  backgroundColor: isDragActive.value
    ? "rgba(0, 0, 0, 0.04)"
    : "var(--app-surface)",
}));

// ── 生成逻辑 ────────────────────────────────────────────
function scheduleGenerate() {
  if (generateTimer) clearTimeout(generateTimer);
  generateTimer = setTimeout(runGenerate, 200);
}

async function runGenerate() {
  generateTimer = null;
  if (!hasInput.value) {
    generatedDataURL.value = null;
    generatedSvg.value = null;
    generateError.value = null;
    return;
  }
  const myToken = ++generateToken;
  try {
    const [dataURL, svg] = await Promise.all([
      generateQrDataURL(input.value, {
        size: size.value,
        margin: margin.value,
        errorLevel: errorLevel.value,
        fgColor: fgColor.value,
        bgColor: bgColor.value,
      }),
      generateQrSvg(input.value, {
        size: size.value,
        margin: margin.value,
        errorLevel: errorLevel.value,
        fgColor: fgColor.value,
        bgColor: bgColor.value,
      }),
    ]);
    if (myToken !== generateToken) return;
    generatedDataURL.value = dataURL;
    generatedSvg.value = svg;
    generateError.value = null;
  } catch (err) {
    if (myToken !== generateToken) return;
    generatedDataURL.value = null;
    generatedSvg.value = null;
    generateError.value = err instanceof Error ? err.message : "未知错误";
  }
}

// 配置变化时重新生成（仅在有输入时）
watch([size, margin, errorLevel, fgColor, bgColor], () => {
  if (hasInput.value) scheduleGenerate();
});

// 有输入时立即生成一次
watch(
  input,
  () => {
    if (hasInput.value) runGenerate();
  },
  { immediate: true },
);

// ── 识别逻辑 ────────────────────────────────────────────
function clearDecodeState() {
  if (imagePreviewURL.value) URL.revokeObjectURL(imagePreviewURL.value);
  imagePreviewURL.value = null;
  decodedText.value = null;
  decodeError.value = null;
}

async function handleFile(file: File) {
  clearDecodeState();
  imagePreviewURL.value = URL.createObjectURL(file);
  isDecoding.value = true;
  try {
    const result = await decodeQrFromFile(file);
    if (result.ok && result.text !== undefined) {
      decodedText.value = result.text;
      showSuccess(`已识别：${result.text.length} 字符`);
    } else {
      decodeError.value = result.errorMessage ?? "识别失败";
      showError(decodeError.value);
    }
  } finally {
    isDecoding.value = false;
  }
}

function onFileInputChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) void handleFile(file);
  target.value = "";
}

function onDrop(e: DragEvent) {
  e.preventDefault();
  isDragActive.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) void handleFile(file);
}

function onDragOver(e: DragEvent) {
  e.preventDefault();
}

function onDragEnter() {
  isDragActive.value = true;
}

function onDragLeave() {
  isDragActive.value = false;
}

async function onPickFromClipboard() {
  isDecoding.value = true;
  try {
    const result = await decodeQrFromClipboard();
    if (result.ok && result.text !== undefined) {
      decodedText.value = result.text;
      decodeError.value = null;
      showSuccess(`已识别：${result.text.length} 字符`);
    } else {
      decodeError.value = result.errorMessage ?? "识别失败";
      showError(decodeError.value);
    }
  } finally {
    isDecoding.value = false;
  }
}

// ── 操作 ────────────────────────────────────────────────
function handleClearGenerate() {
  input.value = "";
  generatedDataURL.value = null;
  generatedSvg.value = null;
  generateError.value = null;
  showInfo("已清空生成内容");
}

function handleClearDecode() {
  clearDecodeState();
  showInfo("已清空识别结果");
}

function makeFilename(ext: string) {
  const ts = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\..+/, "")
    .replace("T", "-");
  return `qrcode-${ts}.${ext}`;
}

function handleDownloadPng() {
  if (!generatedDataURL.value) return;
  try {
    downloadDataURL(generatedDataURL.value, makeFilename("png"));
    showSuccess("PNG 已下载");
  } catch (err) {
    showError(err instanceof Error ? `下载失败：${err.message}` : "下载失败");
  }
}

function handleDownloadSvg() {
  if (!generatedSvg.value) return;
  try {
    downloadSvg(generatedSvg.value, makeFilename("svg"));
    showSuccess("SVG 已下载");
  } catch (err) {
    showError(err instanceof Error ? `下载失败：${err.message}` : "下载失败");
  }
}

async function handleCopyInput() {
  if (!hasInput.value) return;
  try {
    await copyText(input.value);
    showInfo("输入已复制");
  } catch {
    showError("复制失败，请检查浏览器剪贴板权限");
  }
}

async function handleCopyDecoded() {
  if (!hasDecodedText.value) return;
  try {
    await copyText(decodedText.value ?? "");
    showInfo("识别结果已复制");
  } catch {
    showError("复制失败，请检查浏览器剪贴板权限");
  }
}

// 卸载时清理
onBeforeUnmount(() => {
  if (imagePreviewURL.value) URL.revokeObjectURL(imagePreviewURL.value);
});

/* ── 共享样式（用对象 inline，避免 scoped CSS） ── */
const colorInputStyle = {
  width: "32px",
  height: "24px",
  padding: 0,
  border: "1px solid var(--app-border)",
  borderRadius: "4px",
  background: "transparent",
  cursor: "pointer",
} as const;

const previewWrapStyle = {
  flex: "1 1 auto",
  minHeight: "200px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#ffffff",
  border: "1px solid var(--app-border)",
  borderRadius: "4px",
  padding: "12px",
  overflow: "hidden",
} as const;

const previewImgStyle = {
  maxWidth: "100%",
  maxHeight: "100%",
  objectFit: "contain" as const,
  imageRendering: "pixelated" as const,
};

const dropZoneBaseStyle = {
  position: "relative" as const,
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  minHeight: "140px",
  border: "1px dashed var(--app-border)",
  borderRadius: "4px",
  cursor: "pointer",
  transition: "border-color 120ms ease, background-color 120ms ease",
};

const fileInputStyle = {
  position: "absolute" as const,
  inset: 0,
  width: "100%",
  height: "100%",
  opacity: 0,
  cursor: "pointer",
};
</script>

<template>
  <div style="height: 100%; padding: 8px; box-sizing: border-box">
    <a-row :gutter="8" style="height: 100%; margin: 0">
      <!-- 左：生成 -->
      <a-col :xs="24" :sm="24" :md="12" :lg="12" style="height: 100%">
        <PanelCard icon="BarcodeOutlined" title="生成二维码" overflow="auto">
          <template #actions>
            <a-tag :color="generateStatusColor" size="small">
              {{ generateStatusLabel }}
            </a-tag>
            <a-button
              size="small"
              type="text"
              @click="handleClearGenerate"
            >
              <template #icon>
                <DeleteOutlined />
              </template>
              清空
            </a-button>
          </template>

          <a-flex vertical :gap="8" style="height: 100%">
            <textarea
              v-model="input"
              class="app-textarea"
              placeholder="输入任意文本（URL、JSON、联系方式…）"
              style="flex: 0 0 auto; min-height: 72px; max-height: 120px"
            />
            <a-typography-text type="secondary" style="font-size: 12px">
              {{ charCount }} 字符
            </a-typography-text>

            <!-- 居中预览：二维码主体展示区 -->
            <div :style="previewWrapStyle">
              <a-typography-text
                v-if="generateError"
                type="danger"
                style="text-align: center; font-size: 12px"
              >
                生成失败：{{ generateError }}
              </a-typography-text>
              <a-empty
                v-else-if="!hasGeneratedImage"
                :image="undefined"
                description="在上方输入内容，二维码会实时显示"
                style="font-size: 12px"
              >
                <template #image>
                  <span />
                </template>
              </a-empty>
              <img
                v-else
                :src="generatedDataURL ?? ''"
                alt="二维码"
                :width="size"
                :height="size"
                :style="previewImgStyle"
              />
            </div>

            <a-flex
              vertical
              :gap="8"
              style="border-top: 1px solid var(--app-border); padding-top: 8px"
            >
              <a-typography-text strong style="font-size: 12px">
                生成配置
              </a-typography-text>

              <a-flex align="center" :gap="8">
                <span style="width: 56px; font-size: 12px">尺寸</span>
                <a-slider
                  v-model:value="size"
                  :min="160"
                  :max="640"
                  :step="16"
                  style="flex: 1"
                />
                <span
                  style="
                    width: 48px;
                    text-align: right;
                    font-size: 12px;
                    color: var(--app-text-muted);
                  "
                >
                  {{ size }}px
                </span>
              </a-flex>

              <a-flex align="center" :gap="8">
                <span style="width: 56px; font-size: 12px">容错</span>
                <a-radio-group
                  v-model:value="errorLevel"
                  size="small"
                  option-type="button"
                  button-style="solid"
                >
                  <a-radio-button value="L">L · 7%</a-radio-button>
                  <a-radio-button value="M">M · 15%</a-radio-button>
                  <a-radio-button value="Q">Q · 25%</a-radio-button>
                  <a-radio-button value="H">H · 30%</a-radio-button>
                </a-radio-group>
              </a-flex>

              <a-flex align="center" :gap="8">
                <span style="width: 56px; font-size: 12px">边距</span>
                <a-slider
                  v-model:value="margin"
                  :min="0"
                  :max="8"
                  :step="1"
                  style="flex: 1"
                />
                <span
                  style="
                    width: 48px;
                    text-align: right;
                    font-size: 12px;
                    color: var(--app-text-muted);
                  "
                >
                  {{ margin }}
                </span>
              </a-flex>

              <a-flex align="center" :gap="12">
                <span style="width: 56px; font-size: 12px">前景色</span>
                <input
                  v-model="fgColor"
                  type="color"
                  :style="colorInputStyle"
                />
                <span
                  style="
                    color: var(--app-text-muted);
                    font-family: ui-monospace, monospace;
                    font-size: 12px;
                  "
                >
                  {{ fgColor }}
                </span>
                <div style="flex: 1" />
                <span style="width: 56px; font-size: 12px">背景色</span>
                <input
                  v-model="bgColor"
                  type="color"
                  :style="colorInputStyle"
                />
                <span
                  style="
                    color: var(--app-text-muted);
                    font-family: ui-monospace, monospace;
                    font-size: 12px;
                  "
                >
                  {{ bgColor }}
                </span>
              </a-flex>
            </a-flex>

            <!-- 操作行 -->
            <a-flex
              align="center"
              :gap="8"
              wrap
              style="border-top: 1px solid var(--app-border); padding-top: 8px"
            >
              <a-button
                size="small"
                type="primary"
                @click="handleCopyInput"
              >
                <template #icon>
                  <CopyOutlined />
                </template>
                复制输入
              </a-button>
              <a-button
                size="small"
                type="primary"
                @click="handleDownloadPng"
              >
                <template #icon>
                  <DownloadOutlined />
                </template>
                下载 PNG
              </a-button>
              <a-button
                size="small"
                type="primary"
                @click="handleDownloadSvg"
              >
                <template #icon>
                  <DownloadOutlined />
                </template>
                下载 SVG
              </a-button>
            </a-flex>
          </a-flex>
        </PanelCard>
      </a-col>

      <!-- 右：识别 -->
      <a-col :xs="24" :sm="24" :md="12" :lg="12" style="height: 100%">
        <PanelCard icon="ScanOutlined" title="识别二维码" overflow="auto">
          <template #actions>
            <a-tag :color="decodeStatusColor" size="small">
              {{ decodeStatusLabel }}
            </a-tag>
            <a-button
              size="small"
              type="text"
              @click="handleClearDecode"
            >
              <template #icon>
                <DeleteOutlined />
              </template>
              清空
            </a-button>
          </template>

          <a-flex vertical :gap="8" style="height: 100%">
            <!-- 拖拽区 + 选择文件 -->
            <label
              :style="{ ...dropZoneBaseStyle, ...dropZoneStyle }"
              @dragenter.prevent="onDragEnter"
              @dragover.prevent="onDragOver"
              @dragleave.prevent="onDragLeave"
              @drop.prevent="onDrop"
            >
              <input
                type="file"
                accept="image/*"
                :style="fileInputStyle"
                @change="onFileInputChange"
              />
              <CloudUploadOutlined
                style="font-size: 28px; color: var(--app-text-muted)"
              />
              <div style="margin-top: 6px; color: var(--app-text)">
                点击选择 或 拖拽图片到此处
              </div>
              <div
                style="
                  margin-top: 2px;
                  color: var(--app-text-muted);
                  font-size: 12px;
                "
              >
                支持 PNG / JPG / WebP / BMP，单张最大 10MB
              </div>
            </label>

            <a-button
              size="small"
              type="primary"
              :loading="isDecoding"
              @click="onPickFromClipboard"
            >
              <template #icon>
                <ScanOutlined />
              </template>
              从剪贴板读取图片
            </a-button>

            <!-- 图片预览 -->
            <a-flex
              v-if="imagePreviewURL"
              align="center"
              justify="center"
              style="
                flex: 0 0 auto;
                max-height: 200px;
                background-color: #ffffff;
                border: 1px solid var(--app-border);
                border-radius: 4px;
                padding: 8px;
                overflow: hidden;
              "
            >
              <img
                :src="imagePreviewURL"
                alt="待识别图片"
                style="max-width: 100%; max-height: 184px; object-fit: contain"
              />
            </a-flex>

            <!-- 解码结果 -->
            <textarea
              :value="decodedText ?? ''"
              class="app-textarea"
              readonly
              placeholder="解码结果会显示在这里"
              style="flex: 1; min-height: 80px"
            />
            <a-typography-text
              v-if="decodeError"
              type="danger"
              style="font-size: 12px"
            >
              {{ decodeError }}
            </a-typography-text>

            <!-- 操作行 -->
            <a-flex
              align="center"
              :gap="8"
              style="border-top: 1px solid var(--app-border); padding-top: 8px"
            >
              <a-button
                size="small"
                type="primary"
                @click="handleCopyDecoded"
              >
                <template #icon>
                  <CopyOutlined />
                </template>
                复制结果
              </a-button>
              <a-typography-text
                v-if="hasDecodedText"
                type="secondary"
                style="font-size: 12px"
              >
                （{{ decodedText!.length }} 字符）
              </a-typography-text>
            </a-flex>
          </a-flex>
        </PanelCard>
      </a-col>
    </a-row>
  </div>
</template>
