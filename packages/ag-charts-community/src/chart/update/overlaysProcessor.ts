import type { BBox } from '../../scene/bbox';
import type { DataService } from '../data/dataService';
import type { DOMManager } from '../dom/domManager';
import type { AnimationManager } from '../interaction/animationManager';
import type { LayoutCompleteEvent, LayoutService } from '../layout/layoutService';
import type { LocaleManager } from '../locale/localeManager';
import type { ChartOverlays } from '../overlay/chartOverlays';
import { DEFAULT_OVERLAY_CLASS, DEFAULT_OVERLAY_DARK_CLASS, type Overlay } from '../overlay/overlay';
import defaultOverlayCss from './overlaysProcessor.css';
import type { ChartLike, UpdateProcessor } from './processor';

export class OverlaysProcessor<D extends object> implements UpdateProcessor {
    private readonly destroyFns: (() => void)[] = [];
    private readonly overlayElem: HTMLElement;

    constructor(
        private readonly chartLike: ChartLike,
        private readonly overlays: ChartOverlays,
        private readonly dataService: DataService<D>,
        private readonly layoutService: LayoutService,
        private readonly localeManager: LocaleManager,
        private readonly animationManager: AnimationManager,
        private readonly domManager: DOMManager
    ) {
        this.overlayElem = this.domManager.addChild('canvas-overlay', 'overlay');
        this.overlayElem.role = 'status';
        this.overlayElem.ariaAtomic = 'false';
        this.overlayElem.ariaLive = 'polite';
        this.overlayElem.classList.toggle(DEFAULT_OVERLAY_CLASS);
        this.domManager.addStyles('overlays', defaultOverlayCss);
        this.destroyFns.push(this.layoutService.addListener('layout-complete', (e) => this.onLayoutComplete(e)));
    }

    public destroy() {
        this.destroyFns.forEach((cb) => cb());
        this.domManager.removeStyles('overlays');
        this.domManager.removeChild('canvas-overlay', 'overlay');
    }

    private onLayoutComplete({ series: { rect } }: LayoutCompleteEvent) {
        const isLoading = this.dataService.isLoading();
        const hasData = this.chartLike.series.some((s) => s.hasData);
        const anySeriesVisible = this.chartLike.series.some((s) => s.visible);

        if (this.overlays.darkTheme) {
            this.overlayElem.classList.add(DEFAULT_OVERLAY_DARK_CLASS);
        } else {
            this.overlayElem.classList.remove(DEFAULT_OVERLAY_DARK_CLASS);
        }
        this.overlayElem.style.left = `${rect.x}px`;
        this.overlayElem.style.top = `${rect.y}px`;
        this.overlayElem.style.width = `${rect.width}px`;
        this.overlayElem.style.height = `${rect.height}px`;

        this.toggleOverlay(this.overlays.loading, rect, isLoading);
        this.toggleOverlay(this.overlays.noData, rect, !isLoading && !hasData);
        this.toggleOverlay(this.overlays.noVisibleSeries, rect, hasData && !anySeriesVisible);
    }

    private toggleOverlay(overlay: Overlay, seriesRect: BBox, visible: boolean) {
        if (visible) {
            const element = overlay.getElement(this.animationManager, this.localeManager, seriesRect);
            this.overlayElem.appendChild(element);
        } else {
            // AG-11424 Frustratingly, browsers do not reliable announce aria-live changes to overlayElem when
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
}
