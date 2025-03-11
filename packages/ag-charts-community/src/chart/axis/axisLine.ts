import { BOOLEAN, COLOR_STRING, POSITIVE_NUMBER, TempValidate } from '../../util/validation';

export class AxisLine {
    @TempValidate(BOOLEAN)
    enabled = true;

    @TempValidate(POSITIVE_NUMBER)
    width: number = 1;

    @TempValidate(COLOR_STRING, { optional: true })
    stroke?: string = undefined;
}
