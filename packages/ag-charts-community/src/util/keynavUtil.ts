function addRemovableEventListener<K extends keyof HTMLElementEventMap>(
    destroyFns: (() => void)[],
    elem: HTMLElement,
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any
): void {
    elem.addEventListener(type, listener);
    destroyFns.push(() => elem.removeEventListener(type, listener));
}

function addRemovableWindowEventListener<K extends keyof WindowEventMap>(
    destroyFns: (() => void)[],
    wind: Window,
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => any
): () => void {
    wind.addEventListener(type, listener);
    const remover = () => wind.removeEventListener(type, listener);
    destroyFns.push(remover);
    return remover;
}

function addEscapeEventListener(
    destroyFns: (() => void)[],
    elem: HTMLElement,
    onEscape: (event: KeyboardEvent) => void
) {
    addRemovableEventListener(destroyFns, elem, 'keydown', (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onEscape(event);
        }
    });
}

function addMouseCloseListener(destroyFns: (() => void)[], menu: HTMLElement, hideCallback: () => void): () => void {
    const self = addRemovableWindowEventListener(destroyFns, window, 'mousedown', (event: MouseEvent) => {
        if ([0, 2].includes(event.button) && !containsPoint(menu, event)) {
            hideCallback();
            self();
        }
    });
    return self;
}

function containsPoint(
    container: { getBoundingClientRect(): DOMRect },
    event: { target: Element | EventTarget | null; clientX: number; clientY: number }
) {
    if (event.target instanceof Element) {
        const { x, y, width, height } = container.getBoundingClientRect();
        const { clientX: ex, clientY: ey } = event;
        return ex >= x && ey >= y && ex <= x + width && ey <= y + height;
    }
    return false;
}

function matchesKey(event: KeyboardEvent, key: string, ...morekeys: string[]): boolean {
    return (
        !(event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) &&
        (event.key === key || morekeys.some((altkey) => event.key === altkey))
    );
}

function linkTwoButtons(destroyFns: (() => void)[], src: HTMLElement, dst: HTMLElement | undefined, key: string) {
    if (!dst) return;

    addRemovableEventListener(destroyFns, src, 'keydown', (event: KeyboardEvent) => {
        if (matchesKey(event, key)) {
            dst.focus();
        }
    });
}

function linkThreeButtons(
    destroyFns: (() => void)[],
    curr: HTMLElement,
    next: HTMLElement | undefined,
    nextKey: string,
    prev: HTMLElement | undefined,
    prevKey: string
) {
    linkTwoButtons(destroyFns, curr, prev, prevKey);
    linkTwoButtons(destroyFns, curr, next, nextKey);
    addRemovableEventListener(destroyFns, curr, 'keydown', (event: KeyboardEvent) => {
        if (matchesKey(event, nextKey, prevKey)) {
            event.preventDefault();
        }
    });
}

function getLastFocus(sourceEvent: Event): HTMLElement | undefined {
    // We need to guess whether the event comes the mouse or keyboard, which isn't an obvious task because
    // the event.sourceEvent instances are mostly indistinguishable.
    //
    // However, when right-clicking with the mouse, the target element will the
    // <div class="ag-charts-canvas-overlay"> element. But when the contextmenu is requested using the
    // keyboard, then the target should be an element with the tabindex attribute set. So that's what we'll
    // use to determine the device that triggered the contextmenu event.
    if (sourceEvent.target instanceof HTMLElement && 'tabindex' in sourceEvent.target.attributes) {
        return sourceEvent.target;
    }
    return undefined;
}

const PREV_NEXT_KEYS = {
    horizontal: { nextKey: 'ArrowRight', prevKey: 'ArrowLeft' },
    vertical: { nextKey: 'ArrowDown', prevKey: 'ArrowUp' },
} as const;

