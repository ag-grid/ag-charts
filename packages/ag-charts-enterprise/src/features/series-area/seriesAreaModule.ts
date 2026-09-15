import { VERSION, _ModuleSupport } from 'ag-charts-community';
import { type PluginModuleDefinition, arrayOfDefs, fillOptionsDef, strokeOptionsDef } from 'ag-charts-core';
import type { AgSeriesAreaBackgroundRegion } from 'ag-charts-types';

import { backgroundRegionsTheme } from '../background-regions/backgroundRegionsTheme';
import { SeriesArea } from './seriesArea';

const { seriesAreaBackgroundRegionLabelDef, seriesAreaBackgroundRegionRangeDef } = _ModuleSupport;

export const SeriesAreaModule: PluginModuleDefinition<never> = {
    type: 'plugin',
    name: 'series-area',
    enterprise: true,
    version: VERSION,
    contributes: [
        {
            path: 'seriesArea.backgroundRegions',
            chartTypes: ['cartesian'],
            options: arrayOfDefs<AgSeriesAreaBackgroundRegion>({
                ...fillOptionsDef,
                ...strokeOptionsDef,
                xRange: seriesAreaBackgroundRegionRangeDef,
                yRange: seriesAreaBackgroundRegionRangeDef,
                label: seriesAreaBackgroundRegionLabelDef,
            }),
            themeTemplate: backgroundRegionsTheme,
        },
    ],
    create: (ctx) => new SeriesArea(ctx),
};
