import { _ModuleSupport } from 'ag-charts-community';

const {
    ThemeSymbols: { DEFAULT_LABEL_COLOUR },
    ThemeConstants: { POLAR_AXIS_TYPE, POLAR_AXIS_SHAPE },
} = _ModuleSupport;

export const NIGHTINGALE_SERIES_THEME = {
    series: {
        strokeWidth: 1,
        label: {
            enabled: false,
            fontSize: { ref: 'fontSize' as const },
            fontFamily: { ref: 'fontFamily' as const },
            color: DEFAULT_LABEL_COLOUR,
        },
    },
    axes: {
        [POLAR_AXIS_TYPE.ANGLE_CATEGORY]: {
            shape: POLAR_AXIS_SHAPE.CIRCLE,
            groupPaddingInner: 0,
            paddingInner: 0,
            label: {
                spacing: 10,
            },
        },
        [POLAR_AXIS_TYPE.RADIUS_NUMBER]: {
            shape: POLAR_AXIS_SHAPE.CIRCLE,
        },
    },
};
