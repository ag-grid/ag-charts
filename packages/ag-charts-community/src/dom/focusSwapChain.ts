import {
    type AgDocument,
    type BaseAttributeTypeMap,
    type StrictHTMLElement,
    createElementId,
    setAttribute,
    setAttributes,
    setElementStyle,
    toAgDocument,
} from 'ag-charts-core';

type SwapChainEventMap = { focus: FocusEvent; blur: FocusEvent; swap: HTMLElement };

/**
 * The most reliable way to assertively announcer label changes on an element is
 * to fire a focus() change.  Therefore, this class uses a roving tab index on
 * two identical divs to accomplish this.
 */
export class FocusSwapChain {
    private inactiveAnnouncer: HTMLElement & { tabIndex: 0 | -1 };
    private activeAnnouncer: HTMLElement & { tabIndex: 0 | -1 };
    readonly document: AgDocument;

    private focusOptions?: FocusOptions;
    private hasFocus = false;
    private skipDispatch = false;

    private readonly listeners: { [K in keyof SwapChainEventMap]: ((e: SwapChainEventMap[K]) => unknown)[] } = {
        blur: [],
        focus: [],
        swap: [],
    };
    private readonly onBlur = (e: FocusEvent) => {
        setElementStyle(e.target as HTMLElement, 'pointer-events', undefined);
        return !this.skipDispatch && this.dispatch('blur', e);
    };
    private readonly onFocus = (e: FocusEvent) => {
        setElementStyle(e.target as HTMLElement, 'pointer-events', 'auto');
        return !this.skipDispatch && this.dispatch('focus', e);
    };

    private createAnnouncer(role: BaseAttributeTypeMap['role']) {
        const announcer = this.document.createElement('div');
        announcer.role = role;
        announcer.className = 'ag-charts-swapchain';
        announcer.addEventListener('blur', this.onBlur);
        announcer.addEventListener('focus', this.onFocus);
        return announcer as typeof announcer & { tabIndex: 0 | -1 };
    }

    constructor(
        private label1: StrictHTMLElement,
        private label2: StrictHTMLElement,
        announcerRole: BaseAttributeTypeMap['role'],
        initialAltText: string
    ) {
        const resolvedDocument = toAgDocument(label1.ownerDocument);
        if (!resolvedDocument) {
            throw new Error('AG Charts - unable to resolve global document');
        }
        this.document = resolvedDocument;
        setAttribute(this.label1, 'id', createElementId());
        setAttribute(this.label2, 'id', createElementId());
        setElementStyle(this.label1, 'display', 'none');
        setElementStyle(this.label2, 'display', 'none');
        this.label1.textContent = initialAltText;
        this.label2.textContent = initialAltText;

        this.activeAnnouncer = this.createAnnouncer(announcerRole);
        this.inactiveAnnouncer = this.createAnnouncer(announcerRole);
        setAttribute(this.activeAnnouncer, 'tabindex', 0);

        this.label2.insertAdjacentElement('afterend', this.activeAnnouncer);
        this.label2.insertAdjacentElement('afterend', this.inactiveAnnouncer);
        this.swap(initialAltText);
    }

    destroy() {
        for (const announcer of [this.activeAnnouncer, this.inactiveAnnouncer]) {
            announcer.removeEventListener('blur', this.onBlur);
            announcer.removeEventListener('focus', this.onFocus);
            announcer.remove();
        }
    }

    focus(opts?: FocusOptions) {
        this.focusOptions = opts;
        this.activeAnnouncer.focus(opts);
        this.focusOptions = undefined;
    }

    update(newLabel: string) {
        this.skipDispatch = true;
        this.swap(newLabel);
        if (this.hasFocus) {
            this.activeAnnouncer.focus(this.focusOptions);
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
        for (const fn of this.listeners[type]) {
            fn(param);
        }
    }

    private swap(newLabel: string) {
        const userTabIndex = this.activeAnnouncer.tabIndex;
        this.label2.textContent = newLabel;

        [this.inactiveAnnouncer, this.activeAnnouncer] = [this.activeAnnouncer, this.inactiveAnnouncer];
        [this.label1, this.label2] = [this.label2, this.label1];
        setAttributes(this.inactiveAnnouncer, {
            'aria-labelledby': this.label1.id,
            'aria-hidden': true,
            tabindex: undefined,
        });
        setAttributes(this.activeAnnouncer, {
            'aria-labelledby': this.label1.id,
            'aria-hidden': false,
            tabindex: userTabIndex,
        });

        this.dispatch('swap', this.activeAnnouncer);
    }
}
