import type { AgChartSelectionOptions, AgSelectionClickMode, _ModuleSupport } from 'ag-charts-community';
import { VERSION } from 'ag-charts-community';
import { type PluginModuleDefinition, boolean, selectionContainmentValidator, strictUnion } from 'ag-charts-core';

import { DataSelection } from './dataSelection';
import { DataSelectionServiceImp } from './dataSelectionServiceImp';

export const SelectionModule: PluginModuleDefinition<AgChartSelectionOptions, _ModuleSupport.ChartRegistry> = {
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
    register: (ctx) => {
        if (ctx.has('dataSelectionService')) return;
        ctx.service('dataSelectionService', () => new DataSelectionServiceImp());
    },
};
