import { _ModuleSupport } from 'ag-charts-community';
import { ZIndexMap } from 'ag-charts-core';

import {
    SELECTION_FILLOPACITY,
    SELECTION_FILL_INVALID,
    SELECTION_FILL_VALID,
} from '../../data-selection/dataSelectionConstants';

export class ZoomRect extends _ModuleSupport.Rect {
    static override readonly className = 'ZoomRect';

    constructor() {
        super();
        this.fill = SELECTION_FILL_VALID;
        this.fillOpacity = SELECTION_FILLOPACITY;
        this.zIndex = ZIndexMap.ZOOM_SELECTION;
    }

    public updateValid() {
        this.fill = SELECTION_FILL_VALID;
    }

    public updateInvalid() {
        this.fill = SELECTION_FILL_INVALID;
    }
}
