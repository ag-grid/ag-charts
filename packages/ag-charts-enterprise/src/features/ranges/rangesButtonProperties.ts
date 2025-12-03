import { Property, ToolbarButtonProperties } from 'ag-charts-core';

type RangesButtonValue =
    | number
    | [Date | number, Date | number]
    | ((start: Date | number, end: Date | number) => [Date | number, Date | number]);

export class RangesButtonProperties extends ToolbarButtonProperties {
    @Property
    public value!: RangesButtonValue;
}
