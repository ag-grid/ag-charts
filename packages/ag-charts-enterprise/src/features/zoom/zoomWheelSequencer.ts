import type { _Widget } from 'ag-charts-community';
import { debounce } from 'ag-charts-core';

export type ZoomWheelSequencerCbResult = 'abort' | 'capped' | 'uncapped';

export type ZoomWheelSequencerCb = () => ZoomWheelSequencerCbResult;

export class ZoomWheelSequencer {
    private isFirstWheelEvent = true;
    private wasFirstWheelEventZoomCapped?: boolean;
    private firstWheelEventDirection?: boolean;
    private readonly debouncedWheelReset = debounce(() => {
        this.isFirstWheelEvent = true;
        this.wasFirstWheelEventZoomCapped = undefined;
    }, 100);

    public onWheel(event: _Widget.WheelWidgetEvent, callback: ZoomWheelSequencerCb) {
        const result = callback();
        if (result === 'abort') return;

        const isZoomCapped: boolean = (result satisfies 'capped' | 'uncapped') === 'capped';

        // Prevent browser scrolling when the user scrolls over the chart and zooming is possible. If the scroll
        // direction changes, treat it as a new scroll event.
        if (this.firstWheelEventDirection != null && this.firstWheelEventDirection !== event.deltaY < 0) {
            this.isFirstWheelEvent = true;
        }

        if (this.isFirstWheelEvent) {
            this.wasFirstWheelEventZoomCapped = isZoomCapped;
            this.firstWheelEventDirection = event.deltaY < 0;
            if (!isZoomCapped) {
                event.sourceEvent.preventDefault();
            }
        } else if (this.wasFirstWheelEventZoomCapped === false) {
            event.sourceEvent.preventDefault();
        }

        // Prevent browser scrolling when smooth wheel events continue being fired after the chart
        // reaches a min or max extent
        this.isFirstWheelEvent = false;
        this.debouncedWheelReset();
    }
}
