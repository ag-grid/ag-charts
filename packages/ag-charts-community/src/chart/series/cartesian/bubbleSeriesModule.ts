import type { SeriesModuleDefinition } from 'ag-charts-core';
import {
    CARTESIAN_AXIS_TYPE,
    CARTESIAN_POSITION,
    ChartAxisDirection,
    FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    LABEL_BOXING_DEFAULTS,
    MULTI_SERIES_HIGHLIGHT_STYLE,
} from 'ag-charts-core';
import type { AgBubbleSeriesOptions, ExtensibleTheme } from 'ag-charts-types';

import type { ModuleContext } from '../../../module/moduleContext';
import { VERSION } from '../../../version';
import { CartesianChartModule } from '../../cartesianChartModule';
import { DEFAULT_FILLS } from '../../themes/defaultColors';
import { BubbleSeries } from './bubbleSeries';
import { bubbleSeriesOptionsDef } from './bubbleSeriesOptionsDef';
import { predictCartesianAxis } from './util';

const themeTemplate: ExtensibleTheme<'bubble'> = {
    series: {
        shape: 'circle',
        size: 7,
        maxSize: 30,
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
            ...LABEL_BOXING_DEFAULTS,
            enabled: false,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'textColor' },
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
        // The colour scale is an enterprise feature. $enterprise resolves the whole colorScale
        // sub-tree: a default divergingColors palette when ag-charts-enterprise is registered,
        // and undefined otherwise — so community resolved options never contain a colorScale
        // from the theme, which lets the enterprise() validator on `colorScale` fire on any
        // user-supplied value without false positives from theme defaults. User-supplied
        // colorScale options replace the entire default object rather than merging element-wise.
        colorScale: {
            $enterprise: [
                {
                    fills: [
                        { color: DEFAULT_FILLS.ORANGE },
                        { color: DEFAULT_FILLS.YELLOW },
                        { color: DEFAULT_FILLS.GREEN },
                    ],
                },
                undefined,
            ],
        },
    },
    gradientLegend: {
        enabled: {
            $some: [
                {
                    $and: [
                        { $path: '/series/$index/colorKey' },
                        { $path: '/series/$index/colorScale/fills/0' },
                        { $not: { $eq: [{ $path: '/series/$index/colorScale/mode' }, 'discrete'] } },
                    ],
                },
                { $path: '/series' },
            ],
        },
    },
};

export const BubbleSeriesModule: SeriesModuleDefinition<AgBubbleSeriesOptions> = {
    type: 'series',
    name: 'bubble',
    chartType: 'cartesian',
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: bubbleSeriesOptionsDef,
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

    create: (ctx: ModuleContext) => new BubbleSeries(ctx),
};
