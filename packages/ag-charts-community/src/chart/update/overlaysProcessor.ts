import { CleanupRegistry } from 'ag-charts-core';

import type { EventsHub, LayoutCompleteEvent } from '../../core/eventsHub';
import type { DOMElementProxy } from '../../dom/domElementProxy';
import type { DOMManager } from '../../dom/domManager';
import type { LocaleManager } from '../../locale/localeManager';
import type { BBox } from '../../scene/bbox';
import { isUnsupportedBrowser } from '../../util/browser';
import type { DataService } from '../data/dataService';
import type { AnimationManager } from '../interaction/animationManager';
import type { ChartOverlays } from '../overlay/chartOverlays';
import { DEFAULT_OVERLAY_CLASS, DEFAULT_OVERLAY_DARK_CLASS, type Overlay } from '../overlay/overlay';
import type { ChartLike, UpdateProcessor } from './processor';

const visibleIgnoredSeries = new Set(['map-shape-background', 'map-line-background']);

type OverlayState = 'loading' | 'no-data' | 'no-visible-series' | 'unsupported-browser' | undefined;

export class OverlaysProcessor<D extends object> implements UpdateProcessor {
    private readonly cleanup = new CleanupRegistry();
    private readonly overlayElem: DOMElementProxy;

    private overlayState: OverlayState = undefined;

    constructor(
        private readonly chartLike: ChartLike,
        private readonly overlays: ChartOverlays,
        private readonly eventsHub: EventsHub,
        private readonly dataService: DataService<D>,
        private readonly localeManager: LocaleManager,
        private readonly animationManager: AnimationManager,
        private readonly domManager: DOMManager
    ) {
        this.overlayElem = this.domManager.addProxyChild('canvas-overlay', 'overlay');
        this.overlayElem.setAttr('role', 'status');
        this.overlayElem.setAttr('aria-atomic', 'false');
        this.overlayElem.setAttr('aria-live', 'polite');
        this.overlayElem.toggleClass(DEFAULT_OVERLAY_CLASS, true);
        this.cleanup.register(this.eventsHub.on('layout:complete', (e) => this.onLayoutComplete(e)));
    }

    public destroy() {
        this.cleanup.flush();
        this.domManager.removeChild('canvas-overlay', 'overlay');
    }

    private onLayoutComplete({ series: { rect } }: LayoutCompleteEvent) {
        const isLoading = this.dataService.isLoading();
        const hasData = this.chartLike.series.some((s) => s.hasData);
        const anySeriesVisible = this.chartLike.series.some((s) => s.visible && !visibleIgnoredSeries.has(s.type));

        this.overlayElem.toggleClass(DEFAULT_OVERLAY_DARK_CLASS, this.overlays.darkTheme);
        this.overlayElem.setProperty('left', `${rect.x}px`);
        this.overlayElem.setProperty('top', `${rect.y}px`);
        this.overlayElem.setProperty('width', `${rect.width}px`);
        this.overlayElem.setProperty('height', `${rect.height}px`);

        let newOverlayState: OverlayState;

        if (isLoading) {
            newOverlayState = 'loading';
        } else if (!hasData) {
            newOverlayState = 'no-data';
        } else if (!anySeriesVisible) {
            newOverlayState = 'no-visible-series';
        } else if (this.overlays.unsupportedBrowser.enabled && isUnsupportedBrowser()) {
            newOverlayState = 'unsupported-browser';
        }

        // Only remove the existing overlay if the state changes.
        if (newOverlayState !== this.overlayState) {
            const prev = this.getOverlayFromState(this.overlayState);
            if (prev) this.hideOverlay(prev);

            this.overlayState = newOverlayState;
        }

        // Always update the overlay to reposition it if the rect changes.
        const next = this.getOverlayFromState(this.overlayState);
        if (next) this.showOverlay(next, rect);

        this.overlayElem.setAttr('aria-hidden', String(this.overlayState == null));
    }

    private getOverlayFromState(state: OverlayState) {
        switch (state) {
            case 'loading':
                return this.overlays.loading;
            case 'no-data':
                return this.overlays.noData;
            case 'no-visible-series':
                return this.overlays.noVisibleSeries;
            case 'unsupported-browser':
                return this.overlays.unsupportedBrowser;
        }
    }

    private showOverlay(overlay: Overlay, seriesRect: BBox) {
        if (!overlay.enabled) return;

        const element = overlay.getElement(this.chartLike, this.animationManager, this.localeManager, seriesRect);
        this.overlayElem.appendChild(element);
    }

    private hideOverlay(overlay: Overlay) {
        // AG-11424 Frustratingly, browsers do not reliably announce aria-live changes to overlayElem when
        // re-adding an identical element. This seems that if, for example, the user toggle the last visible
        // series off/on/off, then the second "No visible series" overlay announcement may not get fired.
        // Firefox & Safari seem to handle this correctly, whereas Chromium does not. However setting the
        // content to a No-Break Space helps the browser to understand that the aria status has changed,
        // and also tells the no screenreader not to announce anything because it's just whitespace.
        overlay.removeElement(() => {
            this.overlayElem.innerText = '\xA0';
        }, this.animationManager);
    }
}
