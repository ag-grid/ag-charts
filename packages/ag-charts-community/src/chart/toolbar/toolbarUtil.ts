function addRemovableEventListener<K extends keyof HTMLElementEventMap>(
    destroyFns: (() => void)[],
    button: HTMLElement,
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any
): void {
    button.addEventListener(type, listener);
    destroyFns.push(() => button.removeEventListener(type, listener));
}

// https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/toolbar_role
export function initToolbarKeyNav(opts: {
    orientation: 'horizontal' | 'vertical';
    toolbar: HTMLElement;
    buttons: HTMLElement[];
    onFocus?: (event: FocusEvent) => void;
    onBlur?: (event: FocusEvent) => void;
}): (() => void)[] {
    const { orientation, toolbar, buttons, onFocus, onBlur } = opts;

    let nextKey = 'ArrowRight';
    let prevKey = 'ArrowLeft';

    if (orientation === 'vertical') {
        nextKey = 'ArrowDown';
        prevKey = 'ArrowUp';
    }

    toolbar.role = 'toolbar';
    toolbar.ariaOrientation = orientation;

    const destroyFns: (() => void)[] = [];
    const linkButtons = (src: HTMLElement, dst: HTMLElement | undefined, key: string) => {
        if (onFocus) addRemovableEventListener(destroyFns, src, 'focus', onFocus);
        if (onBlur) addRemovableEventListener(destroyFns, src, 'blur', onBlur);

        if (!dst) return;

        addRemovableEventListener(destroyFns, src, 'keydown', (event: KeyboardEvent) => {
            if (event.key !== key) return;
            dst.focus();
            dst.tabIndex = 0;
            src.tabIndex = -1;
        });
    };

    for (let i = 0; i < buttons.length; i++) {
        const prev = buttons[i - 1];
        const curr = buttons[i];
        const next = buttons[i + 1];
        linkButtons(curr, prev, prevKey);
        linkButtons(curr, next, nextKey);
        addRemovableEventListener(destroyFns, curr, 'keydown', (event: KeyboardEvent) => {
            if (event.key === nextKey || event.key === prevKey) {
                event.preventDefault();
            }
        });
        curr.tabIndex = i === 0 ? 0 : -1;
    }

    return destroyFns;
}
