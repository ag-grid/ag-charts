import type { AgAxisGridStyle } from '../../options/chart/axisOptions';
import { ARRAY, BOOLEAN, NUMBER, Validate, predicateWithMessage } from '../../util/validation';

const GRID_STYLE_KEYS = ['stroke', 'lineDash'];
export const GRID_STYLE = predicateWithMessage(
    ARRAY(undefined, (o) => {
        for (const key in o) {
            if (!GRID_STYLE_KEYS.includes(key)) {
                return false;
            }
        }
        return true;
    }),
    `expecting an Array of objects with gridline style properties such as 'stroke' and 'lineDash'`
);

export class AxisGridline {
    @Validate(BOOLEAN)
    enabled = true;

    @Validate(NUMBER(0))
    width: number = 1;

    @Validate(GRID_STYLE)
    style: AgAxisGridStyle[] = [
        {
            stroke: undefined,
            lineDash: [],
        },
    ];
}
