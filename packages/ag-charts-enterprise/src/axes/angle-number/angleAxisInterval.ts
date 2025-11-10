import { _ModuleSupport } from 'ag-charts-community';

import { Property } from 'ag-charts-core';
const { AxisInterval } = _ModuleSupport;
export class AngleAxisInterval extends AxisInterval<number> {
    @Property
    override minSpacing?: number;
}
