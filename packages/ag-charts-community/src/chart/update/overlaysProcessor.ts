import type { DataService } from '../data/dataService';
import type { AnimationManager } from '../interaction/animationManager';
import type { LayoutService } from '../layout/layoutService';
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
        this.destroyFns.push(this.layoutService.addListener('layout-complete', () => this.onLayoutComplete()));
    }

    public destroy() {
        this.destroyFns.forEach((cb) => cb());
    }

    private onLayoutComplete() {
        const isLoading = this.dataService.isLoading();
        const hasData = this.chartLike.series.some((s) => s.data?.length);
        const anySeriesVisible = this.chartLike.series.some((s) => s.visible);

        this.toggleOverlay(this.overlays.loading, isLoading);
        this.toggleOverlay(this.overlays.noData, !isLoading && !hasData);
        this.toggleOverlay(this.overlays.noVisibleSeries, hasData && !anySeriesVisible);
    }

    private toggleOverlay(overlay: Overlay, visible: boolean) {
        if (visible) {
            const element = overlay.getElement(this.animationManager);
            (this.chartLike as any).element.append(element);
        } else {
            overlay.removeElement(this.animationManager);
        }
    }
}
