import type { AgIconName } from 'ag-charts-types';

import { BaseProperties } from '../../util/properties';
import { STRING, Validate } from '../../util/validation';

export class ToolbarButtonProperties extends BaseProperties {
    @Validate(STRING, { optional: true })
    public icon?: AgIconName;

    @Validate(STRING, { optional: true })
    public label?: string;

    @Validate(STRING, { optional: true })
    public ariaLabel?: string;

    @Validate(STRING, { optional: true })
    public tooltip?: string;
}
