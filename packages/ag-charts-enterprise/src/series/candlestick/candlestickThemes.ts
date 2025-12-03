import { type AgCandlestickSeriesItemOptions, type WithThemeParams, _ModuleSupport } from 'ag-charts-community';
import {
    CARTESIAN_AXIS_TYPE,
    FILL_GRADIENT_LINEAR_KEYED_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_KEYED_DEFAULTS,
} from 'ag-charts-core';
import type { ExtensibleTheme } from 'ag-charts-types';

const { multiSeriesHighlightStyle } = _ModuleSupport;

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
                ['gradient', FILL_GRADIENT_LINEAR_KEYED_DEFAULTS(key)],
                ['image', FILL_IMAGE_DEFAULTS],
                ['pattern', FILL_PATTERN_KEYED_DEFAULTS(key)],
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

export const CANDLESTICK_SERIES_THEME: ExtensibleTheme<'candlestick'> = {
    series: {
        item: {
            up: itemTheme('up'),
            down: itemTheme('down'),
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
