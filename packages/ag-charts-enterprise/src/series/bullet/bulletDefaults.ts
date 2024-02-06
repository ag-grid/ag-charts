import { _Theme } from 'ag-charts-community';

const { CARTESIAN_AXIS_TYPE, POSITION } = _Theme;

export const BULLET_DEFAULTS = {
    axes: [
        {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: POSITION.LEFT,
            nice: false,
            max: undefined as number | undefined,
        },
        {
            type: CARTESIAN_AXIS_TYPE.CATEGORY,
            position: POSITION.BOTTOM,
        },
    ],
};
