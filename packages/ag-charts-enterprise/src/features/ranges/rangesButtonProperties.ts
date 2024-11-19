import { _ModuleSupport } from 'ag-charts-community';

const { AND, ARRAY, FUNCTION, NUMBER, OR, ToolbarButtonProperties, Validate } = _ModuleSupport;

export type RangesButtonValue =
    | number
    | [Date | number, Date | number]
    | ((start: Date | number, end: Date | number) => [Date | number, Date | number]);

export class RangesButtonProperties extends ToolbarButtonProperties {
    @Validate(OR(NUMBER, AND(ARRAY, ARRAY.restrict({ length: 2 })), FUNCTION))
    public value!: RangesButtonValue;
}
