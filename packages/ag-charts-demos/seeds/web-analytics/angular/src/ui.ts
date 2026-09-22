// The Angular counterparts of the Radix UI primitives the React demo uses, styled via
// web-analytics.css. `Select` mirrors the wrapper in ui.tsx; the tabs primitives mirror the
// `@radix-ui/react-tabs` components WebAnalyticsApp.tsx uses directly. Each renders the DOM Radix
// renders (same elements, classes, roles and data-* state attributes), with the Angular CDK
// supplying the behaviour: FocusKeyManager for the tab list's roving focus, and the overlay +
// ActiveDescendantKeyManager for the select's listbox.
import {
    ActiveDescendantKeyManager,
    FocusKeyManager,
    type FocusableOption,
    type Highlightable,
} from '@angular/cdk/a11y';
import { CdkConnectedOverlay, CdkOverlayOrigin, type ConnectedPosition } from '@angular/cdk/overlay';
import {
    type AfterContentInit,
    Component,
    Directive,
    ElementRef,
    computed,
    contentChildren,
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

const SELECT_POSITIONS: ConnectedPosition[] = [
    // Radix `position="popper"`, side bottom, align start, with the fallback above.
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
];

/** One option of the select's listbox; the key manager highlights it as Radix does with `data-highlighted`. */
@Directive({
    selector: 'div[waSelectItem]',
    host: { '[attr.data-highlighted]': "active() ? '' : null" },
})
export class SelectItem implements Highlightable {
    readonly value = input.required<string>();
    readonly active = signal(false);

    setActiveStyles(): void {
        this.active.set(true);
    }

    setInactiveStyles(): void {
        this.active.set(false);
    }
}

/**
 * Radix `Label.Root` + `Select.Root`: a `<label>` host wrapping the label text and the combobox
 * trigger, with the listbox in an overlay while open. The React wrapper renders the bare trigger
 * when no label is given; the demo always labels it, so only the labelled form is reproduced.
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
            (click)="toggle()"
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
            (overlayOutsideClick)="close()"
            (detach)="close()"
            (attach)="onAttach()"
        >
            <div
                #listbox
                role="listbox"
                [id]="contentId"
                data-state="open"
                data-side="bottom"
                data-align="start"
                dir="ltr"
                class="wa-portal wa-select-content"
                tabindex="-1"
                style="box-sizing: border-box; display: flex; flex-direction: column; outline: none;"
                (keydown)="onListKeydown($event)"
            >
                <div role="presentation" style="position: relative; flex: 1 1 0%; overflow: auto;">
                    @for (option of options(); track option.value) {
                        <div
                            waSelectItem
                            [value]="option.value"
                            role="option"
                            [attr.aria-selected]="option.value === value()"
                            [attr.data-state]="option.value === value() ? 'checked' : 'unchecked'"
                            tabindex="-1"
                            class="wa-select-item"
                            (click)="choose(option.value)"
                            (pointermove)="highlight(option.value)"
                        >
                            <span>{{ option.label }}</span>
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
    protected readonly selectedLabel = computed(
        () => this.options().find((option) => option.value === this.value())?.label
    );

    private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
    private readonly listbox = viewChild<ElementRef<HTMLElement>>('listbox');
    private readonly items = viewChildren(SelectItem);
    // The items live in the overlay, so they (and the manager over them) exist only while open.
    private keyManager?: ActiveDescendantKeyManager<SelectItem>;

    protected toggle(): void {
        this.open.update((open) => !open);
    }

    protected close(): void {
        if (!this.open()) return;
        this.open.set(false);
        this.trigger().nativeElement.focus();
    }

    protected choose(value: string): void {
        this.valueChange.emit(value);
        this.close();
    }

    protected highlight(value: string): void {
        const index = this.items().findIndex((item) => item.value() === value);
        if (index >= 0 && this.keyManager?.activeItemIndex !== index) this.keyManager?.setActiveItem(index);
    }

    /** Radix opens the listbox on the arrow keys too; Enter and Space click the button natively. */
    protected onTriggerKeydown(event: KeyboardEvent): void {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            this.open.set(true);
        }
    }

    protected onListKeydown(event: KeyboardEvent): void {
        switch (event.key) {
            case 'Enter':
            case ' ': {
                event.preventDefault();
                const active = this.keyManager?.activeItem;
                if (active) this.choose(active.value());
                return;
            }
            case 'Escape':
                event.preventDefault();
                this.close();
                return;
            case 'Tab':
                this.close();
                return;
            default:
                this.keyManager?.onKeydown(event);
        }
    }

    /** Once the overlay holds the listbox: highlight the current value and move focus into the list. */
    protected onAttach(): void {
        queueMicrotask(() => {
            this.keyManager = new ActiveDescendantKeyManager(this.items()).withVerticalOrientation().withHomeAndEnd();
            this.highlight(this.value());
            this.listbox()?.nativeElement.focus();
        });
    }
}

