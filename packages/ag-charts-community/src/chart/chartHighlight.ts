import { UNION, Validate } from '../util/validation';

export class ChartHighlight {
    @Validate(UNION(['tooltip', 'node'], 'a range'))
    public range: 'tooltip' | 'node' = 'tooltip';
}
