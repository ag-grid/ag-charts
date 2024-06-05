import { BaseProperties } from '../../../util/properties';
import { LINE_STEP_POSITION, LINE_STYLE, RATIO, Validate } from '../../../util/validation';

export class LineProperties extends BaseProperties {
    @Validate(LINE_STYLE)
    style: 'linear' | 'smooth' | 'step' = 'linear';

    @Validate(RATIO)
    tension: number = 1;

    @Validate(LINE_STEP_POSITION)
    position: 'start' | 'middle' | 'end' = 'end';
}
