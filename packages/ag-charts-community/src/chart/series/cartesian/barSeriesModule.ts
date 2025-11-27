import type { SeriesModuleDefinition } from 'ag-charts-core';
import type { AgBarSeriesOptions, ExtensibleTheme } from 'ag-charts-types';

import type { ModuleContext } from '../../../module/moduleContext';
import { VERSION } from '../../../version';
import { CartesianChartModule } from '../../cartesianChartModule';
import { ChartAxisDirection } from '../../chartAxisDirection';
import { DEFAULT_SHADOW_COLOUR } from '../../themes/symbols';
import {
    DIRECTION_SWAP_AXES,
    FILL_GRADIENT_LINEAR_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    LABEL_BOXING_DEFAULTS,
    SEGMENTATION_DEFAULTS,
    multiSeriesHighlightStyle,
} from '../../themes/util';
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
            ...LABEL_BOXING_DEFAULTS,
            padding: { $isUserOption: ['./spacing', 0, 8] } as any, // compatibility with old `padding` property (now named `spacing`).
            enabled: false,
            fontWeight: { $ref: 'fontWeight' },
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            color: {
                $if: [
                    {
                        $or: [
                            { $eq: [{ $path: './placement' }, 'outside-start'] },
                            { $eq: [{ $path: './placement' }, 'outside-end'] },
                        ],
                    },
                    { $ref: 'textColor' },
                    { $ref: 'chartBackgroundColor' },
                ],
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
        highlight: multiSeriesHighlightStyle(),
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
    axisValueKeys: { [ChartAxisDirection.X]: 'xKey', [ChartAxisDirection.Y]: 'yKey' },
    themeTemplate,

    create: (ctx: ModuleContext) => new BarSeries(ctx),
};
