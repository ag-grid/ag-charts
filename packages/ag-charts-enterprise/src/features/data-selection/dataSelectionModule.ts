import type { AgSelectionClickMode, AgSelectionOptions } from 'ag-charts-community';
import { VERSION } from 'ag-charts-community';
import { type PluginModuleDefinition, boolean, strictUnion } from 'ag-charts-core';

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
        clickMode: strictUnion<AgSelectionClickMode>()('single', 'multiple'),
    },
    themeTemplate: {
        enabled: false,
        enableClick: true,
        clickMode: 'single',
    },

    create: (ctx) => new DataSelection(ctx),
};
