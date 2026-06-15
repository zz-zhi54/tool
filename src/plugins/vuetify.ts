import "vuetify/styles";

import {
  mdiCodeBraces,
  mdiCodeTags,
  mdiCog,
  mdiDatabase,
  mdiFileTree,
  mdiFormatQuoteClose,
  mdiRefresh,
  mdiRegex,
  mdiViewDashboard,
} from "@mdi/js";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { aliases, mdi } from "vuetify/iconsets/mdi-svg";

const customAliases = {
  codeBraces: mdiCodeBraces,
  codeTags: mdiCodeTags,
  dashboard: mdiViewDashboard,
  database: mdiDatabase,
  fileTree: mdiFileTree,
  json: mdiFormatQuoteClose,
  refresh: mdiRefresh,
  regex: mdiRegex,
  settings: mdiCog,
  yaml: mdiFileTree,
};

const mergedAliases = { ...aliases, ...customAliases };

/**
 * Vuetify 插件实例。
 */
const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: "mdi",
    aliases: mergedAliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: "system",
  },
});

export default vuetify;
