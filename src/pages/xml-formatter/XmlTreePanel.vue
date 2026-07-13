<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from "vue";

import { SearchOutlined } from "@ant-design/icons-vue";

import OutputPanel from "../../components/OutputPanel.vue";
import type { XmlNode } from "../../tools/xml/xmlTypes";

/**
 * XML 树节点结构。
 * 兼容 a-tree 的字段命名：id / label / children。
 */
interface XmlTreeNode {
  id: string;
  label: string;
  type: string;
  value?: string;
  attrs?: string;
  children?: XmlTreeNode[];
}

const props = defineProps<{
  /** 已解析的 XML 节点，undefined 表示输入为空或不合法 */
  value?: XmlNode;
}>();

const expandedKeys = ref<string[]>([]);
const searchQuery = ref("");
const searchVisible = ref(false);
const searchFieldRef = useTemplateRef<HTMLElement>("searchField");

const allTreeItems = computed<XmlTreeNode[]>(() => {
  if (!props.value) return [];
  return [convertNode(props.value, "0")];
});

const treeItems = computed<XmlTreeNode[]>(() => {
  const keyword = searchQuery.value.trim().toLowerCase();
  if (!keyword) return allTreeItems.value;

  return allTreeItems.value
    .map((node) => filterTreeNode(node, keyword))
    .filter((node): node is XmlTreeNode => node !== undefined);
});

watch(
  () => [props.value, searchQuery.value],
  () => {
    expandedKeys.value = collectExpandableIds(treeItems.value);
  },
  { immediate: true },
);

function convertNode(node: XmlNode, path: string): XmlTreeNode {
  const attrs = node.attributes
    ? Object.entries(node.attributes)
        .map(([k, v]) => `${k}="${v}"`)
        .join(" ")
    : undefined;

  let label = node.name;
  let type: string = node.type;
  if (node.type === "element") {
    const childCount = node.children?.length ?? 0;
    const attrPart = attrs ? ` ${attrs}` : "";
    label = `<${node.name}${attrPart}>${childCount ? "" : ""}`;
    type = childCount > 0 ? `Element(${childCount})` : "Element";
  } else if (node.type === "text") {
    type = "Text";
  } else if (node.type === "cdata") {
    type = "CDATA";
  } else if (node.type === "comment") {
    type = "Comment";
  }

  const result: XmlTreeNode = {
    id: path,
    label,
    type,
    value: node.value,
    attrs,
    children: node.children?.map((child, i) =>
      convertNode(child, `${path}.${i}`),
    ),
  };

  return result;
}

function filterTreeNode(
  node: XmlTreeNode,
  keyword: string,
): XmlTreeNode | undefined {
  const matchedSelf = [node.label, node.type, node.value, node.attrs]
    .filter(Boolean)
    .some((text) => text!.toLowerCase().includes(keyword));
  const matchedChildren = node.children
    ?.map((child) => filterTreeNode(child, keyword))
    .filter((child): child is XmlTreeNode => child !== undefined);

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

function collectExpandableIds(nodes: XmlTreeNode[]): string[] {
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
      placeholder="搜索标签、属性或值"
      size="small"
    />

    <a-empty
      v-if="treeItems.length === 0"
      description="粘贴合法 XML 后，结构视图会自动生成并默认展开。"
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
      <template #title="{ label, type, value, attrs }">
        <strong>{{ label }}</strong>
        <a-tag style="margin-left: 4px" size="small">{{ type }}</a-tag>
        <a-typography-text
          v-if="attrs"
          type="secondary"
          style="margin-left: 4px"
        >
          {{ attrs }}
        </a-typography-text>
        <a-typography-text
          v-if="value"
          type="secondary"
          style="margin-left: 4px; word-break: break-all"
        >
          {{ value }}
        </a-typography-text>
      </template>
    </a-tree>
  </OutputPanel>
</template>