let nextTabsId = 0;

/**
 * Radix `Tabs.Trigger`: a `role="tab"` button in a `TabList`. Radix activates on focus (automatic
 * activation), so moving focus with the arrow keys switches tabs; a click focuses first and so does
 * the same. The tab last focused keeps the roving tab stop.
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
        '[tabindex]': 'list.tabStop() === value() ? 0 : -1',
        '(focus)': 'list.onItemFocus(value())',
        '(click)': 'list.select(value())',
    },
})
export class TabTrigger implements FocusableOption {
    readonly value = input.required<string>();
    protected readonly list = inject(TabList);
    protected readonly selected = computed(() => this.list.value() === this.value());
    private readonly element = inject<ElementRef<HTMLButtonElement>>(ElementRef);

    focus(): void {
        this.element.nativeElement.focus();
    }
}

/**
 * Radix `Tabs.List` (with `Tabs.Root`'s value state, since the root is the app's own host element):
 * a horizontal, looping tablist whose triggers are its content children. Focus landing on the list
 * itself moves on to the selected tab, as Radix's roving focus group does.
 */
@Component({
    selector: 'div[waTabList]',
    host: {
        role: 'tablist',
        'aria-orientation': 'horizontal',
        tabindex: '0',
        'data-orientation': 'horizontal',
        style: 'outline: none;',
        '(focus)': 'onFocus($event)',
        '(keydown)': 'onKeydown($event)',
    },
    template: '<ng-content />',
})
export class TabList implements AfterContentInit {
    readonly value = input.required<string>();
    readonly valueChange = output<string>();

    // The trigger holding the roving tab stop (`tabindex="0"`), none until one has been focused.
    readonly tabStop = signal<string | undefined>(undefined);

    private readonly id = `wa-tabs-${nextTabsId++}`;
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly triggers = contentChildren(TabTrigger);
    private keyManager!: FocusKeyManager<TabTrigger>;

    triggerId(value: string): string {
        return `${this.id}-trigger-${value}`;
    }

    contentId(value: string): string {
        return `${this.id}-content-${value}`;
    }

    select(value: string): void {
        if (value !== this.value()) this.valueChange.emit(value);
    }

    onItemFocus(value: string): void {
        this.tabStop.set(value);
        this.select(value);
    }

    ngAfterContentInit(): void {
        // The tabs are fixed for the list's lifetime, so a snapshot of the triggers is enough.
        this.keyManager = new FocusKeyManager(this.triggers())
            .withHorizontalOrientation('ltr')
            .withWrap()
            .withHomeAndEnd();
    }

    /** Focus landing on the list itself moves on to the selected tab. */
    protected onFocus(event: FocusEvent): void {
        if (event.target !== this.host.nativeElement) return;
        const index = this.triggers().findIndex((trigger) => trigger.value() === this.value());
        this.keyManager.setActiveItem(Math.max(0, index));
    }

    protected onKeydown(event: KeyboardEvent): void {
        this.keyManager.onKeydown(event);
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
        '[attr.hidden]': "active() ? null : ''",
        '[attr.aria-labelledby]': 'tabs().triggerId(value())',
        '[id]': 'tabs().contentId(value())',
    },
})
export class TabContent {
    /** The `TabList` whose selected tab this panel belongs to. */
    readonly tabs = input.required<TabList>();
    readonly value = input.required<string>();
    protected readonly active = computed(() => this.tabs().value() === this.value());
}
