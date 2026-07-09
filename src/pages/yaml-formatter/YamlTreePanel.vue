<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from "vue";

import { ApartmentOutlined, SearchOutlined } from "@ant-design/icons-vue";

/**
 * YAML 树节点结构。
 */
interface YamlTreeNode {
  id: string;
  label: string;
  type: string;
  value?: string;
  children?: YamlTreeNode[];
}

const props = defineProps<{
  /** 已解析的 YAML 值，undefined 表示输入为空或不合法 */
  value?: unknown;
}>();

const expandedKeys = ref<string[]>([]);
const searchQuery = ref("");
const searchVisible = ref(false);
const searchFieldRef = useTemplateRef<HTMLElement>("searchField");

const allTreeItems = computed<YamlTreeNode[]>(() => {
  if (props.value === undefined || props.value === null) {
    return [];
  }

  return [createTreeNode(props.value, "root", "root")];
});

const treeItems = computed<YamlTreeNode[]>(() => {
  const keyword = searchQuery.value.trim().toLowerCase();

  if (!keyword) {
    return allTreeItems.value;
  }

  return allTreeItems.value
    .map((node) => filterTreeNode(node, keyword))
    .filter((node): node is YamlTreeNode => node !== undefined);
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
): YamlTreeNode {
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
  node: YamlTreeNode,
  keyword: string,
): YamlTreeNode | undefined {
  const matchedSelf = [node.label, node.type, node.value]
    .filter(Boolean)
    .some((text) => text!.toLowerCase().includes(keyword));
  const matchedChildren = node.children
    ?.map((child) => filterTreeNode(child, keyword))
    .filter((child): child is YamlTreeNode => child !== undefined);

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

function collectExpandableIds(nodes: YamlTreeNode[]): string[] {
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
        description="粘贴合法 YAML 后，结构视图会自动生成并默认展开。"
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
