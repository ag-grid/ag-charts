import { _ModuleSupport } from 'ag-charts-community';

const { BaseProperties, Property } = _ModuleSupport;

export class AxesButtons extends BaseProperties {
    @Property
    public enabled: boolean = false;

    @Property
    public axes?: 'x' | 'y' | 'xy' = 'y';
}
