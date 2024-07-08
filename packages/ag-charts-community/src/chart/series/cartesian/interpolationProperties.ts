import { BaseProperties } from '../../../util/properties';
import { RATIO, UNION, Validate } from '../../../util/validation';

export const INTERPOLATION_TYPE = UNION(['linear', 'smooth', 'step'], 'a line style');
export const INTERPOLATION_STEP_POSITION = UNION(['start', 'middle', 'end']);

export class InterpolationProperties extends BaseProperties {
    @Validate(INTERPOLATION_TYPE)
    type: 'linear' | 'smooth' | 'step' = 'linear';

    @Validate(RATIO)
    tension: number = 1;

    @Validate(INTERPOLATION_STEP_POSITION)
    position: 'start' | 'middle' | 'end' = 'end';
}
