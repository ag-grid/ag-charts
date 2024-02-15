import type { BBox } from '../../scene/bbox';
import type { DataService } from '../data/dataService';
import type { LayoutCompleteEvent, LayoutService } from '../layout/layoutService';
import type { ChartOverlays } from '../overlay/chartOverlays';
import type { Overlay } from '../overlay/overlay';
import type { ChartLike, UpdateProcessor } from './processor';

export class OverlaysProcessor<D extends object> implements UpdateProcessor {
    private destroyFns: (() => void)[] = [];

    constructor(
        private chartLike: ChartLike,
        private readonly overlays: ChartOverlays,
        private readonly dataService: DataService<D>,
        private readonly layoutService: LayoutService
    ) {
        this.destroyFns.push(this.layoutService.addListener('layout-complete', (ctx) => this.onLayoutComplete(ctx)));
    }

    public destroy() {
        this.destroyFns.forEach((cb) => cb());
    }

    private onLayoutComplete({ series: { rect } }: LayoutCompleteEvent) {
        const isLoading = this.dataService.isLoading();
        const hasData = this.chartLike.series.some((s) => s.data?.length);
        const anySeriesVisible = this.chartLike.series.some((s) => s.visible);

        this.toggleOverlay(this.overlays.loading, rect, isLoading);
        this.toggleOverlay(this.overlays.noData, rect, !isLoading && !hasData);
        this.toggleOverlay(this.overlays.noVisibleSeries, rect, hasData && !anySeriesVisible);
    }

    private toggleOverlay(overlay: Overlay, seriesRect: BBox, visible: boolean) {
        if (visible && seriesRect) {
            overlay.show(seriesRect);
        } else {
            overlay.hide();
        }
    }
}
