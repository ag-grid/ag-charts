import { type AgWaterfallSeriesItemOptions, type WithThemeParams, _ModuleSupport } from 'ag-charts-community';

const { FILL_GRADIENT_LINEAR_KEYED_DEFAULTS, FILL_IMAGE_DEFAULTS, FILL_PATTERN_KEYED_DEFAULTS } = _ModuleSupport;

function itemTheme(
    key: 'altUp' | 'altDown' | 'neutral',
    index: number
): WithThemeParams<AgWaterfallSeriesItemOptions<any> & { label: { padding: number } }> {
    return {
        fill: {
            $applySwitch: [
                { $path: 'type' },
                {
                    $if: [
                        { $eq: [{ $palette: 'type' }, 'user-indexed'] },
                        { $path: [`/${index}`, { $palette: 'fill' }, { $palette: 'fills' }] },
                        { $palette: `${key}.fill` },
                    ],
                },
                ['gradient', FILL_GRADIENT_LINEAR_KEYED_DEFAULTS(key)],
                ['image', FILL_IMAGE_DEFAULTS],
                ['pattern', FILL_PATTERN_KEYED_DEFAULTS(key)],
            ],
        },
        stroke: { $palette: `${key}.stroke` },
        strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
        label: {
            ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
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