// https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/toolbar_role
export function initToolbarKeyNav(opts: {
    orientation: 'horizontal' | 'vertical';
    toolbar: HTMLElement;
    buttons: HTMLElement[];
    onFocus?: (event: FocusEvent) => void;
    onBlur?: (event: FocusEvent) => void;
    onEscape?: (event: KeyboardEvent) => void;
}): (() => void)[] {
    const { orientation, toolbar, buttons, onEscape, onFocus, onBlur } = opts;
    const { nextKey, prevKey } = PREV_NEXT_KEYS[orientation];
    const ariaHidden: boolean = buttons.length === 0;

    toolbar.role = 'toolbar';
    toolbar.ariaOrientation = orientation;
    toolbar.ariaHidden = ariaHidden.toString();

    // Assistive Technologies might provide functionality to focus on any element at random.
    // For example, in VoiceOver the user can press Ctrl+Opt+Shift Up to leave the toolbar, and then
    // focus on the first item by pressing Ctrl+Opt+Shift Down to enter the toolbar again.
    // Therefore, we must use brute-force to ensure that there's only one tabIndex=0 in the toolbar.
    const setTabIndices = (event: FocusEvent) => {
        if (event.target && 'tabIndex' in event.target) {
            buttons.forEach((b) => (b.tabIndex = -1));
            event.target.tabIndex = 0;
        }
    };

    const destroyFns: (() => void)[] = [];
    for (let i = 0; i < buttons.length; i++) {
        const prev = buttons[i - 1];
        const curr = buttons[i];
        const next = buttons[i + 1];
        addRemovableEventListener(destroyFns, curr, 'focus', setTabIndices);
        if (onFocus) addRemovableEventListener(destroyFns, curr, 'focus', onFocus);
        if (onBlur) addRemovableEventListener(destroyFns, curr, 'blur', onBlur);
        if (onEscape) addEscapeEventListener(destroyFns, curr, onEscape);
        linkThreeButtons(destroyFns, curr, prev, prevKey, next, nextKey);
        curr.tabIndex = i === 0 ? 0 : -1;
    }

    return destroyFns;
}

// https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/menu_role
export function initMenuKeyNav(opts: {
    orientation: 'vertical';
    menu: HTMLElement;
    buttons: HTMLElement[];
    sourceEvent: Event;
    hideCallback: () => void;
}): (() => void)[] {
    const { orientation, menu, buttons, sourceEvent, hideCallback } = opts;
    const { nextKey, prevKey } = PREV_NEXT_KEYS[orientation];
    const destroyFns: (() => void)[] = [];

    const lastFocus = getLastFocus(sourceEvent);
    const mouseCloseRemove = addMouseCloseListener(destroyFns, menu, hideCallback);
    const onEscape = () => {
        hideCallback();
        mouseCloseRemove();
        lastFocus?.focus();
    };

    menu.role = 'menu';
    menu.ariaOrientation = orientation;

    for (let i = 0; i < buttons.length; i++) {
        // Use modules to wrap around when navigation past the start/end of the menu.
        const prev = buttons[(buttons.length + i - 1) % buttons.length];
        const curr = buttons[i];
        const next = buttons[(buttons.length + i + 1) % buttons.length];
        addEscapeEventListener(destroyFns, curr, onEscape);
        linkThreeButtons(destroyFns, curr, prev, prevKey, next, nextKey);
        curr.tabIndex = -1;
    }

    // Add handlers for the menu element itself.
    menu.tabIndex = -1;
    addEscapeEventListener(destroyFns, menu, onEscape);
    addRemovableEventListener(destroyFns, menu, 'keydown', (ev: KeyboardEvent) => {
        if (ev.target === menu && (ev.key === nextKey || ev.key === prevKey)) {
            ev.preventDefault();
            buttons[0]?.focus();
        }
    });

    return destroyFns;
}

export function makeAccessibleClickListener(element: HTMLElement, onclick: (event: MouseEvent) => unknown) {
    return (event: MouseEvent) => {
        if (element.ariaDisabled === 'true') {
            return event.preventDefault();
        }
        onclick(event);
    };
}
