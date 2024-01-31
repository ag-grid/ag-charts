import { injectStyle } from '../../util/dom';
import type { AnimationManager } from '../interaction/animationManager';
import { DEFAULT_OVERLAY_CLASS, DEFAULT_OVERLAY_DARK_CLASS, Overlay } from './overlay';

const defaultOverlayCss = `
.${DEFAULT_OVERLAY_CLASS} {
    color: #181d1f;
}

.${DEFAULT_OVERLAY_CLASS}.${DEFAULT_OVERLAY_DARK_CLASS} {
    color: #ffffff;
}
`;

export class ChartOverlays {
    private static overlayDocuments: Document[] = [];

    constructor(parent: HTMLElement, animationManager: AnimationManager) {
        this.noData = new Overlay('ag-chart-no-data-overlay', parent, animationManager);
        this.noVisibleSeries = new Overlay('ag-chart-no-visible-series', parent, animationManager);
        this.noVisibleSeries.text = 'No visible series';

        if (ChartOverlays.overlayDocuments.indexOf(document) < 0) {
            injectStyle(document, defaultOverlayCss);
            ChartOverlays.overlayDocuments.push(document);
        }
    }

    noData: Overlay;
    noVisibleSeries: Overlay;

    public destroy() {
        this.noData.hide();
        this.noVisibleSeries.hide();
    }
}
