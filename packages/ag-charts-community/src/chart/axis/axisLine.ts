import { BOOLEAN, COLOR_STRING, POSITIVE_NUMBER, Validate } from '../../util/validation';

export class AxisLine {
    @Validate(BOOLEAN)
    enabled = true;

    @Validate(POSITIVE_NUMBER)
    width: number = 1;

    @Validate(COLOR_STRING, { optional: true })
    stroke?: string = undefined;
}
