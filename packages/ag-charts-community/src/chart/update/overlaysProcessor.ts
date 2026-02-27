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

export class OverlaysProcessor<D extends object> implements UpdateProcessor {
    private readonly cleanup = new CleanupRegistry();
    private readonly overlayElem: DOMElementProxy;

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

        const loadingShown = isLoading;
        const noDataShown = !isLoading && !hasData;
        const noVisibleSeriesShown = hasData && !anySeriesVisible;
        const unsupportedBrowser = this.overlays.unsupportedBrowser.enabled && isUnsupportedBrowser();

        if (loadingShown) {
            this.showOverlay(this.overlays.loading, rect);
        } else {
            this.hideOverlay(this.overlays.loading);
        }

        if (noDataShown) {
            this.showOverlay(this.overlays.noData, rect);
        } else {
            this.hideOverlay(this.overlays.noData);
        }

        if (noVisibleSeriesShown) {
            this.showOverlay(this.overlays.noVisibleSeries, rect);
        } else {
            this.hideOverlay(this.overlays.noVisibleSeries);
        }

        if (unsupportedBrowser) {
            this.showOverlay(this.overlays.unsupportedBrowser, rect);
        } else {
            this.hideOverlay(this.overlays.unsupportedBrowser);
        }

        const shown = loadingShown || noDataShown || noVisibleSeriesShown || unsupportedBrowser;
        this.overlayElem.setAttr('aria-hidden', String(!shown));
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
