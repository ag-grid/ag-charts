import { BaseProperties, Property } from 'ag-charts-core';
import type { AgIconName } from 'ag-charts-types';

export class ToolbarButtonProperties extends BaseProperties {
    @Property
    public icon?: AgIconName;

    @Property
    public label?: string;

    @Property
    public ariaLabel?: string;

    @Property
    public tooltip?: string;
}
