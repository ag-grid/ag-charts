import type { BBox } from '../../scene/bbox';
import type { DataService } from '../data/dataService';
import type { AnimationManager } from '../interaction/animationManager';
import type { LayoutCompleteEvent, LayoutService } from '../layout/layoutService';
import type { ChartOverlays } from '../overlay/chartOverlays';
import type { Overlay } from '../overlay/overlay';
import type { ChartLike, UpdateProcessor } from './processor';

export class OverlaysProcessor<D extends object> implements UpdateProcessor {
    private destroyFns: (() => void)[] = [];

    constructor(
        private readonly chartLike: ChartLike,
        private readonly overlays: ChartOverlays,
        private readonly dataService: DataService<D>,
        private readonly layoutService: LayoutService,
        private readonly animationManager: AnimationManager
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
            const element = overlay.getElement(this.animationManager, seriesRect);
            (this.chartLike as any).element.append(element);
        } else {
            overlay.removeElement(this.animationManager);
        }
    }
}
