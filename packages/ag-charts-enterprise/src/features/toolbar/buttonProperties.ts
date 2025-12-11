import type { AgIconName } from 'packages/ag-charts-types/src/main';

import { BaseProperties, Property } from '../../../../ag-charts-core/src/runtime/state/properties';

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
