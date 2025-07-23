import { BaseProperties, Property } from '../util/properties';

export class Keyboard extends BaseProperties {
    @Property
    enabled: boolean = false;

    @Property
    tabIndex?: number;
}
