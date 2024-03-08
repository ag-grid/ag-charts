import { BaseProperties } from '../util/properties';
import { UNION, Validate } from '../util/validation';

export class ChartHighlight extends BaseProperties {
    @Validate(UNION(['tooltip', 'node'], 'a range'))
    public range: 'tooltip' | 'node' = 'tooltip';
}
