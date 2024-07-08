import { _ModuleSupport } from 'ag-charts-community';

const { OR, POSITIVE_NUMBER, NAN, AxisInterval, Validate } = _ModuleSupport;

export class AngleAxisInterval extends AxisInterval<number> {
    @Validate(OR(POSITIVE_NUMBER, NAN))
    override minSpacing: number = NaN;
}
