// The Angular counterparts of the Radix UI primitives the React demo uses, styled via
// web-analytics.css. `Select` mirrors the wrapper in ui.tsx; the tabs primitives mirror the
// `@radix-ui/react-tabs` components WebAnalyticsApp.tsx uses directly. Each renders the DOM Radix
// renders (same elements, classes, roles and data-* state attributes) and follows Radix's pointer
// and keyboard behaviour: the roving focus of the tab list, and the select's typeahead, focus
// handling and dismissal, with the Angular CDK overlay holding the select's listbox.
import {
    CdkConnectedOverlay,
    CdkOverlayOrigin,
    type ConnectedOverlayPositionChange,
    type ConnectedPosition,
} from '@angular/cdk/overlay';
import {
    Component,
    Directive,
    ElementRef,
    computed,
    contentChildren,
    effect,
    inject,
    input,
    output,
    signal,
    viewChild,
    viewChildren,
} from '@angular/core';

export interface SelectOption {
    value: string;
    label: string;
}

let nextSelectId = 0;
let nextSelectItemId = 0;

const SELECT_POSITIONS: ConnectedPosition[] = [
    // Radix `position="popper"`, side bottom, align start, with the fallback above.
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
];

const SELECT_OPEN_KEYS = [' ', 'Enter', 'ArrowUp', 'ArrowDown'];
const SELECT_SELECTION_KEYS = [' ', 'Enter'];
const SELECT_NAVIGATION_KEYS = ['ArrowUp', 'ArrowDown', 'Home', 'End'];
/** How long Radix's typeahead keeps what has been typed after the last character. */
const TYPEAHEAD_RESET_MS = 1000;

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
    };
}

/**
 * Radix `findNextItem`: the first of `items` at or after `current` (wrapping round) whose label
 * starts with the search, case-insensitively. A run of one repeated character searches on that
 * character alone and skips `current`, so pressing it again cycles through the items starting with
 * it. Nothing is returned when the match is `current` itself.
 */
