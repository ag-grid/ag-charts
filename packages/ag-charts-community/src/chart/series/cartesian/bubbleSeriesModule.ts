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
    SERIES_SELECTION_THEME,
} from 'ag-charts-core';
import type {
    AgBubbleSeriesOptions,
    AgColorScale,
    AgGradientLegendOptions,
    ExtensibleTheme,
    Operation,
    WithThemeParams,
} from 'ag-charts-types';

import type { ModuleContext } from '../../../module/moduleContext';
import { VERSION } from '../../../version';
import { CartesianChartModule } from '../../cartesianChartModule';
import { DEFAULT_FILLS } from '../../themes/defaultColors';
import { BubbleSeries } from './bubbleSeries';
import { bubbleSeriesOptionsDef } from './bubbleSeriesOptionsDef';
import { predictCartesianAxis } from './util';

// Shared theme fragments used by scatter as well. The colour scale is an enterprise feature:
// the $if/$isPackageType pair resolves the whole colorScale sub-tree to a default divergingColors
// palette when ag-charts-enterprise is registered, and undefined otherwise. Community resolved
// options therefore never contain a colorScale from the theme, which lets the enterprise()
// validator on `colorScale` fire on any user-supplied value without false positives from theme
// defaults.
//
// Caveat — and why BUBBLE_SCATTER_COLOR_RANGE_THEME exists alongside this: the options graph
// treats a user-supplied partial like `colorScale: {}` as having set every descendant path
// (via CHILDREN_SOURCE_EDGE propagation in OptionsGraph.hasUserOption). That wipes the `fills`
// default below wholesale rather than merging element-wise, so a user who writes
// `colorScale: {}` ends up with an empty `fills` array. We can't gate the leaf with
// `$isUserOption` because the same propagation makes it report "user-supplied" for every
// descendant path, and moving the default down to the `fills` leaf triggers element-wise array
// merging against user-supplied `fills` (producing hybrid arrays neither side asked for). Hence
// the secondary palette source on `colorRange` — see BUBBLE_SCATTER_COLOR_RANGE_THEME.
export const BUBBLE_SCATTER_COLOR_SCALE_THEME: Operation | WithThemeParams<AgColorScale> = {
    $if: [
        { $isPackageType: 'enterprise' },
        {
            fills: [{ color: DEFAULT_FILLS.ORANGE }, { color: DEFAULT_FILLS.YELLOW }, { color: DEFAULT_FILLS.GREEN }],
        },
        undefined,
    ],
};

// Palette source for the fallback range that BubbleSeries.processData passes to
// configureColorScale when the resolved `colorScale.fills` is empty. Lives on a separate option
// (`colorRange`, undocumented) rather than the `colorScale` sub-tree so a user-supplied partial
// `colorScale: {}` can't wipe it — the user's object only touches the `colorScale` branch of
// the options graph, leaving `colorRange` to provide the default palette. Gated on enterprise
// so the enterprise() validator on `colorRange` doesn't fire on a theme-injected value in
// community bundles. Mirrors heatmap's `colorRange` mechanism — same problem, same shape.
export const BUBBLE_SCATTER_COLOR_RANGE_THEME: Operation | WithThemeParams<string[]> = {
    $if: [{ $isPackageType: 'enterprise' }, { $palette: 'divergingColors' }, undefined],
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
        selection: SERIES_SELECTION_THEME,
        colorScale: BUBBLE_SCATTER_COLOR_SCALE_THEME,
    },
    gradientLegend: BUBBLE_SCATTER_GRADIENT_LEGEND_THEME,
};

// `colorRange` is undocumented, so it isn't part of AgBubbleSeriesThemeableOptions and can't be
// expressed inside the `ExtensibleTheme<'bubble'>` literal above. Attaching it after the fact
// with @ts-expect-error matches the same pattern heatmap uses in its themes (heatmapThemes.ts).
// @ts-expect-error undocumented option
themeTemplate.series.colorRange = BUBBLE_SCATTER_COLOR_RANGE_THEME;

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
