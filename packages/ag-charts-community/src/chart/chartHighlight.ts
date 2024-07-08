import { BaseProperties } from '../util/properties';
import { UNION, Validate } from '../util/validationDecorators';

export class ChartHighlight extends BaseProperties {
    @Validate(UNION(['tooltip', 'node'], 'a range'))
    public range: 'tooltip' | 'node' = 'tooltip';
}
