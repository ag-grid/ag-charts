import { setAttribute } from '../../util/attributeUtil';
import { Debug } from '../../util/debug';
import { getDocument } from '../../util/dom';
import type { LocaleManager } from '../locale/localeManager';

export class AriaAnnouncementService {
    private readonly liveElem: HTMLElement;
    private readonly debug = Debug.create(true, 'aria');

    private static createAnnouncer(): HTMLElement {
        const e = getDocument().createElement('div');
        e.classList.add('ag-charts-aria-announcer');
        setAttribute(e, 'role', 'status');
        setAttribute(e, 'aria-live', 'assertive');
        return e;
    }

    constructor(
        private readonly localeManager: LocaleManager,
        private readonly canvas: HTMLCanvasElement
    ) {
        this.canvas.appendChild((this.liveElem = AriaAnnouncementService.createAnnouncer()));
    }

    destroy() {
        this.canvas.removeChild(this.liveElem);
    }

    public announceValue(id: string, params?: Record<string, any>): void {
        const { localeManager, liveElem } = this;
        const value = localeManager.t(id, params);
        this.debug(`AriaAnnouncementService - announceValue: ${value}`);

        liveElem.textContent = '\u00A0'; // NO-BREAK SPACE
        setTimeout(() => (liveElem.innerText = value), 16);
    }
}
