function addRemovableEventListener<K extends keyof HTMLElementEventMap>(
    destroyFns: (() => void)[],
    button: HTMLElement,
    type: K,
    listener?: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any
): void {
    if (listener) {
        button.addEventListener(type, listener);
        destroyFns.push(() => button.removeEventListener(type, listener));
    }
}

// https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/toolbar_role
export function initToolbarKeyNav(opts: {
    orientation: 'horizontal' | 'vertical';
    toolbar: HTMLElement;
    buttons: HTMLElement[];
    onfocus?: (ev: FocusEvent) => void;
    onblur?: (ev: FocusEvent) => void;
}): (() => void)[] {
    const { orientation, toolbar, buttons, onfocus, onblur } = opts;
    const { nextKey, prevKey } = {
        horizontal: { nextKey: 'ArrowRight', prevKey: 'ArrowLeft' },
        vertical: { nextKey: 'ArrowDown', prevKey: 'ArrowUp' },
    }[orientation];

    toolbar.role = 'toolbar';
    toolbar.ariaOrientation = orientation;

    const destroyFns: (() => void)[] = [];
    const linkButtons = (src: HTMLElement, dst: HTMLElement | undefined, key: string) => {
        if (dst) {
            addRemovableEventListener(destroyFns, src, 'keydown', (ev: KeyboardEvent) => {
                if (ev.key === key) {
                    dst.focus();
                    dst.tabIndex = 0;
                    src.tabIndex = -1;
                }
            });
        }
        addRemovableEventListener(destroyFns, src, 'focus', onfocus);
        addRemovableEventListener(destroyFns, src, 'blur', onblur);
    };
    for (let i = 0; i < buttons.length; i++) {
        const prev = buttons[i - 1];
        const curr = buttons[i];
        const next = buttons[i + 1];
        linkButtons(curr, prev, prevKey);
        linkButtons(curr, next, nextKey);
        addRemovableEventListener(destroyFns, curr, 'keydown', (ev: KeyboardEvent) => {
            if (ev.key === nextKey || ev.key === prevKey) {
                ev.preventDefault();
            }
        });
        curr.tabIndex = i === 0 ? 0 : -1;
    }

    return destroyFns;
}
