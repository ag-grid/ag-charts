import { Property } from 'ag-charts-core';
import type { AgRangesButtonValue } from 'ag-charts-types';

import { ToolbarButtonProperties } from '../toolbar/buttonProperties';

export class RangesButtonProperties extends ToolbarButtonProperties {
    @Property
    public enabled?: boolean;

    @Property
    public value!: AgRangesButtonValue;
}
