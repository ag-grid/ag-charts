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
}

const SELECT_OPEN_KEYS = [' ', 'Enter', 'ArrowUp', 'ArrowDown'];
const SELECT_SELECTION_KEYS = [' ', 'Enter'];
/** Popover offset below the trigger (Radix `sideOffset`). */
const SELECT_SIDE_OFFSET = 4;

const roundByDpr = (value: number) => {
    const dpr = window.devicePixelRatio || 1;
    return Math.round(value * dpr) / dpr;
};

/**
 * Radix Select: a `role="combobox"` trigger inside a label, with a `role="listbox"` popover of
 * `role="option"` items appended to `document.body` while open, positioned under the trigger.
 * Pointer and keyboard behaviour follows Radix: open on pointer down or Space/Enter/arrows, the
 * selected item takes focus and `data-highlighted` follows focus, arrows and Home/End move it,
 * Space/Enter or pointer up select, Escape or a pointer down outside closes and focus returns to
 * the trigger. Typeahead is not reproduced.
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
                    class: 'fin-select-item',
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
                class: 'fin-portal fin-select-content',
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

    const el = h(
        'label',
        {
            for: label,
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
    };
}

export interface ToggleGroup {
    el: HTMLDivElement;
    /** Reflect a value set by the owner (Radix `value` prop). */
    setValue(value: string): void;
}

const FOCUS_INTENT: Record<string, 'prev' | 'next' | 'first' | 'last'> = {
    ArrowLeft: 'prev',
    ArrowUp: 'prev',
    ArrowRight: 'next',
    ArrowDown: 'next',
    Home: 'first',
    End: 'last',
};

/**
 * Radix ToggleGroup, `type="single"`: a `role="radiogroup"` of `role="radio"` buttons whose
 * `data-state` is `on` or `off`. Focus roves as in Radix: the group is the tab stop until an item
 * has been focused, then that item is; arrows move focus between items (looping), Home and End
 * jump to the ends, and tabbing into the group lands on the pressed item.
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
    let tabStop: HTMLButtonElement | undefined;
    let clickFocus = false;

    const items = options.map((option) => {
        const item = h(
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
                onfocus: () => setTabStop(item),
                onkeydown: (event: KeyboardEvent) => {
                    if (event.target !== item) return;
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
                    candidates[0]?.focus();
                },
            },
            option.label
        );
        return item;
    });

    const el = h(
        'div',
        {
            dir: 'ltr',
            role: 'radiogroup',
            class: 'fin-toggle-group',
            'aria-label': ariaLabel,
            tabindex: '0',
            style: 'outline: none;',
            onmousedown: () => {
                clickFocus = true;
            },
            onfocus: (event: FocusEvent) => {
                // Keyboard entry lands on the pressed item; a click focuses what was clicked.
                if (event.target === el && !clickFocus) {
                    (items.find((item) => item.getAttribute('data-state') === 'on') ?? tabStop ?? items[0])?.focus();
                }
                clickFocus = false;
            },
        },
        ...items
    );

    function setTabStop(item: HTMLButtonElement) {
        tabStop = item;
        el.setAttribute('tabindex', '-1');
        for (const other of items) other.setAttribute('tabindex', other === item ? '0' : '-1');
    }

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
