export type GuardedElementProperties = {
    element: HTMLElement;
    topTabGuard: HTMLElement;
    botTabGuard: HTMLElement;
};

export class GuardedElement implements GuardedElementProperties {
    private destroyFns: (() => void)[] = [];

    public guardTarget?: HTMLElement;

    constructor(
        public readonly element: HTMLElement,
        public readonly topTabGuard: HTMLElement,
        public readonly botTabGuard: HTMLElement
    ) {
        this.tabIndex = 0;
        this.initEventListener(this.element, 'blur', () => this.onBlur());
        this.initEventListener(this.element, 'focus', () => this.onFocus());
        this.initEventListener(this.topTabGuard, 'focus', () => this.onTabStart(this.topTabGuard));
        this.initEventListener(this.botTabGuard, 'focus', () => this.onTabStart(this.botTabGuard));
    }

    set tabIndex(index: number) {
        this.topTabGuard.tabIndex = index;
        this.botTabGuard.tabIndex = index;
        this.element.tabIndex = -1;
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
        this.tabIndex = 0;
    }

    private onFocus() {
        this.tabIndex = -1;
    }

    private onTabStart(target: HTMLElement) {
        this.guardTarget = target;
        this.element.focus();
    }
}
