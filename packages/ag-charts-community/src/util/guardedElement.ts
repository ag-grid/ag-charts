export type GuardedElementProperties = {
    element: HTMLElement;
    topTabGuard: HTMLElement;
    botTabGuard: HTMLElement;
};

export class GuardedElement implements GuardedElementProperties {
    private destroyFns: (() => void)[] = [];

    private guardTarget?: HTMLElement;
    private guardTabIndex: number = 0;

    constructor(
        public readonly element: HTMLElement,
        public readonly topTabGuard: HTMLElement,
        public readonly botTabGuard: HTMLElement
    ) {
        this.element.tabIndex = -1;
        this.initEventListener(this.element, 'blur', () => this.onBlur());
        this.initEventListener(this.element, 'focus', () => this.onFocus());
        this.initEventListener(this.topTabGuard, 'focus', () => this.onTabStart(this.topTabGuard));
        this.initEventListener(this.botTabGuard, 'focus', () => this.onTabStart(this.botTabGuard));
    }

    set tabIndex(index: number) {
        if (index >= 0) {
            // Save this index so that this.element can restore it when it goes out of focus.
            this.guardTabIndex = index;
        }

        // Strictly positive tab-indices breaks our ability to detect which direction the focus is coming
        // from. So if it is the value that the user has specified, then disable the bottom tab-guard to
        // treat TAB and Shift+TAB the same way.
        if (index > 0) {
            this.topTabGuard.tabIndex = index;
            this.botTabGuard.style.display = 'none';
        } else {
            this.topTabGuard.tabIndex = index;
            this.botTabGuard.tabIndex = index;
        }
    }

    destroy() {
        for (const fn of this.destroyFns) fn();
        this.destroyFns.length = 0;
    }

    private initEventListener(elem: HTMLElement, type: 'focus' | 'blur', handler: () => void) {
        elem.addEventListener(type, handler);
        this.destroyFns.push(() => elem.removeEventListener(type, handler));
    }

    private onBlur() {
        if (this.element.tabIndex === -1) {
            this.tabIndex = this.guardTabIndex;
            this.guardTarget = undefined;
        }
    }

    private onFocus() {
        if (this.element.tabIndex === -1) {
            this.tabIndex = -1;
        }
    }

    private onTabStart(target: HTMLElement) {
        this.guardTarget = target;
        this.element.focus();
    }

    public getBrowserFocusDelta(): -1 | 0 | 1 {
        const { guardTarget, topTabGuard, botTabGuard } = this;
        if (guardTarget === topTabGuard) return 1;
        if (guardTarget === botTabGuard) return -1;
        return 0;
    }
}
