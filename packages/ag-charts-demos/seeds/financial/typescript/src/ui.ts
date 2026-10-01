// Hand-rolled equivalents of the Radix UI primitives the React demo wraps in ui.tsx, styled by the
// same financial.css. Each reproduces the DOM Radix renders (roles, aria attributes, `data-state`
// and class names) so the stylesheet and the parity states apply unchanged; the plain button helper
// is a styled native element, as in the React demo.
import { type Attrs, type Child, h } from './dom';

let nextId = 0;
const uid = (prefix: string) => `fin-${prefix}-${++nextId}`;

/** Radix has no Button: a native button carrying the `fin-btn` class, plus any of its own. */
export function button(attrs: Attrs, ...children: Child[]): HTMLButtonElement {
    const { class: className, ...rest } = attrs;
    // Attribute order as the React `Button` renders it: type, class, then the rest.
    return h('button', { type: 'button', class: className ? `fin-btn ${className}` : 'fin-btn', ...rest }, ...children);
}

export interface SelectOption {
    value: string;
    label: string;
}

export interface Select {
    el: HTMLLabelElement;
    /** Reflect a value set by the owner (Radix `value` prop). */
    setValue(value: string): void;
    /**
     * The React unmount: closes an open listbox without moving focus, undoing what opening did to
     * the page and dropping its document listeners, cancels pending timers and removes the select.
     */
    destroy(): void;
}

const SELECT_OPEN_KEYS = [' ', 'Enter', 'ArrowUp', 'ArrowDown'];
const SELECT_SELECTION_KEYS = [' ', 'Enter'];
const SELECT_NAVIGATION_KEYS = ['ArrowUp', 'ArrowDown', 'Home', 'End'];
/** Popover offset below the trigger (Radix `sideOffset`). */
const SELECT_SIDE_OFFSET = 4;
/** How long Radix's typeahead keeps what has been typed after the last character. */
const TYPEAHEAD_RESET_MS = 1000;

const roundByDpr = (value: number) => {
    const dpr = window.devicePixelRatio || 1;
    return Math.round(value * dpr) / dpr;
};

const hasModifier = (event: KeyboardEvent) => event.ctrlKey || event.altKey || event.metaKey;

/**
 * Radix's typeahead search (`useTypeaheadSearch`): characters typed within a second of each other
 * accumulate, and the search clears a second after the last. The trigger and the listbox each keep
 * one of their own.
 */
function createTypeahead() {
    let search = '';
    let timer: ReturnType<typeof setTimeout> | undefined;
    return {
        /** Whether a search is in progress, when Space extends it rather than opening or selecting. */
        get active() {
            return search !== '';
        },
        /** Add a typed character and return the search it makes. */
        add(key: string): string {
            search += key;
            clearTimeout(timer);
            timer = setTimeout(() => {
                search = '';
            }, TYPEAHEAD_RESET_MS);
            return search;
        },
        /** Drop the search and its pending reset. */
        clear() {
            clearTimeout(timer);
            search = '';
        },
    };
}

/**
 * Radix `findNextItem`: the first of `items` at or after `current` (wrapping round) whose label
 * starts with the search, case-insensitively. A run of one repeated character searches on that
 * character alone and skips `current`, so pressing it again cycles through the items starting with
 * it. Nothing is returned when the match is `current` itself.
 */
function findNextItem<T>(items: T[], labelOf: (item: T) => string, search: string, current: T | undefined) {
    const repeated = search.length > 1 && Array.from(search).every((char) => char === search[0]);
    const needle = (repeated ? search[0] : search).toLowerCase();
    const start = Math.max(current ? items.indexOf(current) : -1, 0);
    let candidates = items.map((_, index) => items[(start + index) % items.length]);
    if (needle.length === 1) candidates = candidates.filter((item) => item !== current);
    const next = candidates.find((item) => labelOf(item).toLowerCase().startsWith(needle));
    return next !== current ? next : undefined;
}

