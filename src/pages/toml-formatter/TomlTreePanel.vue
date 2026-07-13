<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from "vue";

import { SearchOutlined } from "@ant-design/icons-vue";

import OutputPanel from "../../components/OutputPanel.vue";

interface TomlTreeNode {
  id: string;
  label: string;
  type: string;
  value?: string;
  children?: TomlTreeNode[];
}

const props = defineProps<{
  value?: unknown;
}>();

const expandedKeys = ref<string[]>([]);
const searchQuery = ref("");
const searchVisible = ref(false);
const searchFieldRef = useTemplateRef<HTMLElement>("searchField");

const allTreeItems = computed<TomlTreeNode[]>(() => {
  if (props.value === undefined || props.value === null) return [];
  return [createTreeNode(props.value, "root", "root")];
});

const treeItems = computed<TomlTreeNode[]>(() => {
  const keyword = searchQuery.value.trim().toLowerCase();
  if (!keyword) return allTreeItems.value;

  return allTreeItems.value
    .map((node) => filterTreeNode(node, keyword))
    .filter((node): node is TomlTreeNode => node !== undefined);
});

watch(
  () => [props.value, searchQuery.value],
  () => {
    expandedKeys.value = collectExpandableIds(treeItems.value);
  },
  { immediate: true },
);

function createTreeNode(
  value: unknown,
  label: string,
  path: string,
): TomlTreeNode {
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

  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    return {
      id: path,
      label,
      type: `Table(${entries.length})`,
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPrimitiveType(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  return typeof value;
}

function formatPrimitiveValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return JSON.stringify(value);
  return String(value);
}

function filterTreeNode(
  node: TomlTreeNode,
  keyword: string,
): TomlTreeNode | undefined {
  const matchedSelf = [node.label, node.type, node.value]
    .filter(Boolean)
    .some((text) => text!.toLowerCase().includes(keyword));
  const matchedChildren = node.children
    ?.map((child) => filterTreeNode(child, keyword))
    .filter((child): child is TomlTreeNode => child !== undefined);

  if (!matchedSelf && !matchedChildren?.length) {
    return undefined;
  }

  return {
    ...node,
    children: matchedChildren,
  };
}

function expandAll() {
  expandedKeys.value = collectExpandableIds(treeItems.value);
}

function collapseAll() {
  expandedKeys.value = [];
}

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

function collectExpandableIds(nodes: TomlTreeNode[]): string[] {
  return nodes.flatMap((node) => {
    if (!node.children?.length) return [];
    return [node.id, ...collectExpandableIds(node.children)];
  });
}
</script>

<template>
  <OutputPanel icon="ApartmentOutlined" title="结构视图">
    <template #actions>
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
    </template>

    <a-input
      v-if="searchVisible"
      ref="searchField"
      v-model:value="searchQuery"
      allow-clear
      placeholder="搜索字段或值"
      size="small"
    />

    <a-empty
      v-if="treeItems.length === 0"
      description="粘贴合法 TOML 后，结构视图会自动生成并默认展开。"
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
      :virtual="false"
      style="overflow: auto; flex: 1 1 auto; min-height: 0"
    >
      <template #title="{ label, type, value }">
        <strong>{{ label }}</strong>
        <a-tag style="margin-left: 4px" size="small">{{ type }}</a-tag>
        <a-typography-text
          v-if="value"
          type="secondary"
          style="margin-left: 4px"
        >
          {{ value }}
        </a-typography-text>
      </template>
    </a-tree>
  </OutputPanel>
</template>
