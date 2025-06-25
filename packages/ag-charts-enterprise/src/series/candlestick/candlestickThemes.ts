import { type AgCandlestickSeriesItemOptions, type WithThemeParams, _ModuleSupport } from 'ag-charts-community';

const {
    ThemeConstants: { CARTESIAN_AXIS_TYPE },
    multiSeriesHighlightStyle,
} = _ModuleSupport;

function itemTheme(key: 'up' | 'down'): WithThemeParams<AgCandlestickSeriesItemOptions> {
    return {
        fill: {
            $if: [
                { $eq: [{ $palette: 'type' }, 'user-indexed'] },
                key === 'up' ? 'transparent' : { $palette: 'fill' },
                { $palette: `${key}.fill` },
            ],
        },
        stroke: {
            $if: [
                { $eq: [{ $palette: 'type' }, 'user-indexed'] },
                { $palette: 'stroke' },
                { $palette: `${key}.stroke` },
            ],
        },
        // @ts-expect-error undocumented-option
        fillGradientDefaults: _ModuleSupport.FILL_GRADIENT_LINEAR_SHADED_DEFAULTS(key),
        fillPatternDefaults: _ModuleSupport.FILL_PATTERN_DEFAULTS,
        fillImageDefaults: _ModuleSupport.FILL_IMAGE_DEFAULTS,
    };
}

export const CANDLESTICK_SERIES_THEME: _ModuleSupport.SeriesModule<'candlestick'>['themeTemplate'] = {
    series: {
        item: {
            up: itemTheme('up'),
            down: itemTheme('down'),
        },
        highlightStyle: {
            item: { strokeWidth: 3 },
        },
        tooltip: {
            range: { $path: ['/tooltip/range', 'nearest'] },
        },
        highlight: multiSeriesHighlightStyle(),
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
