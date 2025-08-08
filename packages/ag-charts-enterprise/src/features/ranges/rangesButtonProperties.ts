import { _ModuleSupport } from 'ag-charts-community';

const { ToolbarButtonProperties, Property } = _ModuleSupport;

type RangesButtonValue =
    | number
    | [Date | number, Date | number]
    | ((start: Date | number, end: Date | number) => [Date | number, Date | number]);

export class RangesButtonProperties extends ToolbarButtonProperties {
    @Property
    public value!: RangesButtonValue;

    public readonly haspopup = 'false' as const;
}
