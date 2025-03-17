import { type AgWaterfallSeriesItemOptions, type WithThemeParams, _ModuleSupport } from 'ag-charts-community';

function itemTheme(
    key: 'altUp' | 'altDown' | 'neutral',
    index: number
): WithThemeParams<AgWaterfallSeriesItemOptions<any>> {
    return {
        fill: {
            $if: [
                { $eq: [{ $palette: 'type' }, 'user-indexed'] },
                { $path: [`./${index}`, { $palette: 'fill' }, { $palette: 'fills' }] },
                { $palette: `${key}.fill` },
            ],
        },
        stroke: { $palette: `${key}.stroke` },
        strokeWidth: 0,
        label: {
            enabled: false,
            fontStyle: undefined,
            fontWeight: { $ref: 'fontWeight' as const },
            fontSize: { $ref: 'fontSize' as const },
            fontFamily: { $ref: 'fontFamily' as const },
            color: { $ref: 'textColor' as const },
            formatter: undefined,
            placement: 'outside-end' as const,
        },
        // @ts-expect-error undocumented-option
        defaultColorRange: {
            $if: [
                { $isGradient: [{ $palette: `${key}.fill` }] },
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
    },
    legend: {
        enabled: true,
        toggleSeries: false,
    },
};
