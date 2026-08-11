import { VERSION } from 'ag-charts-community';
import type { PresetModuleDefinition } from 'ag-charts-core';
import type { AgQuadrantChartOptions } from 'ag-charts-types';

import { createScatterQuadrant } from './scatterQuadrantPreset';
import { scatterQuadrantOptionsDefs } from './scatterQuadrantPresetOptionsDefs';

export const ScatterQuadrantPresetModule: PresetModuleDefinition<AgQuadrantChartOptions> = {
    type: 'preset',
    name: 'scatter-quadrant',
    enterprise: true,
    dependencies: [],
    version: VERSION,

    options: scatterQuadrantOptionsDefs,

    create: createScatterQuadrant,

    themeTemplate: {},
};
