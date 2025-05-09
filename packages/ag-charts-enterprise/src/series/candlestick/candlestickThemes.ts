import { type AgCandlestickSeriesItemOptions, type WithThemeParams, _ModuleSupport } from 'ag-charts-community';
import type { RequiredInternalAgGradientColor } from 'ag-charts-core';

const { CARTESIAN_AXIS_TYPE } = _ModuleSupport.ThemeConstants;

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
        fillGradientDefaults: {
            type: 'gradient',
            gradient: 'linear',
            bounds: 'item',
            colorStops: {
                $if: [
                    {
                        $or: [
                            { $isGradient: [{ $palette: `${key}.fill` }] },
                            { $isPattern: [{ $palette: `${key}.fill` }] },
                            { $isImage: [{ $palette: `${key}.fill` }] },
                        ],
                    },
                    {
                        $map: [
                            { $path: ['./color', undefined, { $value: '$1' }] },
                            {
                                $path: ['./colorStops', undefined, { $palette: `${key}.fill` }],
                            },
                        ],
                    },
                    [
                        { $mix: [{ $palette: `${key}.fill` }, 'black', 0.15] },
                        { $mix: [{ $palette: `${key}.fill` }, 'white', 0.15] },
                    ],
                ],
            } as any,
            rotation: 0,
            reverse: false,
        } satisfies WithThemeParams<RequiredInternalAgGradientColor>,
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
