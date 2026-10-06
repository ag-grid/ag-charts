import {
    BAR_LABEL_COLLISION_THEME,
    COMMON_SERIES_THEME_DEFAULTS,
    ChartAxisDirection,
    DIRECTION_SWAP_AXES,
    type DynamicContext,
    FILL_GRADIENT_LINEAR_DEFAULTS,
    LABEL_BOXING_TOP_LEVEL_DEFAULTS,
    LABEL_OVERFLOW_DEFAULTS,
    LABEL_PLACEMENT_STYLE_DEFAULTS,
    MULTI_SERIES_HIGHLIGHT_STYLE,
    SEGMENTATION_DEFAULTS,
    SERIES_SELECTION_THEME,
    SERIES_TOOLTIP_THEME,
    SHADOW_THEME_DEFAULTS,
    STROKE_STYLE_THEME_DEFAULTS,
    type SeriesModuleDefinition,
    fillThemeTemplate,
} from 'ag-charts-core';
import type { AgBarSeriesOptions, ExtensibleSeriesTheme } from 'ag-charts-types';

import type { ChartRegistry } from '../../../module/moduleContext';
import { communityModule } from '../../../module/moduleIdentity';
import { VERSION } from '../../../version';
import { CartesianChartModule } from '../../cartesianChartModule';
import { BarSeries } from './barSeries';
import { barSeriesOptionsDef, barSeriesThemeableOptionsDef } from './barSeriesOptionsDef';
import { predictCartesianNonPrimitiveAxis } from './util';

const themeTemplate: ExtensibleSeriesTheme<'bar'> = {
    series: {
        ...COMMON_SERIES_THEME_DEFAULTS,
        direction: 'vertical',
        fill: fillThemeTemplate(FILL_GRADIENT_LINEAR_DEFAULTS),
        fillOpacity: 1,
        stroke: { $palette: 'stroke' },
        strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
        ...STROKE_STYLE_THEME_DEFAULTS,
        cornerRadius: 0,
        label: {
            ...LABEL_BOXING_TOP_LEVEL_DEFAULTS,
            ...LABEL_OVERFLOW_DEFAULTS,
            enabled: false,
            fontWeight: { $ref: 'seriesLabelFontWeight' },
            fontSize: { $ref: 'seriesLabelFontSize' },
            fontFamily: { $ref: 'seriesLabelFontFamily' },
            spacing: 8,
            padding: 8,
            collision: BAR_LABEL_COLLISION_THEME,
            insideStyle: LABEL_PLACEMENT_STYLE_DEFAULTS('inside'),
            outsideStyle: LABEL_PLACEMENT_STYLE_DEFAULTS('outside'),
            placement: 'inside-center',
        },
        shadow: SHADOW_THEME_DEFAULTS,
        tooltip: { ...SERIES_TOOLTIP_THEME, interaction: { enabled: false } },
        highlight: { ...MULTI_SERIES_HIGHLIGHT_STYLE, bringToFront: true },
        selection: SERIES_SELECTION_THEME,
        segmentation: SEGMENTATION_DEFAULTS,
    },
};

export const BarSeriesModule: SeriesModuleDefinition<AgBarSeriesOptions> = /* #__PURE__ */ communityModule({
    type: 'series',
    name: 'bar',
    chartType: 'cartesian',
    stackable: true,
    groupable: true,
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: barSeriesOptionsDef,

    themeOptions: barSeriesThemeableOptionsDef,
    predictAxis: predictCartesianNonPrimitiveAxis,
    defaultAxes: DIRECTION_SWAP_AXES,
    axisKeys: { [ChartAxisDirection.X]: 'xKeyAxis', [ChartAxisDirection.Y]: 'yKeyAxis' },
    axisKeysFlipped: { [ChartAxisDirection.X]: 'yKeyAxis', [ChartAxisDirection.Y]: 'xKeyAxis' },
    themeTemplate,

    create: (ctx: DynamicContext<ChartRegistry>) => new BarSeries(ctx),
});
