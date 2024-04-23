import { setAttribute } from '../../util/attributeUtil';
import { Debug } from '../../util/debug';
import { getDocument } from '../../util/dom';

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

    constructor(private readonly canvas: HTMLCanvasElement) {
        this.canvas.appendChild((this.liveElem = AriaAnnouncementService.createAnnouncer()));
    }

    destroy() {
        this.canvas.removeChild(this.liveElem);
    }

    public announceValue(value: string): void {
        this.debug(`AriaAnnouncementService - announceValue: ${value}`);
        setAttribute(this.liveElem, 'aria-label', value);
    }
}
