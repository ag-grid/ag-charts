import { type PluginModuleDefinition, callbackOf, object, string } from 'ag-charts-core';
import type { AgLocaleOptions } from 'ag-charts-types';

import { communityModule } from '../module/moduleIdentity';
import { VERSION } from '../version';
import { Locale } from './locale';

export const LocaleModule: PluginModuleDefinition<AgLocaleOptions> = /* #__PURE__ */ communityModule({
    type: 'plugin',
    name: 'locale',
    version: VERSION,

    options: {
        localeText: object,
        getLocaleText: callbackOf(string),
    },

    create: (ctx) => new Locale(ctx),
});
