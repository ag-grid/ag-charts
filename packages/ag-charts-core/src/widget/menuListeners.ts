import { setAttribute } from '../dom/attributeUtil';
import { attachListener } from '../dom/domEvents';
import { matchesKey } from './keyboardUtil';

export function addEscapeEventListener(
    elem: HTMLElement,
    onEscape: (event: KeyboardEvent) => void,
    keyCodesGetter?: () => readonly string[]
) {
    return attachListener(elem, 'keydown', (event: KeyboardEvent) => {
        const keyCodes = keyCodesGetter?.() ?? ['Escape'];
        if (matchesKey(event, ...keyCodes)) {
            onEscape(event);
        }
    });
}

export function addMouseCloseListener(menu: HTMLElement, hideCallback: () => void): () => void {
    const elWin = menu.ownerDocument.defaultView!;
    const removeEvent = attachListener(elWin, 'mousedown', (event: MouseEvent) => {
        if ([0, 2].includes(event.button) && !containsEvent(menu, event)) {
            hideCallback();
            removeEvent();
        }
    });
    return removeEvent;
}

export function addTouchCloseListener(menu: HTMLElement, hideCallback: () => void): () => void {
    const elWin = menu.ownerDocument.defaultView!;
    const removeEvent = attachListener(elWin, 'touchstart', (event: TouchEvent) => {
        // Target touches all started on the event's target, so the event's path covers them.
        if (event.targetTouches.length > 0 && !containsEvent(menu, event)) {
            hideCallback();
            removeEvent();
        }
    });
    return removeEvent;
}

// A listener outside a shadow root sees its host as the target, so look for the container along the composed path.
function containsEvent(container: Element, event: Event) {
    return event.composedPath().includes(container);
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
