import type { AnimationManager } from '../interaction/animationManager';
import { Overlay } from './overlay';

export class ChartOverlays {
    constructor(parent: HTMLElement, animationManager: AnimationManager) {
        this.noData = new Overlay('ag-chart-no-data-overlay', parent, animationManager);
        this.noVisibleSeries = new Overlay('ag-chart-no-visible-series', parent, animationManager);
        this.noVisibleSeries.text = 'No visible series';
    }

    noData: Overlay;
    noVisibleSeries: Overlay;

    public destroy() {
        this.noData.hide();
        this.noVisibleSeries.hide();
    }
}