/**
 * `aria-hidden`'s `hideOthers`, which Radix Select applies while its listbox is open: every element
 * under `document.body` that is not `target`, an `aria-live` region or a `script`, nor an ancestor
 * of one of those, gets `aria-hidden="true"` and a `data-aria-hidden` marker. Returns the undo.
 */
function hideOthers(target: HTMLElement): () => void {
    const kept = new Set<Element>([target, ...document.body.querySelectorAll('[aria-live], script')]);
    const ancestors = new Set<Node>();
    for (const element of kept) {
        for (let node = element.parentNode; node && !ancestors.has(node); node = node.parentNode) {
            ancestors.add(node);
        }
    }
    const hidden: { element: Element; wasHidden: boolean }[] = [];
    const hide = (parent: Element) => {
        for (const element of parent.children) {
            if (kept.has(element)) continue;
            if (ancestors.has(element)) {
                hide(element);
                continue;
            }
            const value = element.getAttribute('aria-hidden');
            const wasHidden = value !== null && value !== 'false';
            hidden.push({ element, wasHidden });
            element.setAttribute('data-aria-hidden', 'true');
            if (!wasHidden) element.setAttribute('aria-hidden', 'true');
        }
    };
    hide(document.body);
    return () => {
        for (const { element, wasHidden } of hidden) {
            if (!wasHidden) element.removeAttribute('aria-hidden');
            element.removeAttribute('data-aria-hidden');
        }
    };
}

/**
 * Radix Select: a `role="combobox"` trigger inside a label, with a `role="listbox"` popover of
 * `role="option"` items appended to `document.body` while open, positioned under the trigger.
 * Pointer and keyboard behaviour follows Radix: open on pointer down or Space/Enter/arrows, the
 * selected item takes focus and `data-highlighted` follows focus, arrows and Home/End move it,
 * Space/Enter or pointer up select, Escape or a pointer down outside closes and focus returns to
 * the trigger. Typing searches the options: on the closed trigger the value moves to the match, in
 * the open listbox the match takes focus. While open, the rest of the page is `aria-hidden` and
 * takes no pointer events.
 */
