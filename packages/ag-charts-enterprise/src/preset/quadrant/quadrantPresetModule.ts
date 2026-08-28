import { VERSION } from 'ag-charts-community';
import type { PresetModuleDefinition } from 'ag-charts-core';
import type { AgQuadrantChartOptions, ExtensibleSeriesTheme } from 'ag-charts-types';

import {
    backgroundRegionStyle,
    backgroundRegionsTheme,
} from '../../features/background-regions/backgroundRegionsTheme';
import { createQuadrant } from './quadrantPreset';
import { quadrantOptionsDefs } from './quadrantPresetOptionsDefs';

const sharedThemeTemplate: ExtensibleSeriesTheme<'bubble' | 'scatter'> = {
    axes: {
        number: {
            line: { enabled: true, width: 1, stroke: { $foregroundBackgroundMix: 0.5 } },
            tick: { enabled: false },
        },
    },
    seriesArea: {
        backgroundRegions: {
            // Manually compose the background regions theme since `$apply` does not compose on top of itself well.
            $apply: [
                {
                    ...backgroundRegionStyle,
                    fill: { $palette: 'fill' },
                    fillOpacity: 0.3,
                    stroke: { $palette: 'stroke' },
                    label: { ...backgroundRegionStyle.label, fontWeight: 'bold' },
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

    // These colours are derived from the region by default. A user-provided value can not be differentiated from the
    // scatter/bubble theme default colours, so that theme default must be removed to allow it to be replaced by the
    // region-derived colours.
    removeThemeSeriesKeys: ['fill', 'stroke'],
};
