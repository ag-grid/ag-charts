import { CleanupRegistry } from '../../state/cleanupRegistry';
import { getAttribute, setAttribute } from './attributeUtil';
import { attachListener } from './domEvents';
import { getWindow, isElement, isNode } from './globalsProxy';

export function addEscapeEventListener(
    elem: HTMLElement,
    onEscape: (event: KeyboardEvent) => void,
    keyCodes: readonly string[] = ['Escape']
) {
    return attachListener(elem, 'keydown', (event: KeyboardEvent) => {
        if (matchesKey(event, ...keyCodes)) {
            onEscape(event);
        }
    });
}

export function addMouseCloseListener(menu: HTMLElement, hideCallback: () => void): () => void {
    const removeEvent = attachListener(getWindow(), 'mousedown', (event: MouseEvent) => {
        if ([0, 2].includes(event.button) && !containsEvent(menu, event)) {
            hideCallback();
            removeEvent();
        }
    });
    return removeEvent;
}

export function addTouchCloseListener(menu: HTMLElement, hideCallback: () => void): () => void {
    const removeEvent = attachListener(getWindow(), 'touchstart', (event: TouchEvent) => {
        const touches = Array.from(event.targetTouches);
        if (touches.some((touch) => !containsEvent(menu, touch))) {
            hideCallback();
            removeEvent();
        }
    });
    return removeEvent;
}

function containsEvent(container: Element, event: Pick<MouseEvent & TouchEvent, 'target' | 'clientX' | 'clientY'>) {
    if (isElement(event.target) && event.target.shadowRoot != null) {
        return true;
    }
    return isNode(event.target) && container.contains(event.target);
}

export function addOverrideFocusVisibleEventListener(
    menu: HTMLElement,
    buttons: HTMLElement[],
    overrideFocusVisible: boolean
) {
    const setFocusVisible = (value: boolean) => {
        for (const btn of buttons) {
            setAttribute(btn, 'data-focus-visible-override', value);
        }
    };
    setFocusVisible(overrideFocusVisible);
    return attachListener(menu, 'keydown', () => setFocusVisible(true), { once: true });
}

export function hasNoModifiers(event: KeyboardEvent | MouseEvent): boolean {
    return !(event.shiftKey || event.altKey || event.ctrlKey || event.metaKey);
}

function matchesKey(event: KeyboardEvent, ...keys: string[]): boolean {
    return hasNoModifiers(event) && keys.includes(event.key);
}

function linkTwoButtons(src: HTMLElement, dst: HTMLElement, key: string) {
    return attachListener(src, 'keydown', (event: KeyboardEvent) => {
        if (matchesKey(event, key)) {
            dst.focus();
        }
    });
}

export const PREV_NEXT_KEYS = {
    horizontal: { nextKey: 'ArrowRight', prevKey: 'ArrowLeft' },
    vertical: { nextKey: 'ArrowDown', prevKey: 'ArrowUp' },
} as const;

// https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_roving_tabindex
export function initRovingTabIndex(opts: {
    orientation: 'horizontal' | 'vertical';
    buttons: HTMLElement[];
    wrapAround?: boolean;
    onFocus?: (event: FocusEvent) => void;
    onBlur?: (event: FocusEvent) => void;
    onEscape?: (event: KeyboardEvent) => void;
}) {
    const { orientation, buttons, wrapAround = false, onEscape, onFocus, onBlur } = opts;
    const { nextKey, prevKey } = PREV_NEXT_KEYS[orientation];

    // Assistive Technologies might provide functionality to focus on any element at random.
    // For example, in VoiceOver the user can press Ctrl+Opt+Shift Up to leave the toolbar, and then
    // focus on the first item by pressing Ctrl+Opt+Shift Down to enter the toolbar again.
    // Therefore, we must use brute-force to ensure that there's only one tabIndex=0 in the toolbar.
    const setTabIndices = (event: FocusEvent) => {
        if (event.target && 'tabIndex' in event.target) {
            for (const b of buttons) {
                b.tabIndex = -1;
            }
            event.target.tabIndex = 0;
        }
    };

    // When wrapAround is false, use c,m such that (c+x)%m === x
    const [c, m] = wrapAround ? [buttons.length, buttons.length] : [0, Infinity];
    const cleanup = new CleanupRegistry();

    for (let i = 0; i < buttons.length; i++) {
        const prev = buttons[(c + i - 1) % m];
        const curr = buttons[i];
        const next = buttons[(c + i + 1) % m];
        cleanup.register(
            attachListener(curr, 'focus', setTabIndices),
            onFocus && attachListener(curr, 'focus', onFocus),
            onBlur && attachListener(curr, 'blur', onBlur),
            onEscape && addEscapeEventListener(curr, onEscape),
            prev && linkTwoButtons(curr, prev, prevKey),
            next && linkTwoButtons(curr, next, nextKey),
            attachListener(curr, 'keydown', (event: KeyboardEvent) => {
                if (matchesKey(event, nextKey, prevKey)) {
                    event.preventDefault();
                }
            })
        );
        curr.tabIndex = i === 0 ? 0 : -1;
    }

    return cleanup;
}

export function makeAccessibleClickListener(element: HTMLElement, onclick: (event: MouseEvent) => unknown) {
    // AG-11385 Ignore clicks disabled elements.
    return (event: MouseEvent) => {
        if (element.ariaDisabled === 'true') {
            return event.preventDefault();
        }
        onclick(event);
    };
}

export function isButtonClickEvent(event: KeyboardEvent | MouseEvent): boolean {
    if ('button' in event) {
        return event.button === 0;
    }
    // AG-12871 Use `key` for Enter to also include the Numpad Enter key.
    return hasNoModifiers(event) && (event.code === 'Space' || event.key === 'Enter');
}

export function getLastFocus(sourceEvent: Event | undefined): HTMLElement | undefined {
    const target = sourceEvent?.target;
    if (isElement(target) && 'tabindex' in (target as HTMLElement).attributes) {
        return target as HTMLElement;
    }
    return undefined;
}

export function stopPageScrolling(element: HTMLElement) {
    return attachListener(element, 'keydown', (event: KeyboardEvent) => {
        if (event.defaultPrevented) return;
        const shouldPrevent = getAttribute(event.target, 'data-preventdefault', true);
        if (shouldPrevent && matchesKey(event, 'ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp')) {
            event.preventDefault();
        }
    });
}
