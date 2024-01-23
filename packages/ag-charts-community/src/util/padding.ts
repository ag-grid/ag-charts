import { BaseProperties } from './properties';
import { POSITIVE_NUMBER, Validate } from './validation';

export class Padding extends BaseProperties {
    @Validate(POSITIVE_NUMBER)
    top: number;

    @Validate(POSITIVE_NUMBER)
    right: number;

    @Validate(POSITIVE_NUMBER)
    bottom: number;

    @Validate(POSITIVE_NUMBER)
    left: number;

    constructor(top: number = 0, right: number = top, bottom: number = top, left: number = right) {
        super();
        this.top = top;
        this.right = right;
        this.bottom = bottom;
        this.left = left;
    }

    clear() {
        this.top = this.right = this.bottom = this.left = 0;
    }
}
