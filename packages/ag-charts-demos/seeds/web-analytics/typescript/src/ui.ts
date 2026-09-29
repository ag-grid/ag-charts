// Hand-rolled equivalents of the Radix UI primitives the React demo uses (Select in ui.tsx, Tabs in
// WebAnalyticsApp.tsx, Popover in OverviewView.tsx), styled by the same web-analytics.css. Each
// reproduces the DOM Radix renders (roles, aria attributes, `data-state` and class names) so the
// stylesheet, the functional specs and the parity states apply unchanged.
import { type View, h } from './dom';

let nextId = 0;
const uid = (prefix: string) => `wa-${prefix}-${++nextId}`;

const roundByDpr = (value: number) => {
    const dpr = window.devicePixelRatio || 1;
    return Math.round(value * dpr) / dpr;
};

const hasModifier = (event: KeyboardEvent) => event.ctrlKey || event.altKey || event.metaKey;

export interface SelectOption {
    value: string;
    label: string;
}

export interface Select {
    el: HTMLElement;
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
 * Radix Select: a `role="combobox"` trigger, optionally inside a label, with a `role="listbox"`
 * popover of `role="option"` items appended to `document.body` while open, positioned under the
 * trigger. Pointer and keyboard behaviour follows Radix: open on pointer down or
 * Space/Enter/arrows, the selected item takes focus and `data-highlighted` follows focus, arrows
 * and Home/End move it, Space/Enter or pointer up select, Escape or a pointer down outside closes
 * and focus returns to the trigger. Typing searches the options: on the closed trigger the value
 * moves to the match, in the open listbox the match takes focus. While open, the rest of the page
 * is `aria-hidden` and takes no pointer events.
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
    label?: string;
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
            class: 'wa-btn wa-select-trigger',
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
                    class: 'wa-select-item',
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
                class: 'wa-portal wa-select-content',
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

