import { type AgChordSeriesOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { StandaloneChartModule } from '../../charts/standaloneChartModule';
import { ChordSeries } from './chordSeries';
import { chordSeriesOptionsDef } from './chordSeriesOptionsDef';

export const ChordSeriesModule: SeriesModuleDefinition<AgChordSeriesOptions> = {
    type: 'series',
    name: 'chord',
    chartType: 'standalone',
    enterprise: true,
    solo: true,
    version: VERSION,
    dependencies: [StandaloneChartModule],

    options: chordSeriesOptionsDef,
    themeTemplate: {
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
            highlight: _ModuleSupport.singleSeriesHighlightStyle(),
            label: {
                ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
                enabled: true,
                fontFamily: { $ref: 'fontFamily' },
                fontSize: { $ref: 'fontSize' },
                fontWeight: { $ref: 'fontWeight' },
                color: { $ref: 'textColor' },
                spacing: 5,
                maxWidth: 100,
            },
            node: {
                spacing: 8,
                width: 10,
                strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
            },
            link: {
                fillOpacity: 0.5,
                strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
                tension: 0.4,
            },
        },
        legend: {
            enabled: false,
            toggleSeries: false,
        },
    },

    create: (ctx) => new ChordSeries(ctx),
};
