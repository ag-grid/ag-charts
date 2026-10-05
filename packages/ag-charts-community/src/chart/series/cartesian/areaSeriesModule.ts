import type { DynamicContext, SeriesModuleDefinition } from 'ag-charts-core';
import {
    CARTESIAN_AXIS_TYPE,
    CARTESIAN_POSITION,
    COMMON_SERIES_THEME_DEFAULTS,
    ChartAxisDirection,
    FILL_GRADIENT_LINEAR_DEFAULTS,
    FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    FONT_THEME_DEFAULTS,
    LABEL_BOXING_TOP_LEVEL_DEFAULTS,
    LABEL_OVERFLOW_ALWAYS_SHOW,
    LABEL_OVERFLOW_DEFAULTS,
    LABEL_PLACEMENT_STYLE_DEFAULTS,
    MARKER_SERIES_HIGHLIGHT_STYLE,
    NEAREST_TOOLTIP_THEME,
    SEGMENTATION_DEFAULTS,
    SERIES_SELECTION_THEME,
    SHADOW_THEME_DEFAULTS,
    STROKE_STYLE_THEME_DEFAULTS,
    fillThemeTemplate,
    interpolationThemeTemplate,
} from 'ag-charts-core';
import type { AgAreaSeriesOptions, ExtensibleSeriesTheme } from 'ag-charts-types';

import type { ChartRegistry } from '../../../module/moduleContext';
import { communityModule } from '../../../module/moduleIdentity';
import { VERSION } from '../../../version';
import { CartesianChartModule } from '../../cartesianChartModule';
import { AreaSeries } from './areaSeries';
import { areaSeriesOptionsDef } from './areaSeriesOptionsDef';
import { predictCartesianNonPrimitiveAxis } from './util';

const themeTemplate: ExtensibleSeriesTheme<'area'> = {
    series: {
        ...COMMON_SERIES_THEME_DEFAULTS,
        nodeClickRange: { $if: [{ $path: '/selection/enabled' }, 10, 'nearest'] },
        fill: fillThemeTemplate(FILL_GRADIENT_LINEAR_DEFAULTS),
        stroke: { $palette: 'stroke' },
        fillOpacity: 0.8,
        ...STROKE_STYLE_THEME_DEFAULTS,
        strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
        shadow: SHADOW_THEME_DEFAULTS,
        connectMissingData: false,
        interpolation: interpolationThemeTemplate(),
        marker: {
            enabled: false,
            shadow: SHADOW_THEME_DEFAULTS,
            shape: 'circle',
            size: 7,
            fillOpacity: 1,
            ...STROKE_STYLE_THEME_DEFAULTS,
            strokeWidth: { $isUserOption: ['./stroke', 1, 0] },
            fill: {
                $applySwitch: [
                    { $path: 'type' },
                    { $palette: 'fill' },
                    ['gradient', FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS],
                    ['pattern', FILL_PATTERN_DEFAULTS],
                ],
            },
            stroke: { $palette: 'stroke' },
        },
        label: {
            ...LABEL_BOXING_TOP_LEVEL_DEFAULTS,
            ...LABEL_OVERFLOW_DEFAULTS,
            enabled: false,
            ...FONT_THEME_DEFAULTS,
            padding: 8,
            collision: { alwaysShow: LABEL_OVERFLOW_ALWAYS_SHOW },
            insideStyle: LABEL_PLACEMENT_STYLE_DEFAULTS('chartBackgroundColor'),
            outsideStyle: LABEL_PLACEMENT_STYLE_DEFAULTS('textColor'),
            placement: 'top',
        },
        tooltip: {
            ...NEAREST_TOOLTIP_THEME,
            position: {
                anchorTo: { $path: ['/tooltip/position/anchorTo', 'node'] },
            },
        },
        highlight: { ...MARKER_SERIES_HIGHLIGHT_STYLE, bringToFront: true },
        selection: SERIES_SELECTION_THEME,
        segmentation: SEGMENTATION_DEFAULTS,
    },
};

export const AreaSeriesModule: SeriesModuleDefinition<AgAreaSeriesOptions> = /* #__PURE__ */ communityModule({
    type: 'series',
    name: 'area',
    chartType: 'cartesian',
    stackable: true,
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: areaSeriesOptionsDef,
    predictAxis: predictCartesianNonPrimitiveAxis,
    defaultAxes: {
        y: {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: CARTESIAN_POSITION.LEFT,
        },
        x: {
            type: CARTESIAN_AXIS_TYPE.CATEGORY,
            position: CARTESIAN_POSITION.BOTTOM,
        },
    },
    axisKeys: { [ChartAxisDirection.X]: 'xKeyAxis', [ChartAxisDirection.Y]: 'yKeyAxis' },
    themeTemplate,

    create: (ctx: DynamicContext<ChartRegistry>) => new AreaSeries(ctx),
});
