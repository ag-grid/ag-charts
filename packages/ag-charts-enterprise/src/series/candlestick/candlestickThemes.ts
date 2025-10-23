import { type AgCandlestickSeriesItemOptions, type WithThemeParams, _ModuleSupport } from 'ag-charts-community';

const {
    ThemeConstants: { CARTESIAN_AXIS_TYPE },
    multiSeriesHighlightStyle,
    FILL_GRADIENT_LINEAR_SHADED_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
} = _ModuleSupport;

function itemTheme(key: 'up' | 'down'): WithThemeParams<AgCandlestickSeriesItemOptions> {
    return {
        fill: {
            $applySwitch: [
                { $path: 'type' },
                {
                    $if: [
                        { $eq: [{ $palette: 'type' }, 'user-indexed'] },
                        key === 'up' ? 'transparent' : { $palette: 'fill' },
                        { $palette: `${key}.fill` },
                    ],
                },
                ['gradient', FILL_GRADIENT_LINEAR_SHADED_DEFAULTS(key)],
                ['image', FILL_IMAGE_DEFAULTS],
                ['pattern', FILL_PATTERN_DEFAULTS],
            ],
        },
        stroke: {
            $if: [
                { $eq: [{ $palette: 'type' }, 'user-indexed'] },
                { $palette: 'stroke' },
                { $palette: `${key}.stroke` },
            ],
        },
    };
}

export const CANDLESTICK_SERIES_THEME: _ModuleSupport.SeriesModule<'candlestick'>['themeTemplate'] = {
    series: {
        item: {
            up: itemTheme('up'),
            down: itemTheme('down'),
        },
        tooltip: {
            range: { $path: ['/tooltip/range', 'nearest'] },
        },
        highlight: _ModuleSupport.mergeDefaults(
            {
                highlightedItem: { strokeWidth: 3 },
            },
            multiSeriesHighlightStyle()
        ),
    },
    animation: { enabled: false },
    axes: {
        [CARTESIAN_AXIS_TYPE.NUMBER]: {
            crosshair: {
                snap: false,
            },
        },
        [CARTESIAN_AXIS_TYPE.ORDINAL_TIME]: {
            groupPaddingInner: 0,
            crosshair: {
                enabled: true,
            },
        },
    },
};
