import type { AgSelectionOptions } from 'ag-charts-community';
import { VERSION } from 'ag-charts-community';
import { type PluginModuleDefinition, boolean } from 'ag-charts-core';

import { DataSelection } from './dataSelection';

export const SelectionModule: PluginModuleDefinition<AgSelectionOptions> = {
    type: 'plugin',
    name: 'selection',
    enterprise: true,
    version: VERSION,
    dependencies: [],

    options: {
        enabled: boolean,
        enableClick: boolean,
    },
    themeTemplate: {
        enabled: false,
        enableClick: true,
    },

    create: (ctx) => new DataSelection(ctx),
};
