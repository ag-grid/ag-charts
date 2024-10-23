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
    private focusedAnnouncer?: HTMLElement;

    private createAnnouncer(announcerId: string, labelId: string) {
        const announcer = createElement('div');
        setAttributes(announcer, { id: announcerId, 'aria-labelledby': labelId });
        setElementStyles(announcer, { position: 'absolute', width: '100%', height: '100%' });
        announcer.addEventListener('blur', () => (this.focusedAnnouncer = undefined));
        announcer.addEventListener('focus', () => (this.focusedAnnouncer = announcer));
        return announcer;
    }

    constructor(
        private readonly label: HTMLElement,
        id: string
    ) {
        this.activeAnnouncer = this.createAnnouncer(`${id}-announcer1`, id);
        this.inactiveAnnouncer = this.createAnnouncer(`${id}-announcer2`, id);

        setAttribute(this.label, 'id', id);
        setElementStyle(this.label, 'display', 'none');
        this.label.insertAdjacentElement('afterend', this.activeAnnouncer);
        this.label.insertAdjacentElement('afterend', this.inactiveAnnouncer);
        this.swap();
    }

    resizeContainer(dims: { width: number; height: number }) {
        const parent = this.label.parentElement!;
        if (parent) {
            parent.style.width = `${dims.width}px`;
            parent.style.height = `${dims.height}px`;
        }
    }

    focus() {
        this.activeAnnouncer.focus();
    }

    update(newLabel?: string) {
        if (newLabel && this.label.textContent !== newLabel) {
            this.label.textContent = newLabel;
            this.swap();
        }
        if (this.focusedAnnouncer) {
            this.activeAnnouncer.focus();
        }
    }

    private swap() {
        [this.inactiveAnnouncer, this.activeAnnouncer] = [this.activeAnnouncer, this.inactiveAnnouncer];
        setAttribute(this.inactiveAnnouncer, 'tabindex', -1);
        setAttribute(this.activeAnnouncer, 'tabindex', 0);
    }
}
