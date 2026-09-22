// Hand-rolled equivalents of the Radix UI primitives the React demo uses: the Label, Select and
// ToggleGroup it wraps in ui.tsx, and the Tabs WorkspaceApp.tsx lays the workspace out with, all
// styled by the same procurement.css. Each reproduces the DOM Radix renders (roles, aria attributes,
// `data-state` and class names) so the stylesheet, the functional specs and the parity states apply
// unchanged; the plain button helper is a styled native element, as in the React demo.
import { type Attrs, type Child, h } from './dom';

let nextId = 0;
const uid = (prefix: string) => `pc-${prefix}-${++nextId}`;

/** Radix has no Button: a native button carrying the `pc-btn` class, plus any of its own. */
export function button(attrs: Attrs, ...children: Child[]): HTMLButtonElement {
    const { class: className, ...rest } = attrs;
    // Attribute order as the React `Button` renders it: type, class, then the rest.
    return h('button', { type: 'button', class: className ? `pc-btn ${className}` : 'pc-btn', ...rest }, ...children);
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
            class: 'pc-btn pc-select-trigger',
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
                    class: 'pc-select-item',
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
                class: 'pc-portal pc-select-content',
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
            class: 'pc-labeled-select',
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
 * Radix RovingFocusGroup, shared by the toggle group and the tabs list. The group is a tab stop
 * (`tabindex="0"`) and its items are not (`-1`) until one has been focused, when that item becomes
 * the stop as well; keyboard entry into the group lands on the active item, or the last focused,
 * or the first, while a click focuses what was clicked. Arrows move focus between items and loop,
 * Home/End (and PageUp/PageDown) jump to the ends; a vertical group ignores the left/right arrows.
 * Focus is moved on a timeout, as Radix does, so the keydown finishes before the focus events run.
 */
function rovingFocus({
    group,
    items,
    orientation,
    isActive,
}: {
    group: HTMLElement;
    items: HTMLElement[];
    orientation: 'horizontal' | 'vertical';
    /** The item the group considers current, which keyboard entry lands on. */
    isActive: (item: HTMLElement) => boolean;
}) {
    let tabStop: HTMLElement | undefined;
    let clickFocus = false;

    group.addEventListener('mousedown', () => {
        clickFocus = true;
    });
    group.addEventListener('focus', (event) => {
        if (event.target === group && !clickFocus) {
            (items.find(isActive) ?? tabStop ?? items[0])?.focus();
        }
        clickFocus = false;
    });

    for (const item of items) {
        item.addEventListener('focus', () => {
            tabStop = item;
            for (const other of items) other.setAttribute('tabindex', other === item ? '0' : '-1');
        });
        item.addEventListener('keydown', (event) => {
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
 * `data-state` is `on` or `off`, with roving focus (above) that lands on the pressed item. A click
 * or Enter/Space selects; the pressed item cannot be deselected.
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
                class: 'pc-toggle-item',
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
            class: 'pc-toggle-group',
            'aria-label': ariaLabel,
            tabindex: '0',
            style: 'outline: none;',
        },
        ...items
    );
    rovingFocus({
        group: el,
        items,
        orientation: 'horizontal',
        isActive: (item) => item.getAttribute('data-state') === 'on',
    });

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

export interface Tabs {
    /** Tabs.Root: the layout container, which the owner fills. */
    root: HTMLDivElement;
    /** Tabs.List holding one Trigger per tab. */
    list: HTMLDivElement;
    /** Tabs.Content for a tab, empty: the owner mounts the active tab's view into it. */
    content(value: string): HTMLDivElement;
    /** Reflect a value set by the owner (Radix `value` prop). */
    setValue(value: string): void;
}

const TAB_ACTIVATION_KEYS = [' ', 'Enter'];

/**
 * Radix Tabs, vertical, automatic activation: a `role="tablist"` of `role="tab"` buttons with
 * roving focus (above) landing on the selected tab, and one `role="tabpanel"` per tab that is
 * `hidden` and empty while inactive. A tab activates on a left-button mousedown without Control,
 * on Space or Enter, and on focus — so arrowing through the list switches tabs.
 */
export function createTabs({
    value,
    onValueChange,
    tabs,
    ariaLabel,
    rootClass,
    listClass,
    triggerClass,
    contentClass,
}: {
    value: string;
    onValueChange: (value: string) => void;
    tabs: SelectOption[];
    ariaLabel: string;
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
                'data-orientation': 'vertical',
                onmousedown: (event: MouseEvent) => {
                    // Left button only, and not with Control held (a macOS right click), which
                    // Radix also stops from focusing the tab.
                    if (event.button === 0 && event.ctrlKey === false) onValueChange(tab.value);
                    else event.preventDefault();
                },
                onkeydown: (event: KeyboardEvent) => {
                    if (TAB_ACTIVATION_KEYS.includes(event.key)) onValueChange(tab.value);
                },
                onfocus: () => {
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
            'aria-orientation': 'vertical',
            class: listClass,
            'aria-label': ariaLabel,
            tabindex: '0',
            'data-orientation': 'vertical',
            style: 'outline: none;',
        },
        ...triggers
    );
    rovingFocus({
        group: list,
        items: triggers,
        orientation: 'vertical',
        isActive: (item) => item.getAttribute('data-state') === 'active',
    });

    const contents = new Map(
        tabs.map((tab) => [
            tab.value,
            h('div', {
                'data-state': 'inactive',
                'data-orientation': 'vertical',
                role: 'tabpanel',
                'aria-labelledby': triggerId(tab.value),
                id: contentId(tab.value),
                tabindex: '0',
                class: contentClass,
            }),
        ])
    );

    const root = h('div', { dir: 'ltr', 'data-orientation': 'vertical', class: rootClass });

    function render() {
        tabs.forEach((tab, index) => {
            const active = tab.value === value;
            triggers[index].setAttribute('aria-selected', String(active));
            triggers[index].setAttribute('data-state', active ? 'active' : 'inactive');
            const content = contents.get(tab.value)!;
            content.setAttribute('data-state', active ? 'active' : 'inactive');
            content.toggleAttribute('hidden', !active);
        });
    }
    render();

    return {
        root,
        list,
        content: (tab) => contents.get(tab)!,
        setValue(next) {
            value = next;
            render();
        },
    };
}
