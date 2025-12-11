import { Property } from 'ag-charts-core';

import { ToolbarButtonProperties } from '../toolbar/buttonProperties';

type RangesButtonValue =
    | number
    | [Date | number, Date | number]
    | ((start: Date | number, end: Date | number) => [Date | number, Date | number]);

export class RangesButtonProperties extends ToolbarButtonProperties {
    @Property
    public value!: RangesButtonValue;
}
