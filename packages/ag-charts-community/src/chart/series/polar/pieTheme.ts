import {
    COMMON_SERIES_THEME_DEFAULTS,
    FILL_GRADIENT_RADIAL_REVERSED_SERIES_DEFAULTS,
    FONT_SIZE_RATIO,
    LABEL_OVERFLOW_DEFAULTS,
    PART_WHOLE_HIGHLIGHT_STYLE,
    PLACED_LABEL_BOXING_DEFAULTS,
    SERIES_SELECTION_THEME,
    SERIES_TOOLTIP_THEME,
    SHADOW_THEME_DEFAULTS,
    STROKE_STYLE_THEME_DEFAULTS,
    cycledFillThemeTemplate,
} from 'ag-charts-core';
import type { ExtensibleSeriesTheme } from 'ag-charts-types';

export const pieTheme: ExtensibleSeriesTheme<'pie'> = {
    series: {
        ...COMMON_SERIES_THEME_DEFAULTS,
        title: {
            enabled: true,
            showInLegend: false,
            fontWeight: { $ref: 'fontWeight' },
            fontSize: { $rem: FONT_SIZE_RATIO.LARGE },
            fontFamily: { $ref: 'fontFamily' },
            color: { $ref: 'subtleTextColor' },
            spacing: 5,
        },
        calloutLabel: {
            ...PLACED_LABEL_BOXING_DEFAULTS('outside'),
            ...LABEL_OVERFLOW_DEFAULTS,
            enabled: true,
            fontSize: { $ref: 'seriesLabelFontSize' },
            fontFamily: { $ref: 'seriesLabelFontFamily' },
            fontWeight: { $ref: 'seriesLabelFontWeight' },
            color: { $ref: 'seriesLabelOutsideTextColor' },
            offset: 3,
            minAngle: 0.001,
            avoidCollisions: true,
        },
        sectorLabel: {
            ...PLACED_LABEL_BOXING_DEFAULTS('inside'),
            ...LABEL_OVERFLOW_DEFAULTS,
            enabled: true,
            fontWeight: { $ref: 'seriesLabelFontWeight' },
            fontSize: { $ref: 'seriesLabelFontSize' },
            fontFamily: { $ref: 'seriesLabelFontFamily' },
            color: { $ref: 'seriesLabelInsideTextColor' },
            positionOffset: 0,
            positionRatio: 0.5,
        },
        calloutLine: {
            length: 10,
            strokeWidth: 2,
            colors: {
                $map: [
                    {
                        $if: [
                            {
                                $or: [
                                    { $isGradient: { $value: '$1' } },
                                    { $isPattern: { $value: '$1' } },
                                    { $isImage: { $value: '$1' } },
                                ],
                            },
                            { $path: ['../../strokes/$index', { $ref: 'foregroundColor' }] },
                            { $value: '$1' },
                        ],
                    },
                    {
                        $if: [
                            { $eq: [{ $path: '../strokeWidth' }, 0] },
                            { $path: '../fills' },
                            { $path: '../strokes' },
                        ],
                    },
                ],
            },
        },
        fills: {
            $applyCycle: [
                { $cacheMax: { $size: { $path: ['./data', { $path: '/data' }] } } },
                { $palette: 'fills' },
                cycledFillThemeTemplate(FILL_GRADIENT_RADIAL_REVERSED_SERIES_DEFAULTS),
            ],
        },
        strokes: {
            $applyCycle: [{ $cacheMax: { $size: { $path: ['./data', { $path: '/data' }] } } }, { $palette: 'strokes' }],
        },
        fillOpacity: 1,
        ...STROKE_STYLE_THEME_DEFAULTS,
        strokeWidth: { $isUserOption: ['./strokes/0', 2, 0] },
        cornerRadius: 0,
        rotation: 0,
        outerRadiusOffset: 0,
        outerRadiusRatio: 1,
        sectorSpacing: 1,
        hideZeroValueSectorsInLegend: false,
        shadow: SHADOW_THEME_DEFAULTS,
        tooltip: { ...SERIES_TOOLTIP_THEME, interaction: { enabled: false } },
        highlight: { ...PART_WHOLE_HIGHLIGHT_STYLE, bringToFront: true },
        selection: SERIES_SELECTION_THEME,
    },
    legend: { enabled: true },
};
