import { type AgSunburstSeriesOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';
import { FONT_SIZE_RATIO } from 'ag-charts-core';
import type { ExtensibleTheme } from 'ag-charts-types';

import { StandaloneChartModule } from '../../charts/standaloneChartModule';
import { SunburstSeries } from './sunburstSeries';
import { sunburstSeriesOptionsDef } from './sunburstSeriesOptionsDef';

const { BASE_FONT_SIZE } = _ModuleSupport;

const themeTemplate: ExtensibleTheme<'sunburst'> = {
    series: {
        fills: {
            $applyCycle: [
                { $size: { $path: ['./data', { $path: '/data' }] } },
                { $palette: 'fills' },
                {
                    $applySwitch: [
                        { $path: ['/type', undefined, { $value: '$1' }] },
                        { $value: '$1' },
                        ['gradient', _ModuleSupport.FILL_GRADIENT_RADIAL_REVERSED_SERIES_DEFAULTS],
                        ['pattern', _ModuleSupport.FILL_PATTERN_DEFAULTS],
                        ['image', _ModuleSupport.FILL_IMAGE_DEFAULTS],
                    ],
                },
            ],
        } as any,
        strokes: {
            $applyCycle: [{ $size: { $path: ['./data', { $path: '/data' }] } }, { $palette: 'strokes' }],
        } as any,
        colorRange: { $palette: 'divergingColors' },
        strokeWidth: { $isUserOption: ['./strokes/0', 2, 0] },
        label: {
            ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
            fontFamily: { $ref: 'fontFamily' },
            fontSize: { $rem: FONT_SIZE_RATIO.LARGE },
            minimumFontSize: { $rem: 9 / BASE_FONT_SIZE },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'chartBackgroundColor' },
            overflowStrategy: 'ellipsis',
            wrapping: 'never',
            spacing: 2,
        },
        secondaryLabel: {
            ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
            fontFamily: { $ref: 'fontFamily' },
            fontSize: { $rem: FONT_SIZE_RATIO.SMALLEST },
            minimumFontSize: { $rem: 7 / BASE_FONT_SIZE },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'chartBackgroundColor' },
            overflowStrategy: 'ellipsis',
            wrapping: 'never',
        },
        sectorSpacing: 2,
        padding: 3,
        highlight: {
            unhighlightedItem: {
                fillOpacity: 0.6,
                strokeOpacity: 0.6,
            },
            unhighlightedBranch: {
                fillOpacity: 0.2,
                strokeOpacity: 0.2,
            },
        },
    },
    gradientLegend: {
        enabled: true,
    },
};

export const SunburstSeriesModule: SeriesModuleDefinition<AgSunburstSeriesOptions> = {
    type: 'series',
    name: 'sunburst',
    chartType: 'standalone',
    enterprise: true,
    solo: true,
    version: VERSION,
    dependencies: [StandaloneChartModule],

    options: sunburstSeriesOptionsDef,
    themeTemplate,

    create: (ctx: _ModuleSupport.ModuleContext) => new SunburstSeries(ctx),
};
