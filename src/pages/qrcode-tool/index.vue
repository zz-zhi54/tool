<script setup lang="ts">
/**
 * 二维码工具页面。
 *
 * 左右分栏同时显示两个功能：
 * - 左：输入文本 + 生成配置，实时生成二维码并提供下载。
 * - 右：上传 / 拖拽 / 从剪贴板读取图片，解码出原始内容。
 *
 * 两个功能互相独立，状态条各自显示，宽度可拖拽并持久化。
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
import SplitPanel from "../../components/SplitPanel.vue";
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
import { PANEL_KEYS } from "../../utils/storage";

/** 默认生成配置。 */
const DEFAULTS = {
  size: 320,
  margin: 2,
  errorLevel: "M" as QrErrorLevel,
  fgColor: "#000000",
  bgColor: "#FFFFFF",
};

// ── 左侧「生成」状态 ────────────────────────────────────
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

// ── 右侧「识别」状态 ────────────────────────────────────
const imagePreviewURL = ref<string | null>(null);
const decodedText = ref<string | null>(null);
const decodeError = ref<string | null>(null);
const isDecoding = ref(false);
const isDragActive = ref(false);

// ── 计算属性：左「生成」 ─────────────────────────────────
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

// ── 计算属性：右「识别」 ─────────────────────────────────
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

