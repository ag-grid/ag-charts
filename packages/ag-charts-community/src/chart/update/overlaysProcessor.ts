import type { BBox } from '../../scene/bbox';
import type { DataService } from '../data/dataService';
import type { DOMManager } from '../dom/domManager';
import type { AnimationManager } from '../interaction/animationManager';
import type { LayoutCompleteEvent, LayoutService } from '../layout/layoutService';
import type { LocaleManager } from '../locale/localeManager';
import type { ChartOverlays } from '../overlay/chartOverlays';
import { type Overlay } from '../overlay/overlay';
import defaultOverlayCss from './overlaysProcessor.css';
import type { ChartLike, UpdateProcessor } from './processor';

export class OverlaysProcessor<D extends object> implements UpdateProcessor {
    private readonly destroyFns: (() => void)[] = [];

    constructor(
        private readonly chartLike: ChartLike,
        private readonly overlays: ChartOverlays,
        private readonly dataService: DataService<D>,
        private readonly layoutService: LayoutService,
        private readonly localeManager: LocaleManager,
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
            const element = overlay.getElement(this.animationManager, this.localeManager, seriesRect);
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
