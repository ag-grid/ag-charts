import { BaseProperties } from '../util/properties';
import { TempValidate, UNION } from '../util/validation';

export class ChartHighlight extends BaseProperties {
    @TempValidate(UNION(['tooltip', 'node'], 'a range'))
    public range: 'tooltip' | 'node' = 'tooltip';
}
