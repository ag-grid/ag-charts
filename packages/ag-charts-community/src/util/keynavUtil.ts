type ButtonLike = HTMLElement & Partial<Pick<HTMLButtonElement, 'disabled'>>;

function addRemovableEventListener<K extends keyof HTMLElementEventMap>(
    destroyFns: (() => void)[],
    button: HTMLElement,
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any
): void {
    button.addEventListener(type, listener);
    destroyFns.push(() => button.removeEventListener(type, listener));
}

function findButtonNoWrapping(buttons: ButtonLike[], index: number, direction: -1 | 1): ButtonLike | undefined {
    let after: number = index;
    let result = undefined;
    do {
        after = after + direction;
        result = buttons[after];
    } while (after !== index && result !== undefined && result?.disabled !== false);
    return result;
}

function findButtonWithWrapping(buttons: ButtonLike[], index: number, direction: -1 | 1): ButtonLike | undefined {
    let after: number = index;
    let result = undefined;
    do {
        after = (buttons.length + after + direction) % buttons.length;
        result = buttons[after];
    } while (after !== index && result !== undefined && result?.disabled !== false);
    return result;
}

function createKeydownListener(
    buttons: ButtonLike[],
    index: number,
    prevKey: 'ArrowLeft' | 'ArrowUp',
    nextKey: 'ArrowRight' | 'ArrowDown',
    managedTabIndices: boolean,
    finder: (buttons: ButtonLike[], index: number, direction: -1 | 1) => ButtonLike | undefined
) {
    const dstPicker = (event: KeyboardEvent): ButtonLike | undefined => {
        if (event.key === prevKey) {
            event.preventDefault();
            return finder(buttons, index, -1);
        }
        if (event.key === nextKey) {
            event.preventDefault();
            return finder(buttons, index, +1);
        }
    };

    if (managedTabIndices) {
        return (event: KeyboardEvent) => {
            const src = buttons[index];
            const dst = dstPicker(event);
            if (dst) {
                dst.focus();
                dst.tabIndex = 0;
                src.tabIndex = -1;
            }
        };
    } else {
        return (event: KeyboardEvent) => {
            dstPicker(event)?.focus();
        };
    }
}

function addPrevNextListeners(
    destroyFns: (() => void)[],
    mode: 'toolbar' | 'menu',
    buttons: ButtonLike[],
    index: number,
    prevKey: 'ArrowLeft' | 'ArrowUp',
    nextKey: 'ArrowRight' | 'ArrowDown'
) {
    buttons[index].tabIndex = -1;
    const listener =
        mode === 'toolbar'
            ? createKeydownListener(buttons, index, prevKey, nextKey, true, findButtonNoWrapping)
            : createKeydownListener(buttons, index, prevKey, nextKey, false, findButtonWithWrapping);

    addRemovableEventListener(destroyFns, buttons[index], 'keydown', listener);
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
}): (() => void)[] {
    const { orientation, toolbar, buttons, onFocus, onBlur } = opts;
    const { nextKey, prevKey } = PREV_NEXT_KEYS[orientation];

    toolbar.role = 'toolbar';
    toolbar.ariaOrientation = orientation;

    const destroyFns: (() => void)[] = [];
    for (let i = 0; i < buttons.length; i++) {
        addPrevNextListeners(destroyFns, 'toolbar', buttons, i, prevKey, nextKey);
        if (onFocus) addRemovableEventListener(destroyFns, buttons[i], 'focus', onFocus);
        if (onBlur) addRemovableEventListener(destroyFns, buttons[i], 'blur', onBlur);
    }
    // Make the first enable button have tabIndex 0
    buttons.some((b: ButtonLike) => {
        if (b.disabled !== true) {
            b.tabIndex = 0;
            return true;
        }
    });

    return destroyFns;
}

// https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/menu_role
export function initMenuKeyNav(opts: {
    orientation: 'vertical';
    menu: HTMLElement;
    buttons: HTMLElement[];
    onEscape?: (event: KeyboardEvent) => void;
}): (() => void)[] {
    const { orientation, menu, buttons, onEscape } = opts;
    const { nextKey, prevKey } = PREV_NEXT_KEYS[orientation];

    menu.role = 'menu';
    menu.ariaOrientation = orientation;

    const destroyFns: (() => void)[] = [];
    for (let i = 0; i < buttons.length; i++) {
        addPrevNextListeners(destroyFns, 'menu', buttons, i, prevKey, nextKey);
        if (onEscape) {
            addRemovableEventListener(destroyFns, buttons[i], 'keydown', (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    onEscape(event);
                }
            });
        }
    }

    return destroyFns;
}
