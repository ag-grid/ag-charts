import { _ModuleSupport } from 'ag-charts-community';

import { CrosshairLabel } from './crosshairLabel';

const { BaseProperties, POSITIVE_NUMBER, RATIO, BOOLEAN, COLOR_STRING, LINE_DASH, OBJECT, Validate } = _ModuleSupport;

export class CrosshairProperties extends BaseProperties {
    @Validate(BOOLEAN)
    enabled = false;

    @Validate(COLOR_STRING, { optional: true })
    stroke?: string = 'rgb(195, 195, 195)';

    @Validate(LINE_DASH, { optional: true })
    lineDash?: number[] = [6, 3];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @Validate(RATIO)
    strokeOpacity: number = 1;

    @Validate(BOOLEAN)
    snap: boolean = true;

    @Validate(OBJECT, { optional: true })
    readonly label?: CrosshairLabel;
}
