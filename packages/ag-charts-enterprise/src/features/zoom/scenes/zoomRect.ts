import { _ModuleSupport } from 'ag-charts-community';

const { COLOR_STRING, RATIO, TempValidate } = _ModuleSupport;

const VALID_COLOR = '#2196f3';
const INVALID_COLOR = '#8a8a8a';

export class ZoomRect extends _ModuleSupport.Rect {
    static override readonly className = 'ZoomRect';

    @TempValidate(COLOR_STRING)
    public override fill = VALID_COLOR;

    @TempValidate(RATIO)
    public override fillOpacity = 0.2;

    override zIndex = _ModuleSupport.ZIndexMap.ZOOM_SELECTION;

    public updateValid() {
        this.fill = VALID_COLOR;
    }

    public updateInvalid() {
        this.fill = INVALID_COLOR;
    }
}
