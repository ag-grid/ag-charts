import { BaseProperties } from '../util/properties';
import { BOOLEAN, NUMBER, Validate } from '../util/validation';

export class Keyboard extends BaseProperties {
    @Validate(BOOLEAN)
    enabled: boolean = false;

    @Validate(NUMBER.restrict({ min: -1, max: 0 }))
    tabIndex?: 0 | -1;
}
