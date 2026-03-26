import { Property } from 'ag-charts-core';

export class AxisLine {
    @Property
    enabled = true;

    @Property
    width: number = 1;

    @Property
    stroke?: string = undefined;
}
