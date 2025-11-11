import { BaseProperties, Property } from 'ag-charts-core';

export class Keyboard extends BaseProperties {
    @Property
    enabled: boolean = false;

    @Property
    tabIndex?: number;
}
