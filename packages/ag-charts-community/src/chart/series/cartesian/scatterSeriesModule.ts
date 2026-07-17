import type { DynamicContext, SeriesModuleDefinition } from 'ag-charts-core';
import {
    CARTESIAN_AXIS_TYPE,
    CARTESIAN_POSITION,
    ChartAxisDirection,
    FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    LABEL_BOXING_TOP_LEVEL_DEFAULTS,
    MULTI_SERIES_HIGHLIGHT_STYLE,
    SERIES_SELECTION_THEME,
    undocumentedThemeOptions,
} from 'ag-charts-core';
import type { AgScatterSeriesOptions, ExtensibleTheme } from 'ag-charts-types';

import type { ChartRegistry } from '../../../module/moduleContext';
import { VERSION } from '../../../version';
import { CartesianChartModule } from '../../cartesianChartModule';
import { BUBBLE_SCATTER_COLOR_SCALE_THEME, BUBBLE_SCATTER_GRADIENT_LEGEND_THEME } from './bubbleSeriesModule';
import { ScatterSeries } from './scatterSeries';
import { scatterSeriesOptionsDef } from './scatterSeriesOptionsDef';
import { predictCartesianAxis } from './util';

const themeTemplate: ExtensibleTheme<'scatter'> = {
    series: {
        shape: 'circle',
        size: 7,
        fill: {
            $applySwitch: [
                { $path: 'type' },
                { $palette: 'fill' },
                ['gradient', FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS],
                ['image', FILL_IMAGE_DEFAULTS],
                ['pattern', FILL_PATTERN_DEFAULTS],
            ],
        },
        stroke: { $palette: 'stroke' },
        fillOpacity: 0.8,
        maxRenderedItems: 2000,
        label: {
            ...LABEL_BOXING_TOP_LEVEL_DEFAULTS,
            enabled: false,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            padding: 8,
            insideStyle: { color: { $isUserOption: ['../color', { $path: '../color' }, { $ref: 'textColor' }] } },
            outsideStyle: { color: { $isUserOption: ['../color', { $path: '../color' }, { $ref: 'textColor' }] } },
            ...undocumentedThemeOptions({ collisionAvoidance: { enabled: true } }),
        },
        tooltip: {
            range: {
                $if: [
                    { $eq: [{ $path: ['/tooltip/range', 'nearest'] }, 'area'] },
                    'nearest',
                    { $path: ['/tooltip/range', 'nearest'] },
                ],
            },
            position: {
                anchorTo: { $path: ['/tooltip/position/anchorTo', 'node'] },
            },
        },
        highlight: MULTI_SERIES_HIGHLIGHT_STYLE,
        selection: SERIES_SELECTION_THEME,
        colorScale: BUBBLE_SCATTER_COLOR_SCALE_THEME,
    },
    gradientLegend: BUBBLE_SCATTER_GRADIENT_LEGEND_THEME,
};

export const ScatterSeriesModule: SeriesModuleDefinition<AgScatterSeriesOptions> = {
    type: 'series',
    name: 'scatter',
    chartType: 'cartesian',
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: scatterSeriesOptionsDef,
    predictAxis: predictCartesianAxis,
    defaultAxes: {
        x: {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: CARTESIAN_POSITION.BOTTOM,
        },
        y: {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: CARTESIAN_POSITION.LEFT,
        },
    },
    axisKeys: { [ChartAxisDirection.X]: 'xKeyAxis', [ChartAxisDirection.Y]: 'yKeyAxis' },
    themeTemplate,

    create: (ctx: DynamicContext<ChartRegistry>) => new ScatterSeries(ctx),
};
