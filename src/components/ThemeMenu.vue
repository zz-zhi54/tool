<script setup lang="ts">
import { computed } from "vue";
import { useTheme } from "vuetify";

type BuiltInThemeName = "system" | "light" | "dark";

const theme = useTheme();

/**
 * 主题菜单选项。
 *
 * 这里只暴露 Vuetify 内置主题，不维护自定义主题名或自定义颜色，
 * 保证整个应用的外观策略都由 Vuetify 主题系统接管。
 */
const themeOptions: Array<{
  title: string;
  value: BuiltInThemeName;
  icon: string;
}> = [
  {
    title: "跟随系统",
    value: "system",
    icon: "$info",
  },
  {
    title: "浅色",
    value: "light",
    icon: "$success",
  },
  {
    title: "深色",
    value: "dark",
    icon: "$warning",
  },
];

/**
 * 当前主题名称。
 *
 * Vuetify 会把主题名称保存在响应式 Ref 中，这里转成计算属性，
 * 方便模板判断哪个主题处于选中状态。
 */
const currentThemeName = computed(() => theme.name.value);

/**
 * 切换到指定 Vuetify 内置主题。
 *
 * @param name Vuetify 内置主题名称，只允许 system / light / dark。
 */
function changeTheme(name: BuiltInThemeName) {
  theme.change(name);
}
</script>

<template>
  <v-menu location="bottom end">
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        density="compact"
        prepend-icon="$color"
        size="small"
        text="主题"
        variant="text"
      />
    </template>

    <v-list density="compact" nav slim>
      <v-list-item
        v-for="option in themeOptions"
        :key="option.value"
        :active="currentThemeName === option.value"
        :prepend-icon="option.icon"
        :title="option.title"
        @click="changeTheme(option.value)"
      />
    </v-list>
  </v-menu>
</template>