export function createSelect({
    value,
    onValueChange,
    options,
    ariaLabel,
    label,
}: {
    value: string;
    onValueChange: (value: string) => void;
    options: SelectOption[];
    ariaLabel: string;
    label: string;
}): Select {
    const contentId = uid('select-content');
    const labelOf = (current: string) => options.find((option) => option.value === current)?.label ?? '';
    const triggerTypeahead = createTypeahead();
    const contentTypeahead = createTypeahead();
    // What last pressed the trigger: Radix opens on pointer down for a mouse, on click otherwise.
    let pointerType = 'touch';
    /** Focus moves still to run, cancelled on destroy. */
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const later = (callback: () => void) => {
        const timer = setTimeout(() => {
            timers.delete(timer);
            callback();
        });
        timers.add(timer);
    };

    // `pointer-events: none` so events from the value text never target it, as Radix renders it.
    const valueNode = h('span', { style: 'pointer-events: none;' }, labelOf(value));
    const trigger = h(
        'button',
        {
            type: 'button',
            role: 'combobox',
            'aria-controls': contentId,
            'aria-expanded': 'false',
            'aria-autocomplete': 'none',
            dir: 'ltr',
            'data-state': 'closed',
            class: 'fin-btn fin-select-trigger',
            'aria-label': ariaLabel,
            onpointerdown: (event: PointerEvent) => {
                pointerType = event.pointerType;
                // Left mouse button only, and not with Control held (a macOS right click). Radix
                // prevents the default so the trigger does not take focus from the item the
                // popover focuses.
                if (event.button === 0 && !event.ctrlKey && event.pointerType === 'mouse') {
                    open();
                    event.preventDefault();
                }
            },
            onclick: () => {
                // Reached by a label click (a mouse pointer down is prevented above): focus, and
                // open for touch and pen.
                trigger.focus();
                if (pointerType !== 'mouse') open();
            },
            onkeydown: (event: KeyboardEvent) => {
                const typingAhead = triggerTypeahead.active;
                // A character typed on the closed trigger moves the value to the option it matches.
                if (!hasModifier(event) && event.key.length === 1) {
                    const current = options.find((option) => option.value === value);
                    const search = triggerTypeahead.add(event.key);
                    const next = findNextItem(options, (option) => option.label, search, current);
                    if (next !== undefined) onValueChange(next.value);
                }
                // Space extends a search in progress rather than opening.
                if (typingAhead && event.key === ' ') return;
                if (SELECT_OPEN_KEYS.includes(event.key)) {
                    open();
                    event.preventDefault();
                }
            },
        },
        valueNode,
        h('span', { 'aria-hidden': 'true' }, '▾')
    );

    let popover: HTMLDivElement | undefined;
    /** Undoes what opening did to the rest of the page: the hidden siblings and body pointer events. */
    let restorePage: (() => void) | undefined;

    /** Unmount the listbox and undo what opening did, without moving focus. */
    function unmount() {
        if (!popover) return;
        popover.remove();
        popover = undefined;
        restorePage?.();
        restorePage = undefined;
        document.removeEventListener('pointerdown', onPointerDownOutside, true);
        document.removeEventListener('keydown', onEscape, true);
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('data-state', 'closed');
    }

    function close() {
        if (!popover) return;
        unmount();
        // Radix hands focus back once the listbox has unmounted, on a timeout: a pointer down
        // outside has moved focus by then, and the trigger still ends up with it.
        later(() => trigger.focus({ preventScroll: true }));
    }

    const onPointerDownOutside = (event: PointerEvent) => {
        if (popover && !popover.contains(event.target as Node)) close();
    };
    const onEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') close();
    };

    function select(next: string) {
        onValueChange(next);
        close();
    }

    function open() {
        if (popover) return;
        const items = options.map((option) => {
            const textId = uid('select-item-text');
            const selected = option.value === value;
            const item = h(
                'div',
                {
                    role: 'option',
                    'aria-labelledby': textId,
                    'aria-selected': 'false',
                    'data-state': selected ? 'checked' : 'unchecked',
                    tabindex: '-1',
                    class: 'fin-select-item',
                    onfocus: () => {
                        item.setAttribute('data-highlighted', '');
                        item.setAttribute('aria-selected', String(selected));
                    },
                    onblur: () => {
                        item.removeAttribute('data-highlighted');
                        item.setAttribute('aria-selected', 'false');
                    },
                    onpointermove: (event: PointerEvent) => {
                        if (event.pointerType === 'mouse') item.focus({ preventScroll: true });
                    },
                    onpointerleave: () => {
                        if (document.activeElement === item) content.focus({ preventScroll: true });
                    },
                    onpointerup: () => select(option.value),
                    onkeydown: (event: KeyboardEvent) => {
                        // Space during a search extends it rather than selecting.
                        if (event.key === ' ' && contentTypeahead.active) return;
                        if (SELECT_SELECTION_KEYS.includes(event.key)) select(option.value);
                        // Space must not scroll the page.
                        if (event.key === ' ') event.preventDefault();
                    },
                },
                h('span', { id: textId }, option.label)
            );
            return item;
        });

        const content = h(
            'div',
            {
                'data-side': 'bottom',
                'data-align': 'start',
                role: 'listbox',
                id: contentId,
                'data-state': 'open',
                dir: 'ltr',
                class: 'fin-portal fin-select-content',
                tabindex: '-1',
                style: 'box-sizing: border-box; display: flex; flex-direction: column; outline: none; pointer-events: auto;',
                onkeydown: (event: KeyboardEvent) => {
                    // The list is not navigated with Tab.
                    if (event.key === 'Tab') event.preventDefault();
                    // A character typed in the open list focuses the option it matches.
                    if (!hasModifier(event) && event.key.length === 1) {
                        const current = items.find((item) => item === document.activeElement);
                        const search = contentTypeahead.add(event.key);
                        const next = findNextItem(items, (item) => item.textContent?.trim() ?? '', search, current);
                        if (next) later(() => next.focus());
                    }
                    if (!SELECT_NAVIGATION_KEYS.includes(event.key)) return;
                    let candidates = items.slice();
                    if (event.key === 'ArrowUp' || event.key === 'End') candidates.reverse();
                    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                        candidates = candidates.slice(candidates.indexOf(event.target as HTMLDivElement) + 1);
                    }
                    // Focus moves on a timeout, as in Radix, so the keydown finishes first.
                    later(() => candidates[0]?.focus({ preventScroll: true }));
                    event.preventDefault();
                },
            },
            h('div', { role: 'presentation', style: 'position: relative; flex: 1 1 0%; overflow: auto;' }, ...items)
        );

        // The popper wrapper: fixed at the viewport origin and translated under the trigger, flipping
        // above it when there is no room below.
        const anchor = trigger.getBoundingClientRect();
        popover = h(
            'div',
            { dir: 'ltr', style: 'position: fixed; left: 0px; top: 0px; min-width: max-content; z-index: 60;' },
            content
        );
        document.body.append(popover);
        const height = popover.getBoundingClientRect().height;
        const below = anchor.bottom + SELECT_SIDE_OFFSET;
        const fitsBelow = below + height <= window.innerHeight;
        const top = fitsBelow ? below : anchor.top - SELECT_SIDE_OFFSET - height;
        // Snapped to device pixels, as the popper's positioning library does, so the text is crisp.
        popover.style.transform = `translate(${roundByDpr(anchor.left)}px, ${roundByDpr(top)}px)`;
        content.setAttribute('data-side', fitsBelow ? 'bottom' : 'top');

        trigger.setAttribute('aria-expanded', 'true');
        trigger.setAttribute('data-state', 'open');
        // While open, Radix hides the rest of the page from assistive technology and turns its
        // pointer events off, so a pointer down anywhere outside the listbox only dismisses.
        const unhide = hideOthers(content);
        const bodyPointerEvents = document.body.style.pointerEvents;
        document.body.style.pointerEvents = 'none';
        restorePage = () => {
            unhide();
            document.body.style.pointerEvents = bodyPointerEvents;
        };
        document.addEventListener('pointerdown', onPointerDownOutside, true);
        document.addEventListener('keydown', onEscape, true);
        // The selected item takes focus, else the list itself.
        (items.find((item) => item.getAttribute('data-state') === 'checked') ?? content).focus({
            preventScroll: true,
        });
    }

    const el = h(
        'label',
        {
            class: 'fin-labeled-select',
            onmousedown: (event: MouseEvent) => {
                // Radix Label: a double click on the text must not select it.
                if ((event.target as Element).closest('button, input, select, textarea')) return;
                if (event.detail > 1) event.preventDefault();
            },
        },
        h('span', {}, label),
        trigger
    );

    return {
        el,
        setValue(next) {
            value = next;
            valueNode.textContent = labelOf(next);
        },
        destroy() {
            unmount();
            for (const timer of timers) clearTimeout(timer);
            timers.clear();
            triggerTypeahead.clear();
            contentTypeahead.clear();
            el.remove();
        },
    };
}

