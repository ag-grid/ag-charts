import { _ModuleSupport } from 'ag-charts-community';

const VALID_COLOR = '#2196f3';
const INVALID_COLOR = '#8a8a8a';

export class ZoomRect extends _ModuleSupport.Rect {
    static override readonly className = 'ZoomRect';

    constructor() {
        super();
        this.fill = VALID_COLOR;
        this.fillOpacity = 0.2;
        this.zIndex = _ModuleSupport.ZIndexMap.ZOOM_SELECTION;
    }

    public updateValid() {
        this.fill = VALID_COLOR;
    }

    public updateInvalid() {
        this.fill = INVALID_COLOR;
    }
}
