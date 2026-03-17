import { BaseProperties, Property } from 'ag-charts-core';
import type { AgInitialFocus } from 'ag-charts-types';

export class Keyboard extends BaseProperties {
    @Property
    enabled: boolean = false;

    @Property
    tabIndex?: number;

    @Property
    initialFocus: AgInitialFocus = 'data-start';
}
