import { CleanupRegistry } from 'ag-charts-core';

import type { EventsHub, LayoutCompleteEvent } from '../../core/eventsHub';
import type { DOMElementProxy } from '../../dom/domElementProxy';
import type { DOMManager } from '../../dom/domManager';
import type { LocaleManager } from '../../locale/localeManager';
import { BBox } from '../../scene/bbox';
import { isUnsupportedBrowser } from '../../util/browser';
import type { DataService } from '../data/dataService';
import type { AnimationManager } from '../interaction/animationManager';
import type { ChartOverlays } from '../overlay/chartOverlays';
import { DEFAULT_OVERLAY_CLASS, DEFAULT_OVERLAY_DARK_CLASS, type Overlay } from '../overlay/overlay';
import type { ValidationIssueCollector } from '../validation/validationIssueCollector';
import type { ChartLike, UpdateProcessor } from './processor';

const visibleIgnoredSeries = new Set(['map-shape-background', 'map-line-background']);

type OverlayState = 'validation' | 'loading' | 'no-data' | 'no-visible-series' | 'unsupported-browser' | undefined;

export class OverlaysProcessor<D extends object> implements UpdateProcessor {
    private readonly cleanup = new CleanupRegistry();
    private readonly overlayElem: DOMElementProxy;

    private overlayState: OverlayState = undefined;
    private overlayMounted = false;
    private lastSeriesRect?: BBox;
    private lastChartRect?: BBox;

    constructor(
        private readonly chartLike: ChartLike,
        private readonly overlays: ChartOverlays,
        private readonly eventsHub: EventsHub,
        private readonly dataService: DataService<D>,
        private readonly localeManager: LocaleManager,
        private readonly animationManager: AnimationManager,
        private readonly domManager: DOMManager,
        private readonly validationCollector: ValidationIssueCollector
    ) {
        this.overlayElem = this.domManager.addProxyChild('canvas-overlay', 'overlay');
        this.overlayElem.setAttr('role', 'status');
        this.overlayElem.setAttr('aria-atomic', 'false');
        this.overlayElem.setAttr('aria-live', 'polite');
        this.overlayElem.toggleClass(DEFAULT_OVERLAY_CLASS, true);
        this.cleanup.register(
            this.eventsHub.on('layout:complete', (e) => this.onLayoutComplete(e)),
            this.eventsHub.on('canvas:resize', (e) => this.onCanvasResize(e)),
            this.validationCollector.addListener(() => this.onValidationChange())
        );
    }

    public destroy() {
        this.cleanup.flush();
        this.domManager.removeChild('canvas-overlay', 'overlay');
    }

    private onLayoutComplete({ chart, series: { rect } }: LayoutCompleteEvent) {
        this.lastSeriesRect = rect;
        this.lastChartRect = new BBox(0, 0, chart.width, chart.height);
        this.refresh(rect);
    }

    // An erroring chart's caught update emits no layout:complete, so the shown validation overlay must
    // re-anchor to the resize itself or it stays frozen at its pre-resize size.
    private onCanvasResize({ width, height }: { width: number; height: number }) {
        this.lastChartRect = new BBox(0, 0, width, height);
        if (this.overlayState === 'validation') {
            this.refresh(this.lastSeriesRect ?? this.lastChartRect, false);
        }
    }

    // Validation issues arise off-cycle from layout, so re-evaluate on collection change. Before the
    // first layout there is no series rect, so fall back to the full container area.
    private onValidationChange() {
        const rect = this.lastSeriesRect ?? this.fullContainerRect();
        if (rect) {
            this.refresh(rect, false);
        }
    }

    private fullContainerRect(): BBox | undefined {
        const size = this.domManager.containerSize;
        return size ? new BBox(0, 0, size.width, size.height) : undefined;
    }

