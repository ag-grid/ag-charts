import type { BBox } from '../../scene/bbox';
import type { DataService } from '../data/dataService';
import type { DOMManager } from '../dom/domManager';
import type { AnimationManager } from '../interaction/animationManager';
import type { LayoutCompleteEvent, LayoutService } from '../layout/layoutService';
import type { ChartOverlays } from '../overlay/chartOverlays';
import { DEFAULT_OVERLAY_CLASS, DEFAULT_OVERLAY_DARK_CLASS, type Overlay } from '../overlay/overlay';
import type { ChartLike, UpdateProcessor } from './processor';

const defaultOverlayCss = `
.${DEFAULT_OVERLAY_CLASS} {
    color: #181d1f;
}

.${DEFAULT_OVERLAY_CLASS}.${DEFAULT_OVERLAY_DARK_CLASS} {
    color: #ffffff;
}

.${DEFAULT_OVERLAY_CLASS}--loading {
    color: rgb(140, 140, 140); /* DEFAULT_MUTED_LABEL_COLOUR */
}

.${DEFAULT_OVERLAY_CLASS}__loading-background {
    background: white; /* DEFAULT_BACKGROUND_FILL */
}

.${DEFAULT_OVERLAY_CLASS}.${DEFAULT_OVERLAY_DARK_CLASS} .${DEFAULT_OVERLAY_CLASS}__loading-background {
    background: #192232; /* DEFAULT_DARK_BACKGROUND_FILL */
}
`;

export class OverlaysProcessor<D extends object> implements UpdateProcessor {
    private destroyFns: (() => void)[] = [];

    constructor(
        private readonly chartLike: ChartLike,
        private readonly overlays: ChartOverlays,
        private readonly dataService: DataService<D>,
        private readonly layoutService: LayoutService,
        private readonly animationManager: AnimationManager,
        private readonly domManager: DOMManager
    ) {
        this.destroyFns.push(this.layoutService.addListener('layout-complete', (e) => this.onLayoutComplete(e)));
    }

    public destroy() {
        this.destroyFns.forEach((cb) => cb());
    }

    private onLayoutComplete({ series: { rect } }: LayoutCompleteEvent) {
        const isLoading = this.dataService.isLoading();
        const hasData = this.chartLike.series.some((s) => s.hasData);
        const anySeriesVisible = this.chartLike.series.some((s) => s.visible);

        this.toggleOverlay(this.overlays.loading, rect, isLoading);
        this.toggleOverlay(this.overlays.noData, rect, !isLoading && !hasData);
        this.toggleOverlay(this.overlays.noVisibleSeries, rect, hasData && !anySeriesVisible);
    }

    private toggleOverlay(overlay: Overlay, seriesRect: BBox, visible: boolean) {
        if (visible) {
            this.domManager.addStyles('overlays', defaultOverlayCss);
            const element = overlay.getElement(this.animationManager, seriesRect);
            this.domManager.addChild('canvas-overlay', 'overlay').appendChild(element);
        } else {
            overlay.removeElement(
                () => this.domManager.removeChild('canvas-overlay', 'overlay'),
                this.animationManager
            );
            this.domManager.removeStyles('overlays');
        }
    }
}
