import { type AgSunburstSeriesOptions, VERSION } from 'ag-charts-community';
import {
    AUTO_SIZED_LABEL_TRUNCATE,
    BASE_FONT_SIZE,
    FILL_GRADIENT_RADIAL_REVERSED_SERIES_DEFAULTS,
    FONT_SIZE_RATIO,
    LABEL_BOXING_DEFAULTS,
    SERIES_INTERACTION_THEME_DEFAULTS,
    SERIES_SELECTION_THEME,
    SERIES_TOOLTIP_THEME,
    SHADOW_THEME_DEFAULTS,
    type SeriesModuleDefinition,
    cycledFillThemeTemplate,
    undocumentedThemeOptions,
} from 'ag-charts-core';
import type { ExtensibleSeriesTheme } from 'ag-charts-types';

import { StandaloneChartModule } from '../../charts/standaloneChartModule';
import { SunburstSeries } from './sunburstSeries';
import { sunburstSeriesOptionsDef, sunburstSeriesThemeableOptionsDef } from './sunburstSeriesOptionsDef';

const themeTemplate: ExtensibleSeriesTheme<'sunburst'> = {
    series: {
        ...SERIES_INTERACTION_THEME_DEFAULTS,
        fills: {
            $applyCycle: [
                { $size: { $path: ['./data', { $path: '/data' }] } },
                { $palette: 'fills' },
                cycledFillThemeTemplate(FILL_GRADIENT_RADIAL_REVERSED_SERIES_DEFAULTS),
            ],
        },
        strokes: {
            $applyCycle: [{ $size: { $path: ['./data', { $path: '/data' }] } }, { $palette: 'strokes' }],
        },
        colorScale: {
            fills: { $map: [{ color: { $value: '$1' } }, { $palette: 'divergingColors' }] },
            mode: 'continuous',
        },
        tooltip: SERIES_TOOLTIP_THEME,
        fillOpacity: 1,
        strokeWidth: { $isUserOption: ['./strokes/0', 2, 0] },
        strokeOpacity: 1,
        cornerRadius: 0,
        shadow: SHADOW_THEME_DEFAULTS,
        label: {
            ...LABEL_BOXING_DEFAULTS,
            enabled: true,
            fontFamily: { $ref: 'seriesLabelFontFamily' },
            fontSize: { $rem: [FONT_SIZE_RATIO.LARGE, 'seriesLabelFontSize'] },
            minimumFontSize: { $rem: [9 / BASE_FONT_SIZE, 'seriesLabelFontSize'] },
            fontWeight: { $ref: 'seriesLabelFontWeight' },
            color: { $ref: 'chartBackgroundColor' },
            truncate: AUTO_SIZED_LABEL_TRUNCATE,
            wrapping: 'never',
            spacing: 2,
        },
        secondaryLabel: {
            ...LABEL_BOXING_DEFAULTS,
            enabled: true,
            fontFamily: { $ref: 'seriesLabelFontFamily' },
            fontSize: { $rem: [FONT_SIZE_RATIO.SMALLEST, 'seriesLabelFontSize'] },
            minimumFontSize: { $rem: [7 / BASE_FONT_SIZE, 'seriesLabelFontSize'] },
            fontWeight: { $ref: 'seriesLabelFontWeight' },
            color: { $ref: 'chartBackgroundColor' },
            truncate: AUTO_SIZED_LABEL_TRUNCATE,
            wrapping: 'never',
        },
        innerLabels: {
            $apply: {
                ...LABEL_BOXING_DEFAULTS,
                fontSize: { $ref: 'seriesLabelFontSize' },
                fontFamily: { $ref: 'seriesLabelFontFamily' },
                fontWeight: { $ref: 'seriesLabelFontWeight' },
                color: { $ref: 'textColor' },
                spacing: 2,
            },
        },
        sectorSpacing: 2,
        padding: 3,
        highlight: {
            enabled: { $circular: { $path: '/highlight/enabled' } },
            unhighlightedItem: {
                fillOpacity: 0.6,
                strokeOpacity: 0.6,
            },
            unhighlightedBranch: {
                fillOpacity: 0.2,
                strokeOpacity: 0.2,
            },
        },
        selection: SERIES_SELECTION_THEME,
        ...undocumentedThemeOptions({ childrenKey: 'children' }),
    },
    legend: {
        enabled: {
            $and: [{ $path: '../series/0/colorKey' }, { $eq: [{ $path: '../series/0/colorScale/mode' }, 'discrete'] }],
        },
    },
    gradientLegend: {
        enabled: {
            $and: [
                { $path: '../series/0/colorKey' },
                { $not: { $eq: [{ $path: '../series/0/colorScale/mode' }, 'discrete'] } },
            ],
        },
    },
};

export const SunburstSeriesModule: SeriesModuleDefinition<AgSunburstSeriesOptions> = {
    type: 'series',
    name: 'sunburst',
    chartType: 'standalone',
    enterprise: true,
    solo: true,
    version: VERSION,
    dependencies: [StandaloneChartModule],

    options: sunburstSeriesOptionsDef,

    themeOptions: sunburstSeriesThemeableOptionsDef,
    themeTemplate,

    create: (ctx) => new SunburstSeries(ctx),
};
