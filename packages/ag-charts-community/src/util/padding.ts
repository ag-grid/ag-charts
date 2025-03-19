import { BaseProperties } from './properties';
import { POSITIVE_NUMBER, TempValidate } from './validation';

export class Padding extends BaseProperties {
    @TempValidate(POSITIVE_NUMBER)
    top: number;

    @TempValidate(POSITIVE_NUMBER)
    right: number;

    @TempValidate(POSITIVE_NUMBER)
    bottom: number;

    @TempValidate(POSITIVE_NUMBER)
    left: number;

    constructor(top: number = 0, right: number = top, bottom: number = top, left: number = right) {
        super();
        this.top = top;
        this.right = right;
        this.bottom = bottom;
        this.left = left;
    }
}
