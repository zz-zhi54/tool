<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from "vue";

import { ApartmentOutlined, SearchOutlined } from "@ant-design/icons-vue";

import type { JsonValue } from "../../tools/json/jsonTypes";

interface JsonTreeNode {
  id: string;
  label: string;
  type: string;
  value?: string;
  children?: JsonTreeNode[];
}

const props = defineProps<{
  value?: JsonValue;
}>();

const expandedKeys = ref<string[]>([]);
const searchQuery = ref("");
const searchVisible = ref(false);
const searchFieldRef = useTemplateRef<HTMLElement>("searchField");

/**
 * 树形视图数据。
 *
 * 把 JSON 对象/数组转换为 a-tree 可识别的 children 结构，
 * 用户折叠节点时只看到字段名和摘要。
 */
const allTreeItems = computed<JsonTreeNode[]>(() => {
  if (props.value === undefined) {
    return [];
  }

  return [createTreeNode(props.value, "root", "root")];
});

/**
 * 搜索后的树形视图数据。
 *
 * 保留命中节点的祖先路径，避免用户只看到孤立节点。
 */
const treeItems = computed<JsonTreeNode[]>(() => {
  const keyword = searchQuery.value.trim().toLowerCase();

  if (!keyword) {
    return allTreeItems.value;
  }

  return allTreeItems.value
    .map((node) => filterTreeNode(node, keyword))
    .filter((node): node is JsonTreeNode => node !== undefined);
});

/**
 * JSON 结构变化或搜索关键字变化时默认展开树节点。
 */
watch(
  () => [props.value, searchQuery.value],
  () => {
    expandedKeys.value = collectExpandableIds(treeItems.value);
  },
  { immediate: true },
);

/**
 * 根据 JSON 值创建树节点。
 */
function createTreeNode(
  value: JsonValue,
  label: string,
  path: string,
): JsonTreeNode {
  if (Array.isArray(value)) {
    return {
      id: path,
      label,
      type: `Array(${value.length})`,
      children: value.map((item, index) =>
        createTreeNode(item, `[${index}]`, `${path}.${index}`),
      ),
    };
  }

  if (isJsonObject(value)) {
    const entries = Object.entries(value);

    return {
      id: path,
      label,
      type: `Object(${entries.length})`,
      children: entries.map(([key, childValue]) =>
        createTreeNode(childValue, key, `${path}.${key}`),
      ),
    };
  }

  return {
    id: path,
    label,
    type: getPrimitiveType(value),
    value: formatPrimitiveValue(value),
  };
}

function isJsonObject(value: JsonValue): value is { [key: string]: JsonValue } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPrimitiveType(value: Exclude<JsonValue, JsonValue[] | object>) {
  return value === null ? "null" : typeof value;
}

function formatPrimitiveValue(value: Exclude<JsonValue, JsonValue[] | object>) {
  return typeof value === "string" ? JSON.stringify(value) : String(value);
}

/**
 * 按关键字过滤树节点。
 */
function filterTreeNode(
  node: JsonTreeNode,
  keyword: string,
): JsonTreeNode | undefined {
  const matchedSelf = [node.label, node.type, node.value]
    .filter(Boolean)
    .some((text) => text!.toLowerCase().includes(keyword));
  const matchedChildren = node.children
    ?.map((child) => filterTreeNode(child, keyword))
    .filter((child): child is JsonTreeNode => child !== undefined);

  if (!matchedSelf && !matchedChildren?.length) {
    return undefined;
  }

  return {
    ...node,
    children: matchedChildren,
  };
}

/**
 * 展开所有对象和数组节点。
 */
function expandAll() {
  expandedKeys.value = collectExpandableIds(treeItems.value);
}

/**
 * 折叠所有对象和数组节点。
 */
function collapseAll() {
  expandedKeys.value = [];
}

/**
 * 切换搜索框可见性。
 */
async function toggleSearch() {
  if (searchVisible.value) {
    searchQuery.value = "";
    searchVisible.value = false;
    return;
  }

  searchVisible.value = true;
  await nextTick();
  searchFieldRef.value?.focus();
}

/**
 * 收集所有可展开节点 ID。
 */
function collectExpandableIds(nodes: JsonTreeNode[]): string[] {
  return nodes.flatMap((node) => {
    if (!node.children?.length) {
      return [];
    }

    return [node.id, ...collectExpandableIds(node.children)];
  });
}
</script>

<template>
  <section
    class="d-flex flex-column"
    style="
      height: 100%;
      min-height: 0;
      overflow: hidden;
      border: 1px solid var(--app-border);
      border-radius: 4px;
      background-color: var(--app-surface);
    "
  >
    <header
      class="d-flex align-center text-body-2 font-weight-medium px-2 py-1"
      style="
        flex: 0 0 auto;
        gap: 4px;
        border-bottom: 1px solid var(--app-border);
      "
    >
      <ApartmentOutlined
        style="font-size: 14px; color: var(--app-text-muted)"
      />
      结构视图
      <span style="flex: 1 1 auto" />

      <a-button size="small" type="text" @click.stop="toggleSearch">
        <template #icon>
          <SearchOutlined />
        </template>
      </a-button>

      <a-space :size="4">
        <a-button size="small" type="default" @click.stop="expandAll">
          展开
        </a-button>
        <a-button size="small" type="default" @click.stop="collapseAll">
          折叠
        </a-button>
      </a-space>
    </header>

    <div
      v-if="searchVisible"
      class="px-2 py-1"
      style="flex: 0 0 auto; border-bottom: 1px solid var(--app-border)"
    >
      <a-input
        ref="searchField"
        v-model:value="searchQuery"
        allow-clear
        placeholder="搜索字段或值"
        size="small"
      />
    </div>

    <div class="pa-2" style="flex: 1; min-height: 0; overflow: auto">
      <a-empty
        v-if="treeItems.length === 0"
        description="粘贴合法 JSON 后，结构视图会自动生成并默认展开。"
        :image="undefined"
      >
        <template #image>
          <span />
        </template>
      </a-empty>

      <a-tree
        v-else
        v-model:expanded-keys="expandedKeys"
        :tree-data="treeItems"
        :field-names="{ key: 'id', title: 'label', children: 'children' }"
        :block-node="true"
        :selectable="false"
        :show-line="false"
        :virtual="false"
      >
        <template #title="{ label, type, value }">
          <span class="text-body-2 font-weight-medium">{{ label }}</span>
          <a-tag class="ml-1" size="small">{{ type }}</a-tag>
          <span
            v-if="value"
            class="ml-1 text-caption"
            style="color: var(--app-text-muted)"
          >
            {{ value }}
          </span>
        </template>
      </a-tree>
    </div>
  </section>
</template>
