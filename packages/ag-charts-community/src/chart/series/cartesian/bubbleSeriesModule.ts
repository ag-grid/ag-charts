import type { DynamicContext, SeriesModuleDefinition } from 'ag-charts-core';
import {
    CARTESIAN_AXIS_TYPE,
    CARTESIAN_POSITION,
    ChartAxisDirection,
    FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    LABEL_BOXING_TOP_LEVEL_DEFAULTS,
    LABEL_OVERFLOW_DEFAULTS,
    LABEL_PLACEMENT_STYLE_DEFAULTS,
    MULTI_SERIES_HIGHLIGHT_STYLE,
    SERIES_SELECTION_THEME,
    undocumentedThemeOptions,
} from 'ag-charts-core';
import type {
    AgBubbleSeriesOptions,
    AgColorScale,
    AgGradientLegendOptions,
    ExtensibleSeriesTheme,
    Operation,
    WithThemeParams,
} from 'ag-charts-types';

import type { ChartRegistry } from '../../../module/moduleContext';
import { VERSION } from '../../../version';
import { CartesianChartModule } from '../../cartesianChartModule';
import { BubbleSeries } from './bubbleSeries';
import { bubbleSeriesOptionsDef } from './bubbleSeriesOptionsDef';
import { predictCartesianAxis } from './util';

// Shared with scatter. The $if/$isPackageType pair resolves colorScale to a palette only under
// enterprise, so the `colorScale` enterprise() validator never fires on a community theme default.
export const BUBBLE_SCATTER_COLOR_SCALE_THEME: Operation | WithThemeParams<AgColorScale> = {
    fills: {
        $if: [
            { $isPackageType: 'enterprise' },
            { $map: [{ color: { $value: '$1' } }, { $palette: 'divergingColors' }] },
            undefined,
        ],
    },
};

// Gradient legend enables automatically for any series that supplies `colorKey` together with
// a non-discrete `colorScale.fills` entry.
export const BUBBLE_SCATTER_GRADIENT_LEGEND_THEME: WithThemeParams<AgGradientLegendOptions> = {
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
};

const themeTemplate: ExtensibleSeriesTheme<'bubble'> = {
    series: {
        shape: 'circle',
        minSize: 7,
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
            ...LABEL_BOXING_TOP_LEVEL_DEFAULTS,
            ...LABEL_OVERFLOW_DEFAULTS,
            enabled: false,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            padding: 8,
            insideStyle: LABEL_PLACEMENT_STYLE_DEFAULTS('chartBackgroundColor'),
            outsideStyle: LABEL_PLACEMENT_STYLE_DEFAULTS('textColor'),
            collision: { alwaysShow: false, ...undocumentedThemeOptions({ collideWith: { seriesArea: false } }) },
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

    create: (ctx: DynamicContext<ChartRegistry>) => new BubbleSeries(ctx),
};
