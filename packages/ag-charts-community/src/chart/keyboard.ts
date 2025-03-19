import { BaseProperties } from '../util/properties';
import { BOOLEAN, NUMBER, TempValidate } from '../util/validation';

export class Keyboard extends BaseProperties {
    @TempValidate(BOOLEAN)
    enabled: boolean = false;

    @TempValidate(NUMBER)
    tabIndex?: number;
}
