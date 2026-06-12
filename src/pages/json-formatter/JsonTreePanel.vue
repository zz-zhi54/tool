<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from "vue";

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

const openedNodes = ref<string[]>([]);
const searchQuery = ref("");
const searchVisible = ref(false);
const searchFieldRef = useTemplateRef<HTMLElement>("searchField");

/**
 * 树形视图数据。
 *
 * 这里把 JSON 对象/数组转换为 Vuetify v-treeview 可识别的 children 结构，
 * 用户折叠节点时只看到字段名和摘要，从而隐藏对应层级的 { 或 [ 结构符号。
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
 * 搜索会保留命中节点的祖先路径，避免用户只看到孤立节点而不知道它在 JSON 中的位置。
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
 *
 * 搜索时会展开所有命中节点的祖先路径，不搜索时保持默认全展开。
 */
watch(
  () => [props.value, searchQuery.value],
  () => {
    openedNodes.value = collectExpandableIds(treeItems.value);
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

/**
 * 判断一个值是否是普通 JSON 对象。
 */
function isJsonObject(value: JsonValue): value is { [key: string]: JsonValue } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * 获取基础 JSON 值的类型名称。
 */
function getPrimitiveType(value: Exclude<JsonValue, JsonValue[] | object>) {
  return value === null ? "null" : typeof value;
}

/**
 * 格式化基础 JSON 值。
 */
function formatPrimitiveValue(value: Exclude<JsonValue, JsonValue[] | object>) {
  return typeof value === "string" ? JSON.stringify(value) : String(value);
}

/**
 * 按关键字过滤树节点。
 *
 * 只要节点的字段名、类型摘要或基础值命中，就保留该节点；
 * 子节点命中时也会保留父节点，保持搜索结果完整路径。
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
  openedNodes.value = collectExpandableIds(treeItems.value);
}

/**
 * 折叠所有对象和数组节点。
 */
function collapseAll() {
  openedNodes.value = [];
}

/**
 * 切换搜索框可见性。
 *
 * 展开时自动聚焦输入框；收起时清空搜索关键字，回到完整树视图。
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
  <v-card
    border="sm"
    class="d-flex flex-column"
    flat
    height="100%"
    style="min-height: 0"
  >
    <v-card-title
      class="d-flex align-center text-body-2 font-weight-medium px-2 py-1"
    >
      <v-icon class="mr-1" icon="$subgroup" size="small" />
      结构视图
      <v-spacer />

      <v-btn
        class="mr-1"
        density="compact"
        icon="$search"
        size="x-small"
        variant="text"
        @click.stop="toggleSearch"
      />

      <v-btn-group density="compact" variant="tonal">
        <v-btn size="x-small" text="展开" @click.stop="expandAll" />
        <v-btn size="x-small" text="折叠" @click.stop="collapseAll" />
      </v-btn-group>
    </v-card-title>

    <v-divider />

    <div v-if="searchVisible" class="px-2 py-1">
      <v-text-field
        ref="searchField"
        v-model="searchQuery"
        clearable
        density="compact"
        hide-details
        placeholder="搜索字段或值"
        single-line
        variant="outlined"
      />
    </div>

    <v-divider v-if="searchVisible" />

    <v-card-text class="pa-2" style="flex: 1; min-height: 0; overflow: auto">
      <v-alert
        v-if="treeItems.length === 0"
        density="compact"
        type="info"
        variant="tonal"
      >
        粘贴合法 JSON 后，结构视图会自动生成并默认展开。
      </v-alert>

      <v-treeview
        v-else
        v-model:opened="openedNodes"
        :items="treeItems"
        density="compact"
        item-children="children"
        item-title="label"
        item-value="id"
        open-on-click
      >
        <template #title="{ item }">
          <span class="text-body-2 font-weight-medium">{{ item.label }}</span>
          <v-chip class="ml-1" size="x-small" variant="tonal">
            {{ item.type }}
          </v-chip>
          <span
            v-if="item.value"
            class="ml-1 text-caption text-medium-emphasis"
          >
            {{ item.value }}
          </span>
        </template>
      </v-treeview>
    </v-card-text>
  </v-card>
</template>
