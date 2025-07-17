import { type AgWaterfallSeriesItemOptions, type WithThemeParams, _ModuleSupport } from 'ag-charts-community';

function itemTheme(
    key: 'altUp' | 'altDown' | 'neutral',
    index: number
): WithThemeParams<AgWaterfallSeriesItemOptions<any> & { label: { padding: number } }> {
    return {
        fill: {
            $if: [
                { $eq: [{ $palette: 'type' }, 'user-indexed'] },
                { $path: [`/${index}`, { $palette: 'fill' }, { $palette: 'fills' }] },
                { $palette: `${key}.fill` },
            ],
        },
        // @ts-expect-error undocumented option
        fillGradientDefaults: _ModuleSupport.FILL_GRADIENT_LINEAR_SHADED_DEFAULTS(key),
        fillPatternDefaults: _ModuleSupport.FILL_PATTERN_DEFAULTS,
        fillImageDefaults: _ModuleSupport.FILL_IMAGE_DEFAULTS,
        stroke: { $palette: `${key}.stroke` },
        strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
        label: {
            enabled: false,
            fontStyle: undefined,
            fontWeight: { $ref: 'fontWeight' as const },
            fontSize: { $ref: 'fontSize' as const },
            fontFamily: { $ref: 'fontFamily' as const },
            color: { $ref: 'textColor' as const },
            formatter: undefined,
            placement: 'outside-end' as const,
            padding: { $isUserOption: ['./spacing', 0, 6] }, // compatibility with old `padding` property (now named `spacing`).
        },
    };
}

export const WATERFALL_SERIES_THEME: _ModuleSupport.SeriesModule<'waterfall'>['themeTemplate'] = {
    series: {
        item: {
            positive: itemTheme('altUp', 0),
            negative: itemTheme('altDown', 1),
            total: itemTheme('neutral', 2),
        },
        line: {
            stroke: { $palette: 'neutral.stroke' },
            strokeOpacity: 1,
            lineDash: [0],
            lineDashOffset: 0,
            strokeWidth: 2,
        },
        highlight: _ModuleSupport.singleSeriesHighlightStyle(),
    },
    legend: {
        enabled: true,
        toggleSeries: false,
    },
};
