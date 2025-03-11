import { isObject } from 'ag-charts-core';
import type { AgAxisGridStyle } from 'ag-charts-types';

import { ARRAY_OF, BOOLEAN, POSITIVE_NUMBER, TempValidate } from '../../util/validation';

const GRID_STYLE_KEYS = ['stroke', 'lineDash'];
const GRID_STYLE = ARRAY_OF(
    (value) => isObject(value) && Object.keys(value).every((key) => GRID_STYLE_KEYS.includes(key)),
    "objects with gridline style properties such as 'stroke' or 'lineDash'"
);

export class AxisGridLine {
    @TempValidate(BOOLEAN)
    enabled = true;

    @TempValidate(POSITIVE_NUMBER)
    width: number = 1;

    @TempValidate(GRID_STYLE)
    style: AgAxisGridStyle[] = [
        {
            stroke: undefined,
            lineDash: [],
        },
    ];
}