    // Radix Label renders a plain <label>; the demo gives it no `htmlFor`.
    const el = label
        ? h(
              'label',
              {
                  class: 'wa-labeled-select',
                  onmousedown: (event: MouseEvent) => {
                      // Radix Label: a double click on the text must not select it.
                      if ((event.target as Element).closest('button, input, select, textarea')) return;
                      if (event.detail > 1) event.preventDefault();
                  },
              },
              h('span', {}, label),
              trigger
          )
        : trigger;

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
 * Radix RovingFocusGroup, as the tabs list uses it. The group is a tab stop (`tabindex="0"`) and
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

export interface TabDef {
    value: string;
    label: string;
}

export interface Tabs {
    /** `Tabs.Root`: the `dir`/`data-orientation` div the caller fills and classes. */
    root: HTMLDivElement;
    /** `Tabs.List` with its triggers. */
    list: HTMLDivElement;
    /** `Tabs.Content` panels by value; the caller fills the active one and empties the rest. */
    contents: Record<string, HTMLDivElement>;
    /** Reflect a value set by the owner (Radix `value` prop). */
    setValue(value: string): void;
}

const TAB_ACTIVATION_KEYS = [' ', 'Enter'];

/**
 * Radix Tabs (horizontal, `activationMode="automatic"`, `loop`): a `role="tablist"` of
 * `role="tab"` buttons with `data-state="active|inactive"`, and one `role="tabpanel"` per tab that
 * is `hidden` while inactive. Focus roves as above, along the horizontal axis; a focused trigger
 * becomes selected, as does one clicked or pressed with Space/Enter. The initially active panel
 * carries Radix's `animation-duration: 0s` mount guard until it next changes state.
 */
export function createTabs({
    value,
    onValueChange,
    tabs,
    listAriaLabel,
    rootClass,
    listClass,
    triggerClass,
    contentClass,
}: {
    value: string;
    onValueChange: (value: string) => void;
    tabs: TabDef[];
    listAriaLabel: string;
    rootClass: string;
    listClass: string;
    triggerClass: string;
    contentClass: string;
}): Tabs {
    const baseId = uid('tabs');
    const triggerId = (tab: string) => `${baseId}-trigger-${tab}`;
    const contentId = (tab: string) => `${baseId}-content-${tab}`;

    const triggers = tabs.map((tab) =>
        h(
            'button',
            {
                type: 'button',
                role: 'tab',
                'aria-selected': 'false',
                'aria-controls': contentId(tab.value),
                'data-state': 'inactive',
                id: triggerId(tab.value),
                class: triggerClass,
                tabindex: '-1',
                'data-orientation': 'horizontal',
                onmousedown: (event: MouseEvent) => {
                    // Left button only, and not with Control held (a macOS right click), which
                    // Radix also stops from focusing the tab.
                    if (event.button === 0 && !event.ctrlKey) onValueChange(tab.value);
                    else event.preventDefault();
                },
                onkeydown: (event: KeyboardEvent) => {
                    if (TAB_ACTIVATION_KEYS.includes(event.key)) onValueChange(tab.value);
                },
                onfocus: () => {
                    // Automatic activation: focus selects.
                    if (tab.value !== value) onValueChange(tab.value);
                },
            },
            tab.label
        )
    );

    const list = h(
        'div',
        {
            role: 'tablist',
            'aria-orientation': 'horizontal',
            class: listClass,
            'aria-label': listAriaLabel,
            tabindex: '0',
            'data-orientation': 'horizontal',
            style: 'outline: none;',
        },
        ...triggers
    );
    rovingFocus({
        group: list,
        items: triggers,
        orientation: 'horizontal',
        isActive: (item) => item.getAttribute('data-state') === 'active',
    });

    // The active panel on first render is the only one to carry the mount guard.
    const contents = Object.fromEntries(
        tabs.map((tab) => [
            tab.value,
            h('div', {
                'data-state': tab.value === value ? 'active' : 'inactive',
                'data-orientation': 'horizontal',
                role: 'tabpanel',
                'aria-labelledby': triggerId(tab.value),
                hidden: tab.value !== value,
                id: contentId(tab.value),
                tabindex: '0',
                class: contentClass,
                style: tab.value === value ? 'animation-duration: 0s;' : undefined,
            }),
        ])
    );

    const root = h('div', { dir: 'ltr', 'data-orientation': 'horizontal', class: rootClass });

    function render() {
        tabs.forEach((tab, index) => {
            const active = tab.value === value;
            triggers[index].setAttribute('aria-selected', String(active));
            triggers[index].setAttribute('data-state', active ? 'active' : 'inactive');
            const content = contents[tab.value];
            if (content.getAttribute('data-state') === (active ? 'active' : 'inactive')) return;
            content.setAttribute('data-state', active ? 'active' : 'inactive');
            content.hidden = !active;
            // Radix keeps the guard only until the panel re-renders.
            content.removeAttribute('style');
        });
    }
    render();

    return {
        root,
        list,
        contents,
        setValue(next) {
            value = next;
            render();
        },
    };
}

/** A rectangle to anchor a popover to: an element, or a point (`Popover.Anchor virtualRef`). */
export type PopoverAnchor = HTMLElement | { x: number; y: number };

export interface Popover {
    /** `Popover.Trigger`. */
    trigger: HTMLButtonElement;
    /** Whether the popover is open. */
    readonly open: boolean;
    /** Open with `content` positioned against `anchor` (the trigger when omitted), or close; re-anchors while open. */
    setOpen(open: boolean, content?: View, anchor?: PopoverAnchor): void;
}

/** Popover offset from the anchor (`sideOffset`) and the viewport padding it keeps (`collisionPadding`). */
const POPOVER_SIDE_OFFSET = 6;
const POPOVER_COLLISION_PADDING = 8;

/**
 * Radix Popover (non-modal), `side="bottom" align="end"`: the trigger carries
 * `aria-haspopup="dialog"`, `aria-expanded` and `data-state`; while open a wrapper fixed at the
 * viewport origin and translated to the anchor holds a `role="dialog"` content appended to
 * `document.body`, carrying the side it settled on and its alignment as `data-side` and
 * `data-align`. The content sits 6px below the anchor with its right edge on the anchor's,
 * shifting into the viewport and flipping above when there is no room. Escape, a pointer down
 * outside or focus moving outside dismiss it; the trigger toggles it. Focus returns to the
 * trigger on dismissal unless the dismissal was an interaction outside.
 */
export function createPopover({
    onOpenChange,
    triggerClass,
    triggerLabel,
}: {
    onOpenChange: (open: boolean) => void;
    triggerClass: string;
    triggerLabel: string;
}): Popover {
    const contentId = uid('popover');
    const trigger = h(
        'button',
        {
            type: 'button',
            'aria-haspopup': 'dialog',
            'aria-expanded': 'false',
            'data-state': 'closed',
            class: triggerClass,
            onclick: () => onOpenChange(!isOpen),
        },
        triggerLabel
    );

    let isOpen = false;
    let wrapper: HTMLDivElement | undefined;
    let content: View | undefined;
    let interactedOutside = false;

    const anchorRect = (anchor: PopoverAnchor) =>
        anchor instanceof HTMLElement ? anchor.getBoundingClientRect() : new DOMRect(anchor.x, anchor.y, 0, 0);

    function position(anchor: PopoverAnchor) {
        if (!wrapper) return;
        const reference = anchorRect(anchor);
        const { width, height } = wrapper.getBoundingClientRect();
        const pad = POPOVER_COLLISION_PADDING;
        // align="end": right edges meet; shift keeps it inside the viewport.
        let x = reference.right - width;
        x = Math.min(Math.max(x, pad), window.innerWidth - pad - width);
        // side="bottom", flipping above when the space below is short and above is not.
        let y = reference.bottom + POPOVER_SIDE_OFFSET;
        let side = 'bottom';
        if (y + height > window.innerHeight - pad && reference.top - POPOVER_SIDE_OFFSET - height >= pad) {
            y = reference.top - POPOVER_SIDE_OFFSET - height;
            side = 'top';
        }
        wrapper.style.transform = `translate(${roundByDpr(x)}px, ${roundByDpr(y)}px)`;
        wrapper.firstElementChild?.setAttribute('data-side', side);
    }

    const dismiss = (outside: boolean) => {
        interactedOutside = outside;
        onOpenChange(false);
    };
    const onPointerDownOutside = (event: PointerEvent) => {
        const target = event.target as Node;
        // The trigger's own click toggles; it must not also dismiss.
        if (wrapper && !wrapper.contains(target) && !trigger.contains(target)) dismiss(true);
    };
    const onFocusOutside = (event: FocusEvent) => {
        const target = event.target as Node;
        if (wrapper && !wrapper.contains(target) && !trigger.contains(target)) dismiss(true);
    };
    const onEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') dismiss(false);
    };

