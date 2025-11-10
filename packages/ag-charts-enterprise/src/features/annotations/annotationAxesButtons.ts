import { _ModuleSupport } from 'ag-charts-community';

import { Property, BaseProperties} from 'ag-charts-core';

export class AxesButtons extends BaseProperties {
    @Property
    public enabled: boolean = false;

    @Property
    public axes?: 'x' | 'y' | 'xy' = 'y';
}
