import { BaseProperties, Property } from '../../../utils/properties';

export class InterpolationProperties extends BaseProperties {
    @Property
    type: 'linear' | 'smooth' | 'step' = 'linear';

    @Property
    tension: number = 1;

    @Property
    position: 'start' | 'middle' | 'end' = 'end';
}