    function close() {
        if (!wrapper) return;
        content?.destroy();
        content = undefined;
        wrapper.remove();
        wrapper = undefined;
        document.removeEventListener('pointerdown', onPointerDownOutside, true);
        document.removeEventListener('focusin', onFocusOutside, true);
        document.removeEventListener('keydown', onEscape, true);
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('data-state', 'closed');
        trigger.removeAttribute('aria-controls');
        if (!interactedOutside) trigger.focus({ preventScroll: true });
        interactedOutside = false;
    }

    function open(next: View, anchor: PopoverAnchor) {
        if (wrapper) {
            if (next !== content) {
                content?.destroy();
                content = next;
                wrapper.replaceChildren(dialog(next));
                next.mount();
            }
            position(anchor);
            return;
        }
        content = next;
        wrapper = h(
            'div',
            { style: 'position: fixed; left: 0px; top: 0px; min-width: max-content; z-index: auto;' },
            dialog(next)
        );
        document.body.append(wrapper);
        position(anchor);
        trigger.setAttribute('aria-expanded', 'true');
        trigger.setAttribute('data-state', 'open');
        trigger.setAttribute('aria-controls', contentId);
        next.mount();
        document.addEventListener('pointerdown', onPointerDownOutside, true);
        document.addEventListener('focusin', onFocusOutside, true);
        document.addEventListener('keydown', onEscape, true);
    }

    const dialog = (view: View) =>
        h(
            'div',
            {
                'data-side': 'bottom',
                'data-align': 'end',
                'data-state': 'open',
                role: 'dialog',
                id: contentId,
                class: 'wa-portal',
                tabindex: '-1',
            },
            view.el
        );

    return {
        trigger,
        get open() {
            return isOpen;
        },
        setOpen(next, view, anchor = trigger) {
            isOpen = next;
            if (next && view) open(view, anchor);
            else close();
        },
    };
}
