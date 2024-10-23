import { type BaseAttributeTypeMap, setAttribute, setAttributes, setElementStyle } from '../util/attributeUtil';
import { createElement } from '../util/dom';

/**
 * The most reliable way to assertively announcer label changes on an element is
 * to fire a focus() change.  Therefore, this class uses a roving tab index on
 * two identical divs to accomplish this.
 */
export class FocusSwapChain {
    private inactiveAnnouncer: HTMLElement;
    private activeAnnouncer: HTMLElement;

    private hasFocus = false;
    private skipDispatch = false;

    private readonly listeners: { [K in 'blur' | 'focus']: ((e: FocusEvent) => unknown)[] } = { blur: [], focus: [] };
    private readonly onBlur = (e: FocusEvent) => !this.skipDispatch && this.dispatch('blur', e);
    private readonly onFocus = (e: FocusEvent) => !this.skipDispatch && this.dispatch('focus', e);

    private createAnnouncer(initialLabel: HTMLElement, role: BaseAttributeTypeMap['role']) {
        const announcer = createElement('div');
        announcer.className = 'ag-charts-swapchain';
        setAttributes(announcer, { role, 'aria-labelledby': initialLabel.id });
        announcer.addEventListener('blur', this.onBlur);
        announcer.addEventListener('focus', this.onFocus);
        return announcer;
    }

    constructor(
        private label1: HTMLElement,
        private label2: HTMLElement,
        id: string,
        announcerRole: BaseAttributeTypeMap['role']
    ) {
        setAttribute(this.label1, 'id', `${id}-label1`);
        setAttribute(this.label2, 'id', `${id}-label2`);
        setElementStyle(this.label1, 'display', 'none');
        setElementStyle(this.label2, 'display', 'none');

        this.activeAnnouncer = this.createAnnouncer(this.label1, announcerRole);
        this.inactiveAnnouncer = this.createAnnouncer(this.label1, announcerRole);

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

    setTabIndex(tabIndex: number) {
        this.activeAnnouncer.tabIndex = tabIndex;
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
        this.skipDispatch = true;
        this.swap(newLabel);
        if (this.hasFocus) {
            this.activeAnnouncer.focus();
        }
        this.skipDispatch = false;
        return this.activeAnnouncer;
    }

    addListener(type: 'focus' | 'blur', handler: (event: FocusEvent) => unknown): void {
        this.listeners[type].push(handler);
    }

    private dispatch(type: 'focus' | 'blur', event: FocusEvent): void {
        this.hasFocus = type === 'focus';
        this.listeners[type].forEach((fn) => fn(event));
    }

    private swap(newLabel: string) {
        const userTabIndex = this.activeAnnouncer.tabIndex;
        this.label2.textContent = newLabel;

        [this.inactiveAnnouncer, this.activeAnnouncer] = [this.activeAnnouncer, this.inactiveAnnouncer];
        [this.label1, this.label2] = [this.label2, this.label1];
        setAttributes(this.inactiveAnnouncer, { tabindex: -1, 'aria-labelledby': this.label1.id });
        setAttribute(this.activeAnnouncer, 'aria-labelledby', this.label1.id);
        this.activeAnnouncer.tabIndex = userTabIndex;
    }
}
