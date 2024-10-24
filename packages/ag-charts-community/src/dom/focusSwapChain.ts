import { type BaseAttributeTypeMap, setAttribute, setAttributes, setElementStyle } from '../util/attributeUtil';
import { createElement } from '../util/dom';

type SwapChainEventMap = { focus: FocusEvent; blur: FocusEvent; swap: HTMLElement };

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

    private readonly listeners: { [K in keyof SwapChainEventMap]: ((e: SwapChainEventMap[K]) => unknown)[] } = {
        blur: [],
        focus: [],
        swap: [],
    };
    private readonly onBlur = (e: FocusEvent) => !this.skipDispatch && this.dispatch('blur', e);
    private readonly onFocus = (e: FocusEvent) => !this.skipDispatch && this.dispatch('focus', e);

    private createAnnouncer(role: BaseAttributeTypeMap['role']) {
        const announcer = createElement('div');
        announcer.role = role;
        announcer.className = 'ag-charts-swapchain';
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

        this.activeAnnouncer = this.createAnnouncer(announcerRole);
        this.inactiveAnnouncer = this.createAnnouncer(announcerRole);

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
    }

    addListener<T extends keyof SwapChainEventMap>(type: T, handler: (param: SwapChainEventMap[T]) => unknown): void {
        this.listeners[type].push(handler);
        if (type === 'swap') {
            const swapHandler = handler as (p: SwapChainEventMap['swap']) => unknown;
            swapHandler(this.activeAnnouncer);
        }
    }

    private dispatch<T extends keyof SwapChainEventMap>(type: T, param: SwapChainEventMap[T]) {
        if (type === 'focus') this.hasFocus = true;
        else if (type === 'blur') this.hasFocus = false;
        this.listeners[type].forEach((fn) => fn(param));
    }

    private swap(newLabel: string) {
        const userTabIndex = this.activeAnnouncer.tabIndex;
        this.label2.textContent = newLabel;

        [this.inactiveAnnouncer, this.activeAnnouncer] = [this.activeAnnouncer, this.inactiveAnnouncer];
        [this.label1, this.label2] = [this.label2, this.label1];
        setAttributes(this.inactiveAnnouncer, { 'aria-labelledby': this.label1.id, 'aria-hidden': true, tabindex: -1 });
        setAttributes(this.activeAnnouncer, { 'aria-labelledby': this.label1.id, 'aria-hidden': false });
        setElementStyle(this.inactiveAnnouncer, 'pointer-events', 'none');
        setElementStyle(this.activeAnnouncer, 'pointer-events', undefined);

        this.activeAnnouncer.tabIndex = userTabIndex;
        this.dispatch('swap', this.activeAnnouncer);
    }
}