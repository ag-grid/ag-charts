import { _ModuleSupport } from 'ag-charts-community';

const { Property } = _ModuleSupport;

const VALID_COLOR = '#2196f3';
const INVALID_COLOR = '#8a8a8a';

export class ZoomRect extends _ModuleSupport.Rect {
    static override readonly className = 'ZoomRect';

    @Property
    public override fill = VALID_COLOR;

    @Property
    public override fillOpacity = 0.2;

    override zIndex = _ModuleSupport.ZIndexMap.ZOOM_SELECTION;

    public updateValid() {
        this.fill = VALID_COLOR;
    }

    public updateInvalid() {
        this.fill = INVALID_COLOR;
    }
}
