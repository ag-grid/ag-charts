import { BaseProperties } from '../../../util/properties';
import { RATIO, TempValidate, UNION } from '../../../util/validation';

export const INTERPOLATION_TYPE = UNION(['linear', 'smooth', 'step'], 'a line style');
export const INTERPOLATION_STEP_POSITION = UNION(['start', 'middle', 'end']);

export class InterpolationProperties extends BaseProperties {
    @TempValidate(INTERPOLATION_TYPE)
    type: 'linear' | 'smooth' | 'step' = 'linear';

    @TempValidate(RATIO)
    tension: number = 1;

    @TempValidate(INTERPOLATION_STEP_POSITION)
    position: 'start' | 'middle' | 'end' = 'end';
}
