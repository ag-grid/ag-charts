import { _ModuleSupport } from 'ag-charts-community';

const { BOOLEAN, BaseProperties, Validate, UNION } = _ModuleSupport;
const AXIS_TYPE = UNION(['x', 'y', 'xy'], 'an axis type');

export class AxesButtons extends BaseProperties {
    @Validate(BOOLEAN)
    public enabled: boolean = true;

    @Validate(AXIS_TYPE, { optional: true })
    public axes?: 'x' | 'y' | 'xy' = 'y';
}
