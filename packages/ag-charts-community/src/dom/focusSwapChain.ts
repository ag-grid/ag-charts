import { setAttribute, setAttributes, setElementStyle, setElementStyles } from '../util/attributeUtil';
import { createElement } from '../util/dom';

/**
 * The most reliable way to assertively announcer label changes on an element is
 * to fire a focus() change.  Therefore, this class uses a roving tab index on
 * two identical divs to accomplish this.
 */
export class FocusSwapChain {
    private inactiveAnnouncer: HTMLElement;
    private activeAnnouncer: HTMLElement;
    private focusedAnnouncer?: EventTarget;

    private readonly listeners: { [K in 'blur' | 'focus']: ((e: FocusEvent) => unknown)[] } = { blur: [], focus: [] };
    private stopOnFocusReentrance = false;

    private readonly onBlur = (e: FocusEvent) => {
        this.focusedAnnouncer = undefined;
        if (e.relatedTarget !== this.activeAnnouncer) {
            this.dispatch('blur', e);
        }
    };
    private readonly onFocus = (e: FocusEvent) => {
        const skipDispatch = this.stopOnFocusReentrance || this.focusedAnnouncer !== undefined;
        this.focusedAnnouncer = e.target ?? undefined;
        if (!skipDispatch) {
            this.dispatch('focus', e);
        }
    };

    private createAnnouncer(announcerId: string, labelId: string) {
        const announcer = createElement('div');
        setAttributes(announcer, { id: announcerId, 'aria-labelledby': labelId });
        setElementStyles(announcer, { position: 'absolute', width: '100%', height: '100%' });
        announcer.addEventListener('blur', this.onBlur);
        announcer.addEventListener('focus', this.onFocus);
        return announcer;
    }

    constructor(
        private label1: HTMLElement,
        private label2: HTMLElement,
        id: string
    ) {
        setAttribute(this.label1, 'id', `${id}-label1`);
        setAttribute(this.label2, 'id', `${id}-label2`);
        setElementStyle(this.label1, 'display', 'none');
        setElementStyle(this.label2, 'display', 'none');

        this.activeAnnouncer = this.createAnnouncer(`${id}-announcer1`, this.label1.id);
        this.inactiveAnnouncer = this.createAnnouncer(`${id}-announcer2`, this.label2.id);

        this.label2.insertAdjacentElement('afterend', this.activeAnnouncer);
        this.label2.insertAdjacentElement('afterend', this.inactiveAnnouncer);
        this.swap('');
    }

    destroy() {
        for (const announcer of [this.activeAnnouncer, this.inactiveAnnouncer]) {
            announcer.removeEventListener('blur', this.onBlur);
            announcer.removeEventListener('focus', this.onFocus);
            announcer.remove();
        }
    }

    resizeContainer(dims: { width: number; height: number }) {
        const parent = this.label1.parentElement!;
        if (parent) {
            parent.style.width = `${dims.width}px`;
            parent.style.height = `${dims.height}px`;
        }
    }

    focus() {
        this.activeAnnouncer.focus();
    }

    update(newLabel: string) {
        this.stopOnFocusReentrance = true;
        this.swap(newLabel);
        if (this.focusedAnnouncer) {
            this.activeAnnouncer.focus();
        }
        this.stopOnFocusReentrance = false;
    }

    addListener(type: 'focus' | 'blur', handler: (event: FocusEvent) => unknown): void {
        this.listeners[type].push(handler);
    }

    private dispatch(type: 'focus' | 'blur', event: FocusEvent): void {
        this.listeners[type].forEach((fn) => fn(event));
    }

    private swap(newLabel: string) {
        this.label2.textContent = newLabel;
        [this.inactiveAnnouncer, this.activeAnnouncer] = [this.activeAnnouncer, this.inactiveAnnouncer];
        [this.label1, this.label2] = [this.label2, this.label1];
        setAttributes(this.inactiveAnnouncer, { tabindex: -1, 'aria-labelledby': this.label1.id });
        setAttributes(this.activeAnnouncer, { tabindex: 0, 'aria-labelledby': this.label1.id });
    }
}
