import type { DynamicContext, SeriesModuleDefinition } from 'ag-charts-core';
import {
    CARTESIAN_AXIS_TYPE,
    CARTESIAN_POSITION,
    ChartAxisDirection,
    DEFAULT_SHADOW_COLOUR,
    FILL_GRADIENT_LINEAR_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    LABEL_BOXING_TOP_LEVEL_DEFAULTS,
    MULTI_SERIES_HIGHLIGHT_STYLE,
    PLACEMENT_LABEL_BOXING_DEFAULTS,
} from 'ag-charts-core';
import type { AgHistogramSeriesOptions, ExtensibleTheme } from 'ag-charts-types';

import type { ChartRegistry } from '../../../module/moduleContext';
import { VERSION } from '../../../version';
import { CartesianChartModule } from '../../cartesianChartModule';
import { HistogramSeries } from './histogramSeries';
import { histogramSeriesOptionsDef } from './histogramSeriesOptionsDef';
import { predictCartesianNonPrimitiveAxis } from './util';

const themeTemplate: ExtensibleTheme<'histogram'> = {
    series: {
        fill: {
            $applySwitch: [
                { $path: 'type' },
                { $palette: 'fill' },
                ['gradient', FILL_GRADIENT_LINEAR_DEFAULTS],
                ['image', FILL_IMAGE_DEFAULTS],
                ['pattern', FILL_PATTERN_DEFAULTS],
            ],
        },
        stroke: { $palette: 'stroke' },
        strokeWidth: 1,
        fillOpacity: 1,
        strokeOpacity: 1,
        lineDash: [0],
        lineDashOffset: 0,
        label: {
            ...LABEL_BOXING_TOP_LEVEL_DEFAULTS,
            enabled: false,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            insideStyle: {
                color: { $ref: 'chartBackgroundColor' },
                // Default 8px gap between the bar and edge-anchored labels; a user-set `spacing` replaces it.
                padding: { $isUserOption: ['../spacing', 0, 8] } as any,
                ...PLACEMENT_LABEL_BOXING_DEFAULTS,
            },
            outsideStyle: {
                color: { $ref: 'textColor' },
                padding: { $isUserOption: ['../spacing', 0, 8] } as any,
                ...PLACEMENT_LABEL_BOXING_DEFAULTS,
            },
            placement: 'inside-center',
        },
        shadow: {
            enabled: false,
            color: DEFAULT_SHADOW_COLOUR,
            xOffset: 3,
            yOffset: 3,
            blur: 5,
        },
        highlight: MULTI_SERIES_HIGHLIGHT_STYLE,
    },
};

export const HistogramSeriesModule: SeriesModuleDefinition<AgHistogramSeriesOptions> = {
    type: 'series',
    name: 'histogram',
    chartType: 'cartesian',
    // enterprise: true,
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: histogramSeriesOptionsDef,
    predictAxis: predictCartesianNonPrimitiveAxis,
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

    create: (ctx: DynamicContext<ChartRegistry>) => new HistogramSeries(ctx),
};
