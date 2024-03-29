import { _Theme } from 'ag-charts-community';

export const BULLET_SERIES_THEME = {
    series: {
        direction: 'vertical' as const,
        strokeWidth: 0,
        strokeOpacity: 1,
        fillOpacity: 1,
        widthRatio: 0.5,
        target: {
            strokeWidth: 3,
            strokeOpacity: 1,
            lengthRatio: 0.75,
        },
    },
    axes: {
        [_Theme.CARTESIAN_AXIS_TYPE.NUMBER]: {
            nice: false,
            crosshair: {
                enabled: false,
            },
        },
    },
};
