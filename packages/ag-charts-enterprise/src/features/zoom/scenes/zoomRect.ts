import { _ModuleSupport } from 'ag-charts-community';

const { COLOR_STRING, RATIO, Validate } = _ModuleSupport;

const VALID_COLOR = '#2196f3';
const INVALID_COLOR = '#8a8a8a';

export class ZoomRect extends _ModuleSupport.Rect {
    static override readonly className = 'ZoomRect';

    @Validate(COLOR_STRING)
    public override fill = VALID_COLOR;

    @Validate(RATIO)
    public override fillOpacity = 0.2;

    public updateValid() {
        this.fill = VALID_COLOR;
    }

    public updateInvalid() {
        this.fill = INVALID_COLOR;
    }
}
