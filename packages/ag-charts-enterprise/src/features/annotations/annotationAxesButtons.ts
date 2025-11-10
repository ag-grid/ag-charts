import { BaseProperties, Property } from 'ag-charts-core';

export class AxesButtons extends BaseProperties {
    @Property
    public enabled: boolean = false;

    @Property
    public axes?: 'x' | 'y' | 'xy' = 'y';
}
