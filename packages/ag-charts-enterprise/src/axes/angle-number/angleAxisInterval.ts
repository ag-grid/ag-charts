import { _ModuleSupport } from 'ag-charts-community';

const { OR, POSITIVE_NUMBER, NAN, AxisInterval, TempValidate } = _ModuleSupport;

export class AngleAxisInterval extends AxisInterval<number> {
    @TempValidate(OR(POSITIVE_NUMBER, NAN))
    override minSpacing?: number;
}
