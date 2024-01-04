import { _Theme } from 'ag-charts-community';

const { CARTESIAN_AXIS_TYPE, POSITION } = _Theme;

export const BULLET_DEFAULTS = {
    axes: [
        {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: POSITION.LEFT as 'left' | 'top',
            nice: false,
            max: undefined as number | undefined,
            crosshair: { enabled: false },
        },
        {
            type: CARTESIAN_AXIS_TYPE.CATEGORY,
            position: POSITION.BOTTOM as 'bottom' | 'left',
        },
    ],
};
