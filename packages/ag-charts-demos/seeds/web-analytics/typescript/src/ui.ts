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

const FOCUS_INTENT: Record<string, 'prev' | 'next' | 'first' | 'last'> = {
    ArrowLeft: 'prev',
    ArrowRight: 'next',
    Home: 'first',
    End: 'last',
};

/** The items to try focusing for a horizontal roving-focus key press, in order (Radix RovingFocusGroup). */
function focusCandidates<T extends HTMLElement>(items: T[], current: T, key: string): T[] | undefined {
    const intent = FOCUS_INTENT[key];
    if (!intent) return undefined;
    let candidates = items.slice();
    if (intent === 'last') candidates.reverse();
    else if (intent === 'prev' || intent === 'next') {
        if (intent === 'prev') candidates.reverse();
        const index = candidates.indexOf(current);
        // `loop`: wrap round past either end.
        candidates = [...candidates.slice(index + 1), ...candidates.slice(0, index + 1)];
    }
    return candidates;
}

export interface SelectOption {
    value: string;
    label: string;
}

export interface Select {
    el: HTMLElement;
    /** Reflect a value set by the owner (Radix `value` prop). */
    setValue(value: string): void;
}

const SELECT_OPEN_KEYS = [' ', 'Enter', 'ArrowUp', 'ArrowDown'];
const SELECT_SELECTION_KEYS = [' ', 'Enter'];
/** Popover offset below the trigger (Radix `sideOffset`). */
const SELECT_SIDE_OFFSET = 4;

/**
 * Radix Select: a `role="combobox"` trigger, optionally inside a label, with a `role="listbox"`
 * popover of `role="option"` items appended to `document.body` while open, positioned under the
 * trigger. Pointer and keyboard behaviour follows Radix: open on pointer down or
 * Space/Enter/arrows, the selected item takes focus and `data-highlighted` follows focus, arrows
 * and Home/End move it, Space/Enter or pointer up select, Escape or a pointer down outside closes
 * and focus returns to the trigger. Typeahead is not reproduced.
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
                // Left button only, and not with Control held (a macOS right click). Radix prevents
                // the default so the trigger does not take focus from the item the popover focuses.
                if (event.button === 0 && !event.ctrlKey) {
                    open();
                    event.preventDefault();
                }
            },
            onkeydown: (event: KeyboardEvent) => {
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

    function close() {
        if (!popover) return;
        popover.remove();
        popover = undefined;
        document.removeEventListener('pointerdown', onPointerDownOutside, true);
        document.removeEventListener('keydown', onEscape, true);
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('data-state', 'closed');
        trigger.focus({ preventScroll: true });
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
                    onpointermove: () => item.focus({ preventScroll: true }),
                    onpointerleave: () => {
                        if (document.activeElement === item) content.focus({ preventScroll: true });
                    },
                    onpointerup: () => select(option.value),
                    onkeydown: (event: KeyboardEvent) => {
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
                role: 'listbox',
                id: contentId,
                'data-state': 'open',
                dir: 'ltr',
                class: 'wa-portal wa-select-content',
                tabindex: '-1',
                style: 'box-sizing: border-box; display: flex; flex-direction: column; outline: none;',
                onkeydown: (event: KeyboardEvent) => {
                    // The list is not navigated with Tab.
                    if (event.key === 'Tab') event.preventDefault();
                    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
                    let candidates = items.slice();
                    if (event.key === 'ArrowUp' || event.key === 'End') candidates.reverse();
                    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                        candidates = candidates.slice(candidates.indexOf(event.target as HTMLDivElement) + 1);
                    }
                    candidates[0]?.focus({ preventScroll: true });
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
        const top = below + height <= window.innerHeight ? below : anchor.top - SELECT_SIDE_OFFSET - height;
        // Snapped to device pixels, as the popper's positioning library does, so the text is crisp.
        popover.style.transform = `translate(${roundByDpr(anchor.left)}px, ${roundByDpr(top)}px)`;

        trigger.setAttribute('aria-expanded', 'true');
        trigger.setAttribute('data-state', 'open');
        document.addEventListener('pointerdown', onPointerDownOutside, true);
        document.addEventListener('keydown', onEscape, true);
        (items.find((item) => item.getAttribute('data-state') === 'checked') ?? items[0])?.focus({
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
    };
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

/**
 * Radix Tabs (horizontal, `activationMode="automatic"`, `loop`): a `role="tablist"` of
 * `role="tab"` buttons with `data-state="active|inactive"`, and one `role="tabpanel"` per tab that
 * is `hidden` while inactive. Focus roves as in Radix: the list is the tab stop until a trigger has
 * been focused, then that trigger is; Left/Right move focus (looping) and Home/End jump to the
 * ends; a focused trigger becomes selected, as does one clicked or pressed with Space/Enter.
 * Tabbing into the list lands on the active trigger. The initially active panel carries Radix's
 * `animation-duration: 0s` mount guard until it next changes state.
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

    let tabStop: HTMLButtonElement | undefined;
    let clickFocus = false;
    let tabbingBackOut = false;

    const triggers = tabs.map((tab) => {
        const trigger = h(
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
                    // Left button only, and not with Control held (a macOS right click).
                    if (event.button === 0 && !event.ctrlKey) {
                        setTabStop(trigger);
                        onValueChange(tab.value);
                    } else {
                        event.preventDefault();
                    }
                },
                onkeydown: (event: KeyboardEvent) => {
                    if ([' ', 'Enter'].includes(event.key)) onValueChange(tab.value);
                    if (event.key === 'Tab' && event.shiftKey) {
                        // Shift+Tab leaves the list rather than landing on it.
                        tabbingBackOut = true;
                        list.setAttribute('tabindex', '-1');
                        return;
                    }
                    if (event.target !== trigger) return;
                    const candidates = focusCandidates(triggers, trigger, event.key);
                    if (!candidates || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
                    event.preventDefault();
                    setTimeout(() => candidates[0]?.focus());
                },
                onfocus: () => {
                    setTabStop(trigger);
                    // Automatic activation: focus selects.
                    if (tab.value !== value) onValueChange(tab.value);
                },
            },
            tab.label
        );
        return trigger;
    });

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
            onmousedown: () => {
                clickFocus = true;
            },
            onfocus: (event: FocusEvent) => {
                // Keyboard entry lands on the active trigger; a click focuses what was clicked.
                if (event.target === list && !clickFocus && !tabbingBackOut) {
                    (
                        triggers.find((item) => item.getAttribute('data-state') === 'active') ??
                        tabStop ??
                        triggers[0]
                    )?.focus();
                }
                clickFocus = false;
            },
            onblur: () => {
                tabbingBackOut = false;
                list.setAttribute('tabindex', '0');
            },
        },
        ...triggers
    );

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

    function setTabStop(item: HTMLButtonElement) {
        tabStop = item;
        for (const other of triggers) other.setAttribute('tabindex', other === item ? '0' : '-1');
    }

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
 * `document.body`. The content sits 6px below the anchor with its right edge on the anchor's,
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
        if (y + height > window.innerHeight - pad && reference.top - POPOVER_SIDE_OFFSET - height >= pad) {
            y = reference.top - POPOVER_SIDE_OFFSET - height;
        }
        wrapper.style.transform = `translate(${roundByDpr(x)}px, ${roundByDpr(y)}px)`;
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
        h('div', { 'data-state': 'open', role: 'dialog', id: contentId, class: 'wa-portal', tabindex: '-1' }, view.el);

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
