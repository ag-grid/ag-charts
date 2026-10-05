import type { DynamicContext, SeriesModuleDefinition } from 'ag-charts-core';
import {
    BAR_LABEL_COLLISION_THEME,
    CARTESIAN_AXIS_TYPE,
    CARTESIAN_POSITION,
    COMMON_SERIES_THEME_DEFAULTS,
    ChartAxisDirection,
    FILL_GRADIENT_LINEAR_DEFAULTS,
    LABEL_BOXING_TOP_LEVEL_DEFAULTS,
    LABEL_OVERFLOW_DEFAULTS,
    LABEL_PLACEMENT_STYLE_DEFAULTS,
    MULTI_SERIES_HIGHLIGHT_STYLE,
    SHADOW_THEME_DEFAULTS,
    STROKE_STYLE_THEME_DEFAULTS,
    fillThemeTemplate,
} from 'ag-charts-core';
import type { AgHistogramSeriesOptions, ExtensibleSeriesTheme } from 'ag-charts-types';

import type { ChartRegistry } from '../../../module/moduleContext';
import { communityModule } from '../../../module/moduleIdentity';
import { VERSION } from '../../../version';
import { CartesianChartModule } from '../../cartesianChartModule';
import { HistogramSeries } from './histogramSeries';
import { histogramSeriesOptionsDef } from './histogramSeriesOptionsDef';
import { predictCartesianNonPrimitiveAxis } from './util';

const themeTemplate: ExtensibleSeriesTheme<'histogram'> = {
    series: {
        ...COMMON_SERIES_THEME_DEFAULTS,
        fill: fillThemeTemplate(FILL_GRADIENT_LINEAR_DEFAULTS),
        stroke: { $palette: 'stroke' },
        strokeWidth: 1,
        fillOpacity: 1,
        ...STROKE_STYLE_THEME_DEFAULTS,
        cornerRadius: 0,
        areaPlot: false,
        aggregation: 'sum',
        label: {
            ...LABEL_BOXING_TOP_LEVEL_DEFAULTS,
            ...LABEL_OVERFLOW_DEFAULTS,
            enabled: false,
            fontSize: { $ref: 'seriesLabelFontSize' },
            fontFamily: { $ref: 'seriesLabelFontFamily' },
            fontWeight: { $ref: 'seriesLabelFontWeight' },
            spacing: 8,
            padding: 8,
            collision: BAR_LABEL_COLLISION_THEME,
            insideStyle: LABEL_PLACEMENT_STYLE_DEFAULTS('inside'),
            outsideStyle: LABEL_PLACEMENT_STYLE_DEFAULTS('outside'),
            placement: 'inside-center',
        },
        shadow: SHADOW_THEME_DEFAULTS,
        tooltip: { interaction: { enabled: false } },
        highlight: { ...MULTI_SERIES_HIGHLIGHT_STYLE, bringToFront: true },
    },
};

export const HistogramSeriesModule: SeriesModuleDefinition<AgHistogramSeriesOptions> = /* #__PURE__ */ communityModule({
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
});
