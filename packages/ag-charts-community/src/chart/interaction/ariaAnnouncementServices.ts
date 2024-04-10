import { getDocument } from '../../util/dom';

export class AriaAnnouncementService {
    private readonly liveElem: HTMLElement;

    private static createAnnouncer(): HTMLElement {
        const e = getDocument().createElement('div');
        e.classList.add('ag-charts-aria-announcer');
        e.setAttribute('role', 'status');
        e.setAttribute('aria-live', 'polite');
        return e;
    }

    constructor(private readonly container: HTMLElement) {
        this.container.appendChild((this.liveElem = AriaAnnouncementService.createAnnouncer()));
    }

    destroy() {
        this.container.removeChild(this.liveElem);
    }

    public announceValue(value: string): void {
        this.liveElem.setAttribute('aria-label', value);
    }
}
