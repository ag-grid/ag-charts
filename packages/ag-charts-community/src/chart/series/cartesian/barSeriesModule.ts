import type { DynamicContext, SeriesModuleDefinition } from 'ag-charts-core';
import {
    ChartAxisDirection,
    DEFAULT_SHADOW_COLOUR,
    DIRECTION_SWAP_AXES,
    FILL_GRADIENT_LINEAR_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    LABEL_BOXING_TOP_LEVEL_DEFAULTS,
    MULTI_SERIES_HIGHLIGHT_STYLE,
    PLACEMENT_LABEL_BOXING_DEFAULTS,
    SEGMENTATION_DEFAULTS,
    SERIES_SELECTION_THEME,
} from 'ag-charts-core';
import type { AgBarSeriesOptions, ExtensibleTheme } from 'ag-charts-types';

import type { ChartRegistry } from '../../../module/moduleContext';
import { VERSION } from '../../../version';
import { CartesianChartModule } from '../../cartesianChartModule';
import { BarSeries } from './barSeries';
import { barSeriesOptionsDef } from './barSeriesOptionsDef';
import { predictCartesianNonPrimitiveAxis } from './util';

const themeTemplate: ExtensibleTheme<'bar'> = {
    series: {
        direction: 'vertical',
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
        fillOpacity: 1,
        strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
        lineDash: [0],
        lineDashOffset: 0,
        label: {
            ...LABEL_BOXING_TOP_LEVEL_DEFAULTS,
            enabled: false,
            fontWeight: { $ref: 'fontWeight' },
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            insideStyle: {
                color: { $ref: 'chartBackgroundColor' },
                // compatibility with old `padding` property (now named `spacing`).
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
        selection: SERIES_SELECTION_THEME,
        segmentation: SEGMENTATION_DEFAULTS,
    },
};

export const BarSeriesModule: SeriesModuleDefinition<AgBarSeriesOptions> = {
    type: 'series',
    name: 'bar',
    chartType: 'cartesian',
    stackable: true,
    groupable: true,
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: barSeriesOptionsDef,
    predictAxis: predictCartesianNonPrimitiveAxis,
    defaultAxes: DIRECTION_SWAP_AXES,
    axisKeys: { [ChartAxisDirection.X]: 'xKeyAxis', [ChartAxisDirection.Y]: 'yKeyAxis' },
    axisKeysFlipped: { [ChartAxisDirection.X]: 'yKeyAxis', [ChartAxisDirection.Y]: 'xKeyAxis' },
    themeTemplate,

    create: (ctx: DynamicContext<ChartRegistry>) => new BarSeries(ctx),
};
