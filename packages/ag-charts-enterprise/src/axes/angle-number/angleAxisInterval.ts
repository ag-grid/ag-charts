import { _ModuleSupport } from 'ag-charts-community';

const { AxisInterval, Property } = _ModuleSupport;

export class AngleAxisInterval extends AxisInterval<number> {
    @Property
    override minSpacing?: number;
}
