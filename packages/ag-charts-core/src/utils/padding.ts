import { BaseProperties, Property } from './properties';

export class Padding extends BaseProperties {
    @Property
    top: number;

    @Property
    right: number;

    @Property
    bottom: number;

    @Property
    left: number;

    constructor(top: number = 0, right: number = top, bottom: number = top, left: number = right) {
        super();
        this.top = top;
        this.right = right;
        this.bottom = bottom;
        this.left = left;
    }
}
