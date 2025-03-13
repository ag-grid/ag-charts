import { _ModuleSupport } from 'ag-charts-community';

const { CARTESIAN_AXIS_TYPE } = _ModuleSupport.ThemeConstants;

export const CANDLESTICK_SERIES_THEME: _ModuleSupport.SeriesModule<'candlestick'>['themeTemplate'] = {
    series: {
        item: {
            up: {
                fill: {
                    $if: [{ $eq: [{ $palette: 'type' }, 'user-indexed'] }, 'transparent', { $palette: 'up.fill' }],
                },
                stroke: {
                    $if: [
                        { $eq: [{ $palette: 'type' }, 'user-indexed'] },
                        { $palette: 'stroke' },
                        { $palette: 'up.stroke' },
                    ],
                },
                // @ts-expect-error undocumented option
                defaultColorRange: [
                    { $mix: [{ $palette: 'up.fill' }, 'black', 0.15] },
                    { $mix: [{ $palette: 'up.fill' }, 'white', 0.15] },
                ],
            },
            down: {
                fill: {
                    $if: [
                        { $eq: [{ $palette: 'type' }, 'user-indexed'] },
                        { $palette: 'fill' },
                        { $palette: 'down.fill' },
                    ],
                },
                stroke: {
                    $if: [
                        { $eq: [{ $palette: 'type' }, 'user-indexed'] },
                        { $palette: 'stroke' },
                        { $palette: 'down.stroke' },
                    ],
                },
                // @ts-expect-error undocumented option
                defaultColorRange: [
                    { $mix: [{ $palette: 'down.fill' }, 'black', 0.15] },
                    { $mix: [{ $palette: 'down.fill' }, 'white', 0.15] },
                ],
            },
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
