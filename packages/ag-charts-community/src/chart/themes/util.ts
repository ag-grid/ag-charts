import type { InternalAgPatternColor } from 'ag-charts-core';
import type { AgCartesianChartOptions, WithThemeParams } from 'ag-charts-types';

import { Color } from '../../util/color';
import { mapValues } from '../../util/object';
import { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION } from './constants';

type CartesianAxis = Exclude<AgCartesianChartOptions['axes'], undefined>[0];

export const DIRECTION_SWAP_AXES: WithThemeParams<[CartesianAxis, CartesianAxis]> = [
    {
        type: CARTESIAN_AXIS_TYPE.NUMBER,
        position: {
            $if: [
                { $eq: [{ $path: ['/direction', undefined] }, 'horizontal'] },
                CARTESIAN_POSITION.BOTTOM,
                CARTESIAN_POSITION.LEFT,
            ],
        },
    },
    {
        type: CARTESIAN_AXIS_TYPE.CATEGORY,
        position: {
            $if: [
                { $eq: [{ $path: ['/direction', undefined] }, 'horizontal'] },
                CARTESIAN_POSITION.LEFT,
                CARTESIAN_POSITION.BOTTOM,
            ],
        },
    },
];

export const FILL_PATTERN_DEFAULTS: WithThemeParams<InternalAgPatternColor> = {
    type: 'pattern',
    pattern: 'forward-slanted-lines',
    // width: undefined,
    // height: undefined,
    padding: 6,
    fill: { $palette: 'fill' },
    fillOpacity: 1,
    stroke: { $palette: 'fill' },
    strokeOpacity: 1,
    // strokeWidth: undefined,
    backgroundFill: 'transparent',
    backgroundFillOpacity: 1,
    rotation: 0,
};

export function getSequentialColors(colors: { [key: string]: string }) {
    return mapValues(colors, (value) => {
        const color = Color.fromString(value);
        return [Color.darken(color, 0.15).toString(), value, Color.lighten(color, 0.15).toString()];
    });
}
