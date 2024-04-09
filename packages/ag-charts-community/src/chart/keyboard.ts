import { BaseProperties } from '../util/properties';
import { BOOLEAN, Validate } from '../util/validation';

export class Keyboard extends BaseProperties {
    @Validate(BOOLEAN)
    enabled: boolean = false;
}
