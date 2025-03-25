import type { AgIconName } from 'ag-charts-types';

import { BaseProperties } from '../../util/properties';
import { Property } from '../../util/properties';

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