type FocusIntent = 'prev' | 'next' | 'first' | 'last';

const FOCUS_INTENT: Record<string, FocusIntent> = {
    ArrowLeft: 'prev',
    ArrowUp: 'prev',
    ArrowRight: 'next',
    ArrowDown: 'next',
    PageUp: 'first',
    Home: 'first',
    PageDown: 'last',
    End: 'last',
};

/**
 * Radix RovingFocusGroup, as the toggle group uses it. The group is a tab stop (`tabindex="0"`) and
 * its items are not (`-1`) until one has been focused, when that item becomes a stop as well;
 * keyboard entry into the group lands on the active item, or the last focused, or the first, while
 * a click focuses what was clicked. Arrows move focus between items and loop, Home/End (and
 * PageUp/PageDown) jump to the ends; a group with an orientation ignores the other axis's arrows.
 * Shift+Tab from an item takes the group out of the tab order until focus has left, so it lands
 * before the group rather than on it. Focus is moved on a timeout, as Radix does, so the keydown
 * finishes before the focus events run.
 */
function rovingFocus({
    group,
    items,
    orientation,
    isActive,
}: {
    group: HTMLElement;
    items: HTMLElement[];
    orientation?: 'horizontal' | 'vertical';
    /** The item the group considers current, which keyboard entry lands on. */
    isActive: (item: HTMLElement) => boolean;
}) {
    let tabStop: HTMLElement | undefined;
    let clickFocus = false;
    let tabbingBackOut = false;

    group.addEventListener('mousedown', () => {
        clickFocus = true;
    });
    // React's `onFocus` and `onBlur` are `focusin` and `focusout`: focus moving anywhere within the
    // group counts.
    group.addEventListener('focusin', (event) => {
        const keyboardFocus = !clickFocus;
        clickFocus = false;
        if (event.target === group && keyboardFocus && !tabbingBackOut) {
            (items.find(isActive) ?? tabStop ?? items[0])?.focus();
        }
    });
    group.addEventListener('focusout', () => {
        tabbingBackOut = false;
        group.setAttribute('tabindex', '0');
    });

    for (const item of items) {
        item.addEventListener('focus', () => {
            tabStop = item;
            for (const other of items) other.setAttribute('tabindex', other === item ? '0' : '-1');
        });
        item.addEventListener('keydown', (event) => {
            if (event.key === 'Tab' && event.shiftKey) {
                tabbingBackOut = true;
                group.setAttribute('tabindex', '-1');
                return;
            }
            if (event.target !== item) return;
            if (orientation === 'vertical' && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) return;
            if (orientation === 'horizontal' && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) return;
            const intent = FOCUS_INTENT[event.key];
            if (!intent || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
            event.preventDefault();
            let candidates = items.slice();
            if (intent === 'last') candidates.reverse();
            else if (intent === 'prev' || intent === 'next') {
                if (intent === 'prev') candidates.reverse();
                const index = candidates.indexOf(item);
                candidates = [...candidates.slice(index + 1), ...candidates.slice(0, index + 1)];
            }
            setTimeout(() => candidates[0]?.focus());
        });
    }
}

export interface ToggleGroup {
    el: HTMLDivElement;
    /** Reflect a value set by the owner (Radix `value` prop). */
    setValue(value: string): void;
}

/**
 * Radix ToggleGroup, `type="single"`: a `role="radiogroup"` of `role="radio"` buttons whose
 * `data-state` is `on` or `off`, with roving focus (above, on both axes as the React demo gives it
 * no orientation) that lands on the pressed item. A click or Enter/Space selects; the pressed item
 * cannot be deselected.
 */
export function createToggleGroup({
    value,
    onValueChange,
    options,
    ariaLabel,
}: {
    value: string;
    onValueChange: (value: string) => void;
    options: SelectOption[];
    ariaLabel: string;
}): ToggleGroup {
    const items = options.map((option) =>
        h(
            'button',
            {
                type: 'button',
                'data-state': 'off',
                role: 'radio',
                'aria-checked': 'false',
                class: 'fin-toggle-item',
                tabindex: '-1',
                onclick: () => {
                    // Pressing the pressed item would clear the group; the demo ignores that, so
                    // only a change is reported.
                    if (option.value !== value) onValueChange(option.value);
                },
            },
            option.label
        )
    );

    const el = h(
        'div',
        {
            dir: 'ltr',
            role: 'radiogroup',
            class: 'fin-toggle-group',
            'aria-label': ariaLabel,
            tabindex: '0',
            style: 'outline: none;',
        },
        ...items
    );
    rovingFocus({ group: el, items, isActive: (item) => item.getAttribute('data-state') === 'on' });

    function render() {
        options.forEach((option, index) => {
            const pressed = option.value === value;
            items[index].setAttribute('data-state', pressed ? 'on' : 'off');
            items[index].setAttribute('aria-checked', String(pressed));
        });
    }
    render();

    return {
        el,
        setValue(next) {
            value = next;
            render();
        },
    };
}
