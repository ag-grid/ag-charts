import { BOOLEAN, NUMBER, OPT_COLOR_STRING, Validate } from '../../util/validation';

export class AxisLine {
    @Validate(BOOLEAN)
    enabled = true;

    @Validate(NUMBER(0))
    width: number = 1;

    @Validate(OPT_COLOR_STRING)
    color?: string = undefined;
}
