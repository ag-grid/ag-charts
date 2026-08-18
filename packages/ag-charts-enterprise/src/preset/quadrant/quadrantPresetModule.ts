import { VERSION } from 'ag-charts-community';
import type { PresetModuleDefinition } from 'ag-charts-core';
import type { AgQuadrantChartOptions, ExtensibleSeriesTheme } from 'ag-charts-types';

import { backgroundRegionsTheme } from '../../features/background-regions/backgroundRegionsTheme';
import { createQuadrant } from './quadrantPreset';
import { quadrantOptionsDefs } from './quadrantPresetOptionsDefs';

const sharedThemeTemplate: ExtensibleSeriesTheme<'bubble' | 'scatter'> = {
    axes: {
        number: {
            label: { enabled: false },
            line: { enabled: true, width: 2 },
            tick: { enabled: false },
            // TODO: ignore required `value`
            // crossAt: {
            //     titlePlacement: 'edge',
            //     labelPlacement: 'crossing',
            // },
        },
    },
    seriesArea: {
        backgroundRegions: {
            // Manually compose the background regions theme since `$apply` does not compose on top of itself well.
            $apply: [
                {
                    ...backgroundRegionsTheme.$apply[0],
                    fill: { $palette: 'fill' },
                    fillOpacity: 0.3,
                    label: {
                        ...backgroundRegionsTheme.$apply[0]!.label,
                        position: 'inside',
                    },
                },
                backgroundRegionsTheme.$apply[1],
                backgroundRegionsTheme.$apply[2],
            ],
        },
    },
    series: {
        fillOpacity: 1,
    },
};

export const QuadrantPresetModule: PresetModuleDefinition<AgQuadrantChartOptions> = {
    type: 'preset',
    name: 'quadrant',
    enterprise: true,
    dependencies: [],
    version: VERSION,

    options: quadrantOptionsDefs,

    create: createQuadrant,

    themeTemplate: {
        scatter: sharedThemeTemplate,
        bubble: sharedThemeTemplate,
    },
};