async function handleCopyDataURL() {
  if (!generatedDataURL.value) return;
  try {
    await copyText(generatedDataURL.value);
    showInfo("dataURL 已复制");
  } catch {
    showError("复制失败，请检查浏览器剪贴板权限");
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
</script>

<template>
  <div
    class="d-flex flex-column ga-2 h-100"
    style="min-height: 0; overflow: hidden"
  >
    <SplitPanel :panel-key="PANEL_KEYS.qrcodeTool">
      <!-- 左：生成 -->
      <template #left>
        <PanelCard icon="BarcodeOutlined" title="生成二维码">
          <template #actions>
            <a-tag :color="generateStatusColor" size="small">
              {{ generateStatusLabel }}
            </a-tag>
            <a-button
              size="small"
              type="text"
              :disabled="!hasInput"
              @click="handleClearGenerate"
            >
              <template #icon>
                <DeleteOutlined />
              </template>
              清空
            </a-button>
          </template>

          <div class="d-flex flex-column" style="height: 100%; gap: 8px">
            <textarea
              v-model="input"
              class="app-textarea"
              placeholder="输入任意文本（URL、JSON、联系方式…）"
              style="flex: 0 0 auto; min-height: 72px; max-height: 120px"
            />
            <div class="text-caption" style="color: var(--app-text-muted)">
              {{ charCount }} 字符
            </div>

            <!-- 居中预览：二维码主体展示区 -->
            <div class="qrcode-preview-wrap">
              <div
                v-if="generateError"
                class="qrcode-preview-empty"
                style="color: #d4380d"
              >
                生成失败：{{ generateError }}
              </div>
              <a-empty
                v-else-if="!hasGeneratedImage"
                :image="undefined"
                description="在上方输入内容，二维码会实时显示"
                class="qrcode-preview-empty"
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
                class="qrcode-preview-img"
              />
            </div>

            <div
              class="d-flex flex-column"
              style="
                border-top: 1px solid var(--app-border);
                padding-top: 8px;
                gap: 8px;
              "
            >
              <div class="text-caption font-weight-medium">生成配置</div>

              <div class="d-flex align-center" style="gap: 8px">
                <span style="width: 56px; font-size: 12px">尺寸</span>
                <a-slider
                  v-model:value="size"
                  :min="160"
                  :max="640"
                  :step="16"
                  style="flex: 1"
                />
                <span
                  class="text-caption"
                  style="
                    width: 48px;
                    text-align: right;
                    color: var(--app-text-muted);
                  "
                >
                  {{ size }}px
                </span>
              </div>

              <div class="d-flex align-center" style="gap: 8px">
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
              </div>

              <div class="d-flex align-center" style="gap: 8px">
                <span style="width: 56px; font-size: 12px">边距</span>
                <a-slider
                  v-model:value="margin"
                  :min="0"
                  :max="8"
                  :step="1"
                  style="flex: 1"
                />
                <span
                  class="text-caption"
                  style="
                    width: 48px;
                    text-align: right;
                    color: var(--app-text-muted);
                  "
                >
                  {{ margin }}
                </span>
              </div>

              <div class="d-flex align-center" style="gap: 12px">
                <span style="width: 56px; font-size: 12px">前景色</span>
                <input
                  v-model="fgColor"
                  type="color"
                  class="qrcode-color-input"
                />
                <span
                  class="text-caption"
                  style="
                    color: var(--app-text-muted);
                    font-family: ui-monospace, monospace;
                  "
                >
                  {{ fgColor }}
                </span>
                <span style="flex: 1" />
                <span style="width: 56px; font-size: 12px">背景色</span>
                <input
                  v-model="bgColor"
                  type="color"
                  class="qrcode-color-input"
                />
                <span
                  class="text-caption"
                  style="
                    color: var(--app-text-muted);
                    font-family: ui-monospace, monospace;
                  "
                >
                  {{ bgColor }}
                </span>
              </div>
            </div>

            <!-- 操作行 -->
            <div
              class="d-flex align-center"
              style="
                gap: 8px;
                border-top: 1px solid var(--app-border);
                padding-top: 8px;
                flex-wrap: wrap;
              "
            >
              <a-button
                size="small"
                type="primary"
                ghost
                :disabled="!hasInput"
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
                ghost
                :disabled="!hasGeneratedImage"
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
                ghost
                :disabled="!hasGeneratedImage"
                @click="handleDownloadSvg"
              >
                <template #icon>
                  <DownloadOutlined />
                </template>
                下载 SVG
              </a-button>
              <a-button
                size="small"
                type="default"
                ghost
                :disabled="!hasGeneratedImage"
                @click="handleCopyDataURL"
              >
                <template #icon>
                  <CopyOutlined />
                </template>
                复制 dataURL
              </a-button>
            </div>
          </div>
        </PanelCard>
      </template>

      <!-- 右：识别 -->
      <template #right>
        <PanelCard icon="ScanOutlined" title="识别二维码">
          <template #actions>
            <a-tag :color="decodeStatusColor" size="small">
              {{ decodeStatusLabel }}
            </a-tag>
            <a-button
              size="small"
              type="text"
              :disabled="!hasPreviewImage && !hasDecodedText && !decodeError"
              @click="handleClearDecode"
            >
              <template #icon>
                <DeleteOutlined />
              </template>
              清空
            </a-button>
          </template>

          <div class="d-flex flex-column" style="height: 100%; gap: 8px">
            <!-- 拖拽区 + 选择文件 -->
            <label
              class="qrcode-dropzone"
              :style="dropZoneStyle"
              @dragenter.prevent="onDragEnter"
              @dragover.prevent="onDragOver"
              @dragleave.prevent="onDragLeave"
              @drop.prevent="onDrop"
            >
              <input
                type="file"
                accept="image/*"
                class="qrcode-file-input"
                @change="onFileInputChange"
              />
              <CloudUploadOutlined
                style="font-size: 28px; color: var(--app-text-muted)"
              />
              <div
                class="text-body-2"
                style="margin-top: 6px; color: var(--app-text)"
              >
                点击选择 或 拖拽图片到此处
              </div>
              <div
                class="text-caption"
                style="margin-top: 2px; color: var(--app-text-muted)"
              >
                支持 PNG / JPG / WebP / BMP，单张最大 10MB
              </div>
            </label>

            <a-button
              size="small"
              type="primary"
              ghost
              :loading="isDecoding"
              @click="onPickFromClipboard"
            >
              <template #icon>
                <ScanOutlined />
              </template>
              从剪贴板读取图片
            </a-button>

            <!-- 图片预览 -->
            <div
              v-if="imagePreviewURL"
              class="d-flex align-center justify-center"
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
            </div>

            <!-- 解码结果 -->
            <textarea
              :value="decodedText ?? ''"
              class="app-textarea"
              readonly
              placeholder="解码结果会显示在这里"
              style="flex: 1; min-height: 80px"
            />
            <div v-if="decodeError" class="text-caption" style="color: #d4380d">
              {{ decodeError }}
            </div>

            <!-- 操作行 -->
            <div
              class="d-flex align-center"
              style="
                gap: 8px;
                border-top: 1px solid var(--app-border);
                padding-top: 8px;
              "
            >
              <a-button
                size="small"
                type="primary"
                ghost
                :disabled="!hasDecodedText"
                @click="handleCopyDecoded"
              >
                <template #icon>
                  <CopyOutlined />
                </template>
                复制结果
              </a-button>
              <span
                v-if="hasDecodedText"
                class="text-caption"
                style="color: var(--app-text-muted)"
              >
                （{{ decodedText!.length }} 字符）
              </span>
            </div>
          </div>
        </PanelCard>
      </template>
    </SplitPanel>
  </div>
</template>

<style scoped>
/* 颜色选择器：缩小原生 input 的大小，跟 ant 控件风格一致 */
.qrcode-color-input {
  width: 32px;
  height: 24px;
  padding: 0;
  border: 1px solid var(--app-border);
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
}
.qrcode-color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}
.qrcode-color-input::-webkit-color-swatch {
  border: none;
  border-radius: 3px;
}

/* 拖拽上传区：用 label + hidden input 实现"点击也选文件" */
.qrcode-dropzone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  min-height: 140px;
  border: 1px dashed var(--app-border);
  border-radius: 4px;
  cursor: pointer;
  transition:
    border-color 120ms ease,
    background-color 120ms ease;
}
.qrcode-dropzone:hover {
  border-color: #000000;
}
.qrcode-file-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

/* 二维码预览区：占据左 PanelCard 主要视觉空间
   - 自适应列宽（max-width: 100%）
   - 固定 320px 高度避免过大撑爆布局
   - 白色背景（无论主题）确保二维码在深色下也清晰可见 */
.qrcode-preview-wrap {
  flex: 1 1 auto;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  border: 1px solid var(--app-border);
  border-radius: 4px;
  padding: 12px;
  overflow: hidden;
}
.qrcode-preview-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
}
.qrcode-preview-empty {
  text-align: center;
  color: var(--app-text-muted);
  font-size: 12px;
}
</style>
