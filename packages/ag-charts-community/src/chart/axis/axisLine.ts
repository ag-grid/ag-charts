import { Property } from '../../util/properties';

export class AxisLine {
    @Property
    enabled = true;

    @Property
    width: number = 1;

    @Property
    stroke?: string = undefined;
}
