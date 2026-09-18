import type { DynamicContext, SeriesModuleDefinition } from 'ag-charts-core';
import {
    CARTESIAN_AXIS_TYPE,
    CARTESIAN_POSITION,
    COMMON_SERIES_THEME_DEFAULTS,
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
import type { AgScatterSeriesOptions, ExtensibleSeriesTheme } from 'ag-charts-types';

import type { ChartRegistry } from '../../../module/moduleContext';
import { communityModule } from '../../../module/moduleIdentity';
import { VERSION } from '../../../version';
import { CartesianChartModule } from '../../cartesianChartModule';
import { BUBBLE_SCATTER_COLOR_SCALE_THEME, BUBBLE_SCATTER_GRADIENT_LEGEND_THEME } from './bubbleSeriesModule';
import { ScatterSeries } from './scatterSeries';
import { scatterSeriesOptionsDef } from './scatterSeriesOptionsDef';
import { predictCartesianAxis } from './util';

const themeTemplate: ExtensibleSeriesTheme<'scatter'> = {
    series: {
        ...COMMON_SERIES_THEME_DEFAULTS,
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
        strokeWidth: 1,
        strokeOpacity: 1,
        lineDash: [0],
        lineDashOffset: 0,
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
            placement: 'top',
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
            interaction: { enabled: false },
        },
        highlight: { ...MULTI_SERIES_HIGHLIGHT_STYLE, bringToFront: true },
        selection: SERIES_SELECTION_THEME,
        colorScale: BUBBLE_SCATTER_COLOR_SCALE_THEME,
    },
    gradientLegend: BUBBLE_SCATTER_GRADIENT_LEGEND_THEME,
};

export const ScatterSeriesModule: SeriesModuleDefinition<AgScatterSeriesOptions> = /* #__PURE__ */ communityModule({
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
});
