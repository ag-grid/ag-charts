import { type AgTreemapSeriesOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';
import { FONT_SIZE_RATIO } from 'ag-charts-core';

import { StandaloneChartModule } from '../../charts/standaloneChartModule';
import { TreemapSeries } from './treemapSeries';
import { treemapSeriesOptionsDef } from './treemapSeriesOptionsDef';

const {} = _ModuleSupport;

export const TreemapSeriesModule: SeriesModuleDefinition<AgTreemapSeriesOptions> = {
    type: 'series',
    name: 'treemap',
    chartType: 'standalone',
    enterprise: true,
    solo: true,
    version: VERSION,
    dependencies: [StandaloneChartModule],

    options: treemapSeriesOptionsDef,
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
            colorRange: { $palette: 'divergingColors' },
            undocumentedGroupFills: { $palette: 'hierarchyColors' },
            undocumentedGroupStrokes: { $palette: 'secondHierarchyColors' },
            group: {
                label: {
                    ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
                    enabled: true,
                    color: { $ref: 'textColor' },
                    fontStyle: undefined,
                    fontWeight: { $ref: 'fontWeight' },
                    fontSize: { $ref: 'fontSize' },
                    fontFamily: { $ref: 'fontFamily' },
                    spacing: 4,
                },
                fill: undefined, // Override default fill
                stroke: undefined, // Override default stroke
                strokeWidth: 1,
                padding: 4,
                gap: 2,
                textAlign: 'left',
                highlight: {
                    unhighlightedItem: {
                        opacity: 0.2,
                        fillOpacity: 0.2,
                        strokeOpacity: 0.2,
                    },
                },
            },
            tile: {
                label: {
                    ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
                    enabled: true,
                    color: { $ref: 'chartBackgroundColor' },
                    fontStyle: undefined,
                    fontWeight: { $ref: 'fontWeight' },
                    fontSize: { $rem: 1.5 },
                    minimumFontSize: { $rem: FONT_SIZE_RATIO.SMALLER },
                    fontFamily: { $ref: 'fontFamily' },
                    wrapping: 'on-space',
                    overflowStrategy: 'ellipsis',
                    spacing: 2,
                },
                secondaryLabel: {
                    ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
                    enabled: true,
                    color: { $ref: 'chartBackgroundColor' },
                    fontStyle: undefined,
                    fontWeight: undefined,
                    fontSize: { $ref: 'fontSize' },
                    minimumFontSize: { $rem: FONT_SIZE_RATIO.SMALLER },
                    fontFamily: { $ref: 'fontFamily' },
                    wrapping: 'never',
                    overflowStrategy: 'ellipsis',
                },
                fill: undefined, // Override default fill
                stroke: undefined, // Override default stroke
                strokeWidth: { $isUserOption: ['../strokes/0', 2, { $isUserOption: ['./stroke', 2, 0] }] },
                padding: 3,
                gap: 1,
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
        },
        gradientLegend: {
            enabled: { $if: [{ $path: '../series/0/colorKey' }, true, false] },
        },
    },

    create: (ctx: _ModuleSupport.ModuleContext) => new TreemapSeries(ctx),
};