function findNextItem<T>(items: readonly T[], labelOf: (item: T) => string, search: string, current: T | undefined) {
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
 * Radix `Select.Item`: a `role="option"` labelled by the span holding its text, `aria-selected`
 * while it is the value and has focus, `data-state` for the value and `data-highlighted` for focus.
 */
@Directive({
    selector: 'div[waSelectItem]',
    exportAs: 'waSelectItem',
    host: {
        role: 'option',
        tabindex: '-1',
        '[attr.aria-labelledby]': 'textId',
        '[attr.aria-selected]': 'selected() && focused()',
        '[attr.data-state]': "selected() ? 'checked' : 'unchecked'",
        '[attr.data-highlighted]': "focused() ? '' : null",
        '(focus)': 'focused.set(true)',
        '(blur)': 'focused.set(false)',
    },
})
export class SelectItem {
    readonly value = input.required<string>();
    readonly label = input.required<string>();
    readonly selected = input.required<boolean>();

    /** The id of the span holding the item's text, which labels it. */
    readonly textId = `wa-select-item-text-${nextSelectItemId++}`;
    readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    protected readonly focused = signal(false);

    focus(): void {
        this.element.focus({ preventScroll: true });
    }
}

/**
 * Radix `Label.Root` + `Select.Root`: a `<label>` host wrapping the label text and the combobox
 * trigger, with the listbox in an overlay while open. The React wrapper renders the bare trigger
 * when no label is given; the demo always labels it, so only the labelled form is reproduced.
 * Pointer and keyboard behaviour follows Radix:
 * open on pointer down or Space/Enter/arrows, the selected item takes focus and `data-highlighted`
 * follows focus, arrows and Home/End move it, Space/Enter or pointer up select, Escape or a pointer
 * down outside closes and focus returns to the trigger. Typing searches the options: on the closed
 * trigger the value moves to the match, in the open listbox the match takes focus. While open, the
 * rest of the page is `aria-hidden` and takes no pointer events.
 */
@Component({
    selector: 'label[waSelect]',
    imports: [CdkConnectedOverlay, CdkOverlayOrigin, SelectItem],
    host: { class: 'wa-labeled-select' },
    template: `
        <span>{{ label() }}</span>
        <button
            #trigger
            cdkOverlayOrigin
            type="button"
            role="combobox"
            [attr.aria-controls]="contentId"
            [attr.aria-expanded]="open()"
            aria-autocomplete="none"
            dir="ltr"
            [attr.data-state]="open() ? 'open' : 'closed'"
            class="wa-btn wa-select-trigger"
            [attr.aria-label]="ariaLabel()"
            (pointerdown)="onTriggerPointerdown($event)"
            (click)="onTriggerClick()"
            (keydown)="onTriggerKeydown($event)"
        >
            <span style="pointer-events: none;">{{ selectedLabel() }}</span>
            <span aria-hidden="true">▾</span>
        </button>
        <ng-template
            cdkConnectedOverlay
            [cdkConnectedOverlayOrigin]="trigger"
            [cdkConnectedOverlayOpen]="open()"
            [cdkConnectedOverlayOffsetY]="4"
            [cdkConnectedOverlayPositions]="positions"
            (positionChange)="onPositionChange($event)"
            (attach)="onAttach()"
            (detach)="onDetach()"
        >
            <div
                #listbox
                role="listbox"
                [id]="contentId"
                data-state="open"
                [attr.data-side]="side()"
                data-align="start"
                dir="ltr"
                class="wa-portal wa-select-content"
                tabindex="-1"
                style="box-sizing: border-box; display: flex; flex-direction: column; outline: none; pointer-events: auto;"
                (keydown)="onListKeydown($event)"
            >
                <div role="presentation" style="position: relative; flex: 1 1 0%; overflow: auto;">
                    @for (option of options(); track option.value) {
                        <div
                            waSelectItem
                            #item="waSelectItem"
                            [value]="option.value"
                            [label]="option.label"
                            [selected]="option.value === value()"
                            class="wa-select-item"
                            (pointermove)="onItemPointermove($event, item)"
                            (pointerleave)="onItemPointerleave(item)"
                            (pointerup)="choose(option.value)"
                            (keydown)="onItemKeydown($event, option.value)"
                        >
                            <span [id]="item.textId">{{ option.label }}</span>
                        </div>
                    }
                </div>
            </div>
        </ng-template>
    `,
})
export class Select {
    readonly value = input.required<string>();
    readonly options = input.required<SelectOption[]>();
    readonly ariaLabel = input.required<string>();
    readonly label = input.required<string>();
    readonly valueChange = output<string>();

    protected readonly contentId = `wa-select-${nextSelectId++}`;
    protected readonly positions = SELECT_POSITIONS;
    protected readonly open = signal(false);
    /** The side of the trigger the listbox settled on: below unless it had to flip. */
    protected readonly side = signal<'bottom' | 'top'>('bottom');
    protected readonly selectedLabel = computed(
        () => this.options().find((option) => option.value === this.value())?.label
    );

    private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
    private readonly listbox = viewChild<ElementRef<HTMLElement>>('listbox');
    // The items live in the overlay, so they exist only while open.
    private readonly items = viewChildren(SelectItem);
    private readonly triggerTypeahead = createTypeahead();
    private readonly contentTypeahead = createTypeahead();
    // What last pressed the trigger: Radix opens on pointer down for a mouse, on click otherwise.
    private pointerType = 'touch';
    /** Undoes what opening did to the rest of the page: the hidden siblings and body pointer events. */
    private restorePage?: () => void;

    /**
     * Left mouse button only, and not with Control held (a macOS right click). Radix prevents the
     * default so the trigger does not take focus from the item the listbox focuses.
     */
    protected onTriggerPointerdown(event: PointerEvent): void {
        this.pointerType = event.pointerType;
        if (event.button === 0 && !event.ctrlKey && event.pointerType === 'mouse') {
            this.open.set(true);
            event.preventDefault();
        }
    }

    /** Reached by a label click (a mouse pointer down is prevented above): focus, and open for touch and pen. */
    protected onTriggerClick(): void {
        this.trigger().nativeElement.focus();
        if (this.pointerType !== 'mouse') this.open.set(true);
    }

    protected onTriggerKeydown(event: KeyboardEvent): void {
        const typingAhead = this.triggerTypeahead.active;
        // A character typed on the closed trigger moves the value to the option it matches.
        if (!hasModifier(event) && event.key.length === 1) {
            const options = this.options();
            const current = options.find((option) => option.value === this.value());
            const search = this.triggerTypeahead.add(event.key);
            const next = findNextItem(options, (option) => option.label, search, current);
            if (next !== undefined) this.valueChange.emit(next.value);
        }
        // Space extends a search in progress rather than opening.
        if (typingAhead && event.key === ' ') return;
        if (SELECT_OPEN_KEYS.includes(event.key)) {
            this.open.set(true);
            event.preventDefault();
        }
    }

    protected choose(value: string): void {
        this.valueChange.emit(value);
        this.open.set(false);
    }

    /** The mouse moving over an item focuses it; leaving hands focus back to the list. */
    protected onItemPointermove(event: PointerEvent, item: SelectItem): void {
        if (event.pointerType === 'mouse') item.focus();
    }

    protected onItemPointerleave(item: SelectItem): void {
        if (document.activeElement === item.element) this.listbox()?.nativeElement.focus({ preventScroll: true });
    }

    protected onItemKeydown(event: KeyboardEvent, value: string): void {
        // Space during a search extends it rather than selecting.
        if (event.key === ' ' && this.contentTypeahead.active) return;
        if (SELECT_SELECTION_KEYS.includes(event.key)) this.choose(value);
        // Space must not scroll the page.
        if (event.key === ' ') event.preventDefault();
    }

    protected onListKeydown(event: KeyboardEvent): void {
        // The list is not navigated with Tab.
        if (event.key === 'Tab') event.preventDefault();
        const items = this.items();
        // A character typed in the open list focuses the option it matches.
        if (!hasModifier(event) && event.key.length === 1) {
            const current = items.find((item) => item.element === document.activeElement);
            const search = this.contentTypeahead.add(event.key);
            const next = findNextItem(items, (item) => item.label(), search, current);
            if (next) setTimeout(() => next.focus());
        }
        if (!SELECT_NAVIGATION_KEYS.includes(event.key)) return;
        let candidates = items.slice();
        if (event.key === 'ArrowUp' || event.key === 'End') candidates.reverse();
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            candidates = candidates.slice(candidates.findIndex((item) => item.element === event.target) + 1);
        }
        // Focus moves on a timeout, as in Radix, so the keydown finishes first.
        setTimeout(() => candidates[0]?.focus());
        event.preventDefault();
    }

    protected onPositionChange(change: ConnectedOverlayPositionChange): void {
        this.side.set(change.connectionPair.overlayY === 'top' ? 'bottom' : 'top');
    }

    /**
     * Once the overlay holds the listbox: hide the rest of the page from assistive technology and
     * turn its pointer events off, so a pointer down anywhere outside only dismisses, then focus
     * the selected item, else the list itself.
     */
    protected onAttach(): void {
        queueMicrotask(() => {
            const listbox = this.listbox()?.nativeElement;
            if (!listbox) return;
            const unhide = hideOthers(listbox);
            const bodyPointerEvents = document.body.style.pointerEvents;
            document.body.style.pointerEvents = 'none';
            document.addEventListener('pointerdown', this.onPointerdownOutside, true);
            this.restorePage = () => {
                unhide();
                document.body.style.pointerEvents = bodyPointerEvents;
                document.removeEventListener('pointerdown', this.onPointerdownOutside, true);
            };
            const selected = this.items().find((item) => item.selected());
            if (selected) selected.focus();
            else listbox.focus({ preventScroll: true });
        });
    }

    /**
     * The listbox has gone, closed here or by the overlay on Escape: restore the page and hand focus
     * back. Radix does the latter once the listbox has unmounted, on a timeout: a pointer down
     * outside has moved focus by then, and the trigger still ends up with it.
     */
    protected onDetach(): void {
        this.open.set(false);
        this.restorePage?.();
        this.restorePage = undefined;
        setTimeout(() => this.trigger().nativeElement.focus({ preventScroll: true }));
    }

    private readonly onPointerdownOutside = (event: PointerEvent) => {
        const listbox = this.listbox()?.nativeElement;
        if (listbox && !listbox.contains(event.target as Node)) this.open.set(false);
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
 * Radix RovingFocusGroup, as the tabs list uses it. The group is a tab stop (`tabindex="0"`)
 * and its items are not (`-1`) until one has been focused, when that item becomes a stop as well;
 * keyboard entry into the group lands on the active item, or the last focused, or the first, while
 * a click focuses what was clicked. Arrows move focus between items and loop, Home/End (and
 * PageUp/PageDown) jump to the ends; a group with an orientation ignores the other axis's arrows.
 * Shift+Tab from an item takes the group out of the tab order until focus has left, so it lands
 * before the group rather than on it. Focus is moved on a timeout, as Radix does, so the keydown
 * finishes before the focus events run. The host binds its events to the handlers here.
 */
class RovingFocus {
    /** The item holding the roving tab stop (`tabindex="0"`), none until one has been focused. */
    readonly tabStop = signal<HTMLElement | undefined>(undefined);
    /** Set while Shift+Tab leaves the group, so the group's own tab stop does not catch the focus. */
    readonly tabbingBackOut = signal(false);
    private clickFocus = false;

    constructor(
        private readonly options: {
            group: HTMLElement;
            items: () => HTMLElement[];
            orientation?: 'horizontal' | 'vertical';
            /** The item the group considers current, which keyboard entry lands on. */
            isActive: (item: HTMLElement) => boolean;
        }
    ) {}

    /** `(mousedown)` on the group: the focus that follows is a click's, not the keyboard's. */
    onMousedown(): void {
        this.clickFocus = true;
    }

    /** `(focusin)` on the group: keyboard focus landing on the group itself moves on to an item. */
    onFocusin(event: FocusEvent): void {
        const keyboardFocus = !this.clickFocus;
        this.clickFocus = false;
        if (event.target !== this.options.group || !keyboardFocus || this.tabbingBackOut()) return;
        const items = this.options.items();
        (items.find(this.options.isActive) ?? this.tabStop() ?? items[0])?.focus();
    }

    /** `(focusout)` on the group: focus has left, or moved within it. */
    onFocusout(): void {
        this.tabbingBackOut.set(false);
    }

    /** `(focus)` on an item: it takes the tab stop. */
    onItemFocus(item: HTMLElement): void {
        this.tabStop.set(item);
    }

    /** `(keydown)` on the group, for the keys pressed on an item. */
    onKeydown(event: KeyboardEvent): void {
        const items = this.options.items();
        const item = event.target as HTMLElement;
        if (!items.includes(item)) return;
        if (event.key === 'Tab' && event.shiftKey) {
            this.tabbingBackOut.set(true);
            return;
        }
        const { orientation } = this.options;
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
    }
}

let nextTabsId = 0;

/**
 * Radix `Tabs.Trigger`: a `role="tab"` button in a `TabList` that activates on focus (automatic
 * activation, so moving focus with the arrow keys switches tabs), primary mouse down or Enter/Space,
 * linked to its panel by id. The tab last focused keeps the roving tab stop.
 */
@Directive({
    selector: 'button[waTabTrigger]',
    host: {
        type: 'button',
        role: 'tab',
        'data-orientation': 'horizontal',
        '[attr.aria-selected]': 'selected()',
        '[attr.aria-controls]': 'list.contentId(value())',
        '[attr.data-state]': "selected() ? 'active' : 'inactive'",
        '[id]': 'list.triggerId(value())',
        '[tabindex]': 'list.roving.tabStop() === element ? 0 : -1',
        '(mousedown)': 'onMousedown($event)',
        '(keydown)': 'onKeydown($event)',
        '(focus)': 'list.onTriggerFocus(this)',
    },
})
export class TabTrigger {
    readonly value = input.required<string>();
    readonly element = inject<ElementRef<HTMLButtonElement>>(ElementRef).nativeElement;
    protected readonly list = inject(TabList);
    protected readonly selected = computed(() => this.list.value() === this.value());

    /** A primary click selects; Radix suppresses the others so they do not move focus either. */
    protected onMousedown(event: MouseEvent): void {
        if (event.button === 0 && !event.ctrlKey) this.list.select(this.value());
        else event.preventDefault();
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (event.target !== event.currentTarget) return;
        if (event.key === ' ' || event.key === 'Enter') this.list.select(this.value());
    }
}

/**
 * Radix `Tabs.List` (with `Tabs.Root`'s value state, since the root is the app's own host element):
 * a horizontal, looping tablist whose triggers are its content children, with the roving focus
 * above.
 */
@Component({
    selector: 'div[waTabList]',
    host: {
        role: 'tablist',
        'aria-orientation': 'horizontal',
        'data-orientation': 'horizontal',
        style: 'outline: none;',
        '[tabindex]': 'roving.tabbingBackOut() ? -1 : 0',
        '(mousedown)': 'roving.onMousedown()',
        '(focusin)': 'roving.onFocusin($event)',
        '(focusout)': 'roving.onFocusout()',
        '(keydown)': 'roving.onKeydown($event)',
    },
    template: '<ng-content />',
})
export class TabList {
    readonly value = input.required<string>();
    readonly valueChange = output<string>();

    private readonly id = `wa-tabs-${nextTabsId++}`;
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly triggers = contentChildren(TabTrigger);

    readonly roving = new RovingFocus({
        group: this.host.nativeElement,
        items: () => this.triggers().map((trigger) => trigger.element),
        orientation: 'horizontal',
        isActive: (item) => item.getAttribute('data-state') === 'active',
    });

    triggerId(value: string): string {
        return `${this.id}-trigger-${value}`;
    }

    contentId(value: string): string {
        return `${this.id}-content-${value}`;
    }

    /** Radix only reports a change, so selecting the selected tab again is a no-op. */
    select(value: string): void {
        if (value !== this.value()) this.valueChange.emit(value);
    }

    /** Automatic activation: the focused trigger takes the tab stop and is selected. */
    onTriggerFocus(trigger: TabTrigger): void {
        this.roving.onItemFocus(trigger.element);
        this.select(trigger.value());
    }
}

/**
 * Radix `Tabs.Content`: the panel for one tab. Radix keeps every panel in the DOM, `hidden` while
 * inactive, and mounts children only into the active one; the parent template does the latter with
 * an `@if` on the same value.
 */
@Directive({
    selector: 'div[waTabContent]',
    host: {
        role: 'tabpanel',
        'data-orientation': 'horizontal',
        tabindex: '0',
        '[attr.data-state]': "active() ? 'active' : 'inactive'",
        '[attr.aria-labelledby]': 'tabs().triggerId(value())',
        '[id]': 'tabs().contentId(value())',
    },
})
export class TabContent {
    /** The `TabList` whose selected tab this panel belongs to. */
    readonly tabs = input.required<TabList>();
    readonly value = input.required<string>();
    protected readonly active = computed(() => this.tabs().value() === this.value());

    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    constructor() {
        // `hidden` is not a host binding: Angular applies those only after checking the `@if`
        // views, so the charts mounted into a newly selected panel would measure it while it was
        // still hidden. React unhides the panel and mounts the view in one commit, before any chart
        // is created. A view's effects run before its `@if` views are checked, keeping that order.
        effect(() => this.host.toggleAttribute('hidden', !this.active()));
    }
}
