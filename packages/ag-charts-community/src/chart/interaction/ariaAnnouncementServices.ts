import { setAttribute } from '../../util/attributeUtil';
import { getDocument } from '../../util/dom';

export class AriaAnnouncementService {
    private readonly liveElem: HTMLElement;

    private static createAnnouncer(): HTMLElement {
        const e = getDocument().createElement('div');
        e.classList.add('ag-charts-aria-announcer');
        setAttribute(e, 'role', 'status');
        setAttribute(e, 'aria-live', 'polite');
        return e;
    }

    constructor(private readonly canvas: HTMLCanvasElement) {
        this.canvas.appendChild((this.liveElem = AriaAnnouncementService.createAnnouncer()));
    }

    destroy() {
        this.canvas.removeChild(this.liveElem);
    }

    public announceValue(value: string): void {
        setAttribute(this.liveElem, 'aria-label', value);
    }

    public announceHtml(html: string): void {
        const tmp = getDocument().createElement('div');
        tmp.innerHTML = html;
        this.announceValue(tmp.textContent ?? '');
    }
}
