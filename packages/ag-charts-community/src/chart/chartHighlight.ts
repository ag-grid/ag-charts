import { BaseProperties, Property } from '../util/properties';

export class ChartHighlight extends BaseProperties {
    @Property
    public range: 'tooltip' | 'node' = 'tooltip';
}
