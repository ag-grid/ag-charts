import type { AgChartSelectionOptions, AgSelectionClickMode } from 'ag-charts-community';
import { VERSION } from 'ag-charts-community';
import { type PluginModuleDefinition, boolean, selectionContainmentValidator, strictUnion } from 'ag-charts-core';

import { DataSelection } from './dataSelection';

export const SelectionModule: PluginModuleDefinition<AgChartSelectionOptions> = {
    type: 'plugin',
    name: 'selection',
    enterprise: true,
    version: VERSION,
    dependencies: [],

    options: {
        enabled: boolean,
        enableClick: boolean,
        enableDrag: boolean,
        enableClickAwayToClear: boolean,
        clickMode: strictUnion<AgSelectionClickMode>()('single', 'multiple'),
        containment: selectionContainmentValidator,
    },
    themeTemplate: {
        enabled: false,
        enableClick: true,
        enableDrag: false,
        enableClickAwayToClear: true,
        clickMode: 'single',
        containment: 'any',
    },

    create: (ctx) => new DataSelection(ctx),
};
