import { Overlay } from './overlay';

export class ChartOverlays {
    constructor(parent: HTMLElement) {
        this.noData = new Overlay('ag-chart-no-data-overlay', parent);
        this.noVisibleSeries = new Overlay('ag-chart-no-visible-series', parent);
        this.noVisibleSeries.text = 'No visible series';
    }

    noData: Overlay;
    noVisibleSeries: Overlay;

    public destroy() {
        this.noData.hide();
        this.noVisibleSeries.hide();
    }
}
