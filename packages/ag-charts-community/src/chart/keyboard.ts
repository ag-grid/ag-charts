import { BaseProperties } from '../util/properties';
import { BOOLEAN, NUMBER, Validate } from '../util/validation';

export class Keyboard extends BaseProperties {
    @Validate(BOOLEAN)
    enabled: boolean = false;

    @Validate(NUMBER)
    tabIndex?: number;
}