    private refresh(rect: BBox, seriesStateCurrent = true) {
        const newOverlayState = this.selectOverlayState(seriesStateCurrent);

        // The validation overlay spans the whole chart, so it anchors to the scene rect: canvas space,
        // which width/height options can shrink below the DOM container.
        const overlayRect =
            newOverlayState === 'validation' ? (this.lastChartRect ?? this.fullContainerRect() ?? rect) : rect;

        this.overlayElem.toggleClass(DEFAULT_OVERLAY_DARK_CLASS, this.overlays.darkTheme);
        this.overlayElem.setProperty('left', `${overlayRect.x}px`);
        this.overlayElem.setProperty('top', `${overlayRect.y}px`);
        this.overlayElem.setProperty('width', `${overlayRect.width}px`);
        this.overlayElem.setProperty('height', `${overlayRect.height}px`);

        // Only remove the existing overlay if the state changes.
        if (newOverlayState !== this.overlayState) {
            const prev = this.getOverlayFromState(this.overlayState);
            if (prev) this.hideOverlay(prev, seriesStateCurrent);

            this.overlayState = newOverlayState;
            this.overlayMounted = false;
        }

        // Re-creating an element restarts its fade-in, so the loading overlay — whose content is fixed
        // — mounts once; every other overlay derives content from live state and must re-render.
        const next = this.getOverlayFromState(this.overlayState);
        if (next) {
            const mountOnce = this.overlayState === 'loading';
            if (next.enabled && !(mountOnce && this.overlayMounted)) {
                this.showOverlay(next, overlayRect);
                this.overlayMounted = true;
            } else if (!next.enabled && this.overlayMounted) {
                this.hideOverlay(next, seriesStateCurrent);
                this.overlayMounted = false;
            } else if (this.overlayMounted) {
                // Mounted and intentionally not re-rendered: keep the focus rect current.
                next.reposition(overlayRect);
            }
        }

        this.overlayElem.setAttr('aria-hidden', String(this.overlayState == null));
    }

    // Validation takes strict priority and suppresses the loading/no-data/no-visible-series overlays.
    private selectOverlayState(seriesStateCurrent: boolean): OverlayState {
        if (this.validationCollector.hasVisibleIssues()) {
            return 'validation';
        }
        if (this.dataService.isLoading()) {
            return 'loading';
        }
        // Off-cycle the series still describe the previous update, so hold the last layout's verdict.
        if (!seriesStateCurrent) {
            return this.overlayState === 'validation' || this.overlayState === 'loading'
                ? undefined
                : this.overlayState;
        }
        if (this.lastSeriesRect == null) {
            return undefined;
        }
        if (!this.chartLike.series.some((s) => s.hasData)) {
            return 'no-data';
        }
        if (!this.chartLike.series.some((s) => s.visible && !visibleIgnoredSeries.has(s.type))) {
            return 'no-visible-series';
        }
        if (this.overlays.unsupportedBrowser.enabled && isUnsupportedBrowser()) {
            return 'unsupported-browser';
        }
        return undefined;
    }

    private getOverlayFromState(state: OverlayState) {
        switch (state) {
            case 'validation':
                return this.overlays.validation;
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
        const element = overlay.getElement(this.chartLike, this.animationManager, this.localeManager, seriesRect);
        // Must clear after getElement(), which can itself write hideOverlay's placeholder text node —
        // left in the flow it displaces this absolutely-positioned content by a line box.
        this.overlayElem.replaceChildren(element);
    }

    // Off an update cycle (e.g. a user dismiss) nothing drives the removal animation's batch, so its
    // cleanup — which detaches the element — never runs; remove synchronously there instead of animating.
    private hideOverlay(overlay: Overlay, animate = true) {
        // Chromium skips the aria-live announcement when an identical overlay element is re-added;
        // interposing a no-break space marks the status as changed without announcing anything.
        overlay.removeElement(
            () => {
                this.overlayElem.innerText = '\xA0';
            },
            animate ? this.animationManager : undefined
        );
    }
}
