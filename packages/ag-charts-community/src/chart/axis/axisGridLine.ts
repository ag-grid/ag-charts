import type { AgAxisGridStyle } from 'ag-charts-types';

import { isObject } from '../../util/type-guards';
import { ARRAY_OF, BOOLEAN, POSITIVE_NUMBER, Validate } from '../../util/validation';

const GRID_STYLE_KEYS = ['stroke', 'lineDash'];
export const GRID_STYLE = ARRAY_OF(
    (value) => isObject(value) && Object.keys(value).every((key) => GRID_STYLE_KEYS.includes(key)),
    "objects with gridline style properties such as 'stroke' or 'lineDash'"
);

export class AxisGridLine {
    @Validate(BOOLEAN)
    enabled = true;

    @Validate(POSITIVE_NUMBER)
    width: number = 1;

    @Validate(GRID_STYLE)
    style: AgAxisGridStyle[] = [
        {
            stroke: undefined,
            lineDash: [],
        },
    ];
}
