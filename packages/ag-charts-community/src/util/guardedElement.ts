export type GuardedElementProperties = {
    element: HTMLElement;
    topTabGuard: HTMLElement;
    botTabGuard: HTMLElement;
};

export class GuardedElement implements GuardedElementProperties {
    private destroyFns: (() => void)[] = [];

    public guardEvent?: FocusEvent;
    public guardTarget?: HTMLElement;

    constructor(
        public readonly element: HTMLElement,
        public readonly topTabGuard: HTMLElement,
        public readonly botTabGuard: HTMLElement
    ) {
        this.tabIndex = 0;
        this.initEventListener(this.element, 'blur', (ev) => this.onBlur(ev));
        this.initEventListener(this.element, 'focus', (ev) => this.onFocus(ev));
        this.initEventListener(this.topTabGuard, 'focus', (ev) => this.onTabStart(ev, this.topTabGuard));
        this.initEventListener(this.botTabGuard, 'focus', (ev) => this.onTabStart(ev, this.botTabGuard));
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

    private initEventListener(elem: HTMLElement, type: 'focus' | 'blur', handler: (ev: FocusEvent) => void) {
        elem.addEventListener(type, handler);
        this.destroyFns.push(() => elem.removeEventListener(type, handler));
    }

    private onBlur(event: FocusEvent) {
        this.guardEvent = event;
        this.guardTarget = this.element;
        this.tabIndex = 0;
    }

    private onFocus(_event: FocusEvent) {
        this.tabIndex = -1;
    }

    private onTabStart(event: FocusEvent, target: HTMLElement) {
        this.guardEvent = event;
        this.guardTarget = target;
        this.element.focus();
    }
}
