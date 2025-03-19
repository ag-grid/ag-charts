import { _ModuleSupport } from 'ag-charts-community';

const { BOOLEAN, BaseProperties, TempValidate, UNION } = _ModuleSupport;
const AXIS_TYPE = UNION(['x', 'y', 'xy'], 'an axis type');

export class AxesButtons extends BaseProperties {
    @TempValidate(BOOLEAN)
    public enabled: boolean = false;

    @TempValidate(AXIS_TYPE, { optional: true })
    public axes?: 'x' | 'y' | 'xy' = 'y';
}
