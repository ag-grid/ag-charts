import { setAttribute } from '../../util/attributeUtil';
import { Debug } from '../../util/debug';
import { getDocument } from '../../util/dom';
import type { DOMManager } from '../dom/domManager';
import type { LayoutCompleteEvent, LayoutManager } from '../layout/layoutManager';
import type { LocaleManager } from '../locale/localeManager';

export class AriaAnnouncementService {
    private readonly liveElem: HTMLElement;
    private readonly debug = Debug.create(true, 'aria');
    private readonly destroyFns: (() => void)[] = [];

    private static createAnnouncer(): HTMLElement {
        const e = getDocument().createElement('div');
        e.classList.add('ag-charts-aria-announcer');
        setAttribute(e, 'role', 'status');
        setAttribute(e, 'aria-live', 'assertive');
        return e;
    }

    constructor(
        private readonly localeManager: LocaleManager,
        private readonly domManager: DOMManager,
        private readonly layoutManager: LayoutManager
    ) {
        this.liveElem = AriaAnnouncementService.createAnnouncer();
        this.domManager.addChild('canvas-proxy', 'ag-charts-canvas-proxy', this.liveElem);
        this.destroyFns.push(
            this.layoutManager.addListener('layout:complete', (ev) => this.onResize(ev)),
            () => this.domManager.removeChild('canvas-proxy', 'ag-charts-canvas-proxy')
        );
    }

    destroy() {
        this.destroyFns.forEach((fn) => fn());
    }

    onResize(event: LayoutCompleteEvent) {
        this.liveElem.style.width = `${event.chart.width}px`;
        this.liveElem.style.height = `${event.chart.height}px`;
    }

    announceValue(id: string, params?: Record<string, any>): void {
        const { localeManager, liveElem } = this;
        const value = localeManager.t(id, params);
        this.debug(`AriaAnnouncementService - announceValue: ${value}`);

        liveElem.textContent = '\u00A0'; // NO-BREAK SPACE
        setTimeout(() => (liveElem.innerText = value), 16);
    }
}
