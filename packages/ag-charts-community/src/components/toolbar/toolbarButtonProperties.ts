import type { AgIconName } from 'ag-charts-types';

import { BaseProperties } from '../../util/properties';
import { STRING, TempValidate } from '../../util/validation';

export class ToolbarButtonProperties extends BaseProperties {
    @TempValidate(STRING, { optional: true })
    public icon?: AgIconName;

    @TempValidate(STRING, { optional: true })
    public label?: string;

    @TempValidate(STRING, { optional: true })
    public ariaLabel?: string;

    @TempValidate(STRING, { optional: true })
    public tooltip?: string;
}
