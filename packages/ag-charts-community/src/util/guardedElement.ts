export type GuardedElementProperties = {
    element: HTMLElement;
    topTabGuard: HTMLElement;
    bottomTabGuard: HTMLElement;
};

export class GuardedElement implements GuardedElementProperties {
    private destroyFns: (() => void)[] = [];

    private guardTarget?: HTMLElement;
    private guardTabIndex: number = 0;

    private guessedDelta?: -1 | 0 | 1;

    constructor(
        public readonly element: HTMLElement,
        public readonly topTabGuard: HTMLElement,
        public readonly bottomTabGuard: HTMLElement
    ) {
        this.element.tabIndex = -1;
        this.initEventListener(this.element, 'blur', () => this.onBlur());
        this.initEventListener(this.element, 'focus', () => this.onFocus());
        this.initEventListener(this.topTabGuard, 'focus', (ev) => this.onTabStart(ev, this.topTabGuard));
        this.initEventListener(this.bottomTabGuard, 'focus', (ev) => this.onTabStart(ev, this.bottomTabGuard));
    }

    set tabIndex(index: number) {
        if (index >= 0) {
            // Save this index so that this.element can restore it when it goes out of focus.
            this.guardTabIndex = index;
        }

        // Strictly positive tab-indices breaks our ability to tab guards to detect which direction the focus
        // is coming from. So if it is the value that the user has specified, then disable the bottom tab-guard
        // to treat TAB and Shift+TAB the same way.
        if (index > 0) {
            this.topTabGuard.tabIndex = index;
            this.bottomTabGuard.style.display = 'none';
        } else {
            this.topTabGuard.tabIndex = index;
            this.bottomTabGuard.tabIndex = index;
        }
    }

    destroy() {
        for (const fn of this.destroyFns) fn();
        this.destroyFns.length = 0;
    }

    private initEventListener(
        elem: HTMLElement,
        type: 'focus' | 'blur',
        handler: (() => void) | ((e: FocusEvent) => void)
    ) {
        elem.addEventListener(type, handler);
        this.destroyFns.push(() => elem.removeEventListener(type, handler));
    }

    private onBlur() {
        if (this.element.tabIndex === -1) {
            this.tabIndex = this.guardTabIndex;
            this.guardTarget = undefined;
            this.guessedDelta = undefined;
        }
    }

    private onFocus() {
        if (this.element.tabIndex === -1) {
            this.tabIndex = -1;
        }
    }

    private onTabStart(event: FocusEvent, target: HTMLElement) {
        // If the userOptions specified `keyboard.tabIndex > 0`, then we can still try to guess the delta
        // by comparing event.relatedTarget.tabIndex. This isn't guaranteed to work though, so fall back
        // to delta = 0 if something isn't right.
        if (target.tabIndex > 0) {
            this.guessedDelta = 0; // fallback
            if (event.relatedTarget != null && 'tabIndex' in event.relatedTarget) {
                const prevTabIndex = Number(event.relatedTarget['tabIndex']);
                if (!isNaN(prevTabIndex) && prevTabIndex > 0) {
                    this.guessedDelta = prevTabIndex < target.tabIndex ? 1 : -1;
                }
            }
        }
        this.guardTarget = target;
        this.element.focus();
    }

    public getBrowserFocusDelta(): -1 | 0 | 1 {
        const { guessedDelta, guardTarget, topTabGuard, bottomTabGuard: botTabGuard } = this;
        if (guessedDelta !== undefined) return guessedDelta;
        if (guardTarget === topTabGuard) return 1;
        if (guardTarget === botTabGuard) return -1;
        return 0;
    }
}
