import { type PluginModuleDefinition, callbackOf, object, string } from 'ag-charts-core';
import type { AgLocaleOptions } from 'ag-charts-types';

import { Locale } from './locale';

export const LocaleModule: PluginModuleDefinition<AgLocaleOptions> = {
    type: 'plugin',
    name: 'locale',

    options: {
        localeText: object,
        getLocaleText: callbackOf(string),
    },

    create: (ctx) => new Locale(ctx),
};
