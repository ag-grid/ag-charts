import type { AgIconName } from 'ag-charts-types';

import { BaseProperties, Property } from '../../utils/properties';

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
