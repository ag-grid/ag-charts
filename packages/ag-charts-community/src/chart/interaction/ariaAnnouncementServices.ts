import { setAriaLabel, setAriaLive, setAriaRole } from '../../util/ariaUtil';
import { getDocument } from '../../util/dom';

export class AriaAnnouncementService {
    private readonly liveElem: HTMLElement;

    private static createAnnouncer(): HTMLElement {
        const e = getDocument().createElement('div');
        e.classList.add('ag-charts-aria-announcer');
        setAriaRole(e, 'status');
        setAriaLive(e, 'polite');
        return e;
    }

    constructor(private readonly canvas: HTMLCanvasElement) {
        this.canvas.appendChild((this.liveElem = AriaAnnouncementService.createAnnouncer()));
    }

    destroy() {
        this.canvas.removeChild(this.liveElem);
    }

    public announceValue(value: string): void {
        setAriaLabel(this.liveElem, value);
    }

    public announceHtml(html: string): void {
        const tmp = getDocument().createElement('div');
        tmp.innerHTML = html;
        this.announceValue(tmp.textContent ?? '');
    }
}
