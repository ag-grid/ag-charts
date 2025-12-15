import { type AgSankeySeriesOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { StandaloneChartModule } from '../../charts/standaloneChartModule';
import { SankeySeries } from './sankeySeries';
import { sankeySeriesOptionsDef } from './sankeySeriesOptionsDef';

export const SankeySeriesModule: SeriesModuleDefinition<AgSankeySeriesOptions> = {
    type: 'series',
    name: 'sankey',
    chartType: 'standalone',
    enterprise: true,
    solo: true,
    version: VERSION,
    dependencies: [StandaloneChartModule],

    options: sankeySeriesOptionsDef,
    themeTemplate: {
        seriesArea: {
            padding: {
                top: 10,
                bottom: 10,
            },
        },
        series: {
            fills: {
                $applyCycle: [
                    { $size: { $path: ['./data', { $path: '/data' }] } },
                    { $palette: 'fills' },
                    {
                        $applySwitch: [
                            { $path: ['/type', undefined, { $value: '$1' }] },
                            { $value: '$1' },
                            ['gradient', _ModuleSupport.FILL_GRADIENT_LINEAR_DEFAULTS],
                            ['pattern', _ModuleSupport.FILL_PATTERN_DEFAULTS],
                            ['image', _ModuleSupport.FILL_IMAGE_DEFAULTS],
                        ],
                    },
                ],
            },
            strokes: {
                $applyCycle: [{ $size: { $path: ['./data', { $path: '/data' }] } }, { $palette: 'strokes' }],
            },
            highlightStyle: {
                series: {
                    dimOpacity: 0.2,
                },
            },
            highlight: {
                unhighlightedItem: {
                    opacity: 0.5,
                },
            },
            label: {
                ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
                enabled: true,
                fontFamily: { $ref: 'fontFamily' },
                fontSize: { $ref: 'fontSize' },
                fontWeight: { $ref: 'fontWeight' },
                color: { $ref: 'textColor' },
                spacing: 10,
            },
            node: {
                spacing: { $if: [{ $greaterThan: [{ $path: './minSpacing' }, 20] }, { $path: './minSpacing' }, 20] },
                minSpacing: 0,
                width: 10,
                strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
            },
            link: {
                fillOpacity: 0.5,
                strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
            },
        },
        legend: {
            enabled: false,
            toggleSeries: false,
        },
    },

    create: (ctx: _ModuleSupport.ModuleContext) => new SankeySeries(ctx),
};
