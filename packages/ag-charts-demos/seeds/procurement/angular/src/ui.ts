// The Angular counterparts of the React demo's Radix UI wrappers (ui.tsx) and of the Radix Tabs the
// workspace is laid out with, styled via procurement.css. Each renders the DOM Radix renders (same
// elements, classes, roles and data-* state attributes), with Angular CDK supplying the behaviour:
// FocusKeyManager for the tab list's and toggle group's roving focus, and the overlay +
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
    type AfterViewInit,
    Component,
    Directive,
    ElementRef,
    TemplateRef,
    ViewContainerRef,
    afterNextRender,
    contentChildren,
    inject,
    input,
    model,
    output,
    signal,
    viewChild,
    viewChildren,
} from '@angular/core';

/**
 * Mounts its content once the first render of the page has completed, as React mounts a chart: the
 * React wrapper creates its chart in a layout effect, after the whole tree has been committed, so
 * the chart measures its container with every sibling laid out. An Angular child component's
 * `ngAfterViewInit` runs as soon as its own view is checked, before later siblings have rendered
 * their bound content, so a chart created there can measure a container whose height a later
 * sibling still changes. A container at a fractional width then snaps differently, and the port's
 * canvas comes out a pixel narrower than the reference's. Every `<ag-charts>` and `<ag-gauge>` in the
 * port mounts through this so it is created in the same phase as its React counterpart.
 */
@Directive({ selector: '[pcAfterRender]' })
export class AfterRender {
    constructor() {
        const viewContainer = inject(ViewContainerRef);
        const template = inject(TemplateRef);
        afterNextRender(() => viewContainer.createEmbeddedView(template));
    }
}

/** A styled native button (Radix has no Button): `<button pcBtn>` gets `type="button"` and the `pc-btn` class. */
@Directive({
    selector: 'button[pcBtn]',
    host: { class: 'pc-btn', type: 'button' },
})
export class PcButton {}

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
    selector: 'div[pcSelectItem]',
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
 * trigger, with the listbox in an overlay while open. The React `Select` renders the bare trigger
 * when given no label; every select in this demo has one, so the label host is not optional here.
 */
@Component({
    selector: 'label[pcSelect]',
    imports: [CdkConnectedOverlay, CdkOverlayOrigin, SelectItem],
    host: { class: 'pc-labeled-select' },
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
            class="pc-btn pc-select-trigger"
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
                class="pc-portal pc-select-content"
                tabindex="-1"
                style="box-sizing: border-box; display: flex; flex-direction: column; outline: none;"
                (keydown)="onListKeydown($event)"
            >
                <div role="presentation" style="position: relative; flex: 1 1 0%; overflow: auto;">
                    @for (option of options(); track option.value) {
                        <div
                            pcSelectItem
                            [value]="option.value"
                            role="option"
                            [attr.aria-selected]="option.value === value()"
                            [attr.data-state]="option.value === value() ? 'checked' : 'unchecked'"
                            tabindex="-1"
                            class="pc-select-item"
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

    protected readonly contentId = `pc-select-${nextSelectId++}`;
    protected readonly positions = SELECT_POSITIONS;
    protected readonly open = signal(false);
    protected readonly selectedLabel = () => this.options().find((option) => option.value === this.value())?.label;

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

/** One item of the toggle group, focusable by the group's key manager. */
@Directive({ selector: 'button[pcToggleItem]', host: { '(focus)': 'focused.emit(value())' } })
export class ToggleItem implements FocusableOption {
    readonly value = input.required<string>();
    /** Radix's roving tab stop: the item last focused is the one Tab returns to. */
    readonly focused = output<string>();
    private readonly element = inject<ElementRef<HTMLButtonElement>>(ElementRef);

    focus(): void {
        this.element.nativeElement.focus();
    }
}

/**
 * Radix `ToggleGroup.Root type="single"`: a radiogroup of buttons where exactly one is on, with
 * roving focus (the group takes the tab stop, the arrow keys move between items).
 */
@Component({
    selector: 'div[pcToggleGroup]',
    imports: [ToggleItem],
    host: {
        class: 'pc-toggle-group',
        role: 'radiogroup',
        dir: 'ltr',
        tabindex: '0',
        style: 'outline: none;',
        '[attr.aria-label]': 'ariaLabel()',
        '(focus)': 'onFocus($event)',
        '(keydown)': 'onKeydown($event)',
    },
    template: `
        @for (option of options(); track option.value) {
            <button
                pcToggleItem
                type="button"
                [value]="option.value"
                [attr.data-state]="option.value === value() ? 'on' : 'off'"
                role="radio"
                [attr.aria-checked]="option.value === value()"
                class="pc-toggle-item"
                [tabindex]="option.value === tabStop() ? 0 : -1"
                (click)="valueChange.emit(option.value)"
                (focused)="tabStop.set($event)"
                >{{ option.label }}</button
            >
        }
    `,
})
export class ToggleGroup implements AfterViewInit {
    readonly value = input.required<string>();
    readonly options = input.required<SelectOption[]>();
    readonly ariaLabel = input.required<string>();
    readonly valueChange = output<string>();

    // The item holding the roving tab stop (`tabindex="0"`), none until one has been focused.
    protected readonly tabStop = signal<string | undefined>(undefined);

    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly items = viewChildren(ToggleItem);
    private keyManager!: FocusKeyManager<ToggleItem>;

    ngAfterViewInit(): void {
        // The options are fixed for the group's lifetime, so a snapshot of the items is enough.
        this.keyManager = new FocusKeyManager(this.items())
            .withHorizontalOrientation('ltr')
            .withWrap()
            .withHomeAndEnd();
    }

    /** Focus landing on the group itself moves on to the item that is on. */
    protected onFocus(event: FocusEvent): void {
        if (event.target !== this.host.nativeElement) return;
        const index = this.items().findIndex((item) => item.value() === this.value());
        this.keyManager.setActiveItem(Math.max(0, index));
    }

    protected onKeydown(event: KeyboardEvent): void {
        this.keyManager.onKeydown(event);
    }
}

let nextTabsId = 0;

/**
 * Radix `Tabs.Root orientation="vertical"`: the root element, holding the selected value and the
 * id scheme its triggers and panels are linked by. Applied as a host directive by the component
 * whose host is the root (`WorkspaceApp`), which reads and sets `value` through injection.
 */
@Directive({
    selector: 'div[pcTabs]',
    host: { dir: 'ltr', 'data-orientation': 'vertical' },
})
export class Tabs {
    /** The selected tab's value; Radix's controlled `value` + `onValueChange` as one two-way signal. */
    readonly value = model('');

    private readonly baseId = `pc-tabs-${nextTabsId++}`;

    triggerId(value: string): string {
        return `${this.baseId}-trigger-${value}`;
    }

    contentId(value: string): string {
        return `${this.baseId}-content-${value}`;
    }

    /** Radix only reports a change, so selecting the selected tab again is a no-op. */
    select(value: string): void {
        if (value !== this.value()) this.value.set(value);
    }
}

/**
 * Radix `Tabs.List` (a roving-focus group): `role="tablist"`, with the group holding a tab stop of
 * its own that hands focus on to the active tab, and the arrow keys moving between triggers.
 */
@Directive({
    selector: 'div[pcTabsList]',
    host: {
        role: 'tablist',
        'aria-orientation': 'vertical',
        'data-orientation': 'vertical',
        style: 'outline: none;',
        '[tabindex]': 'tabbingBackOut() ? -1 : 0',
        '(mousedown)': 'clickFocus = true',
        '(focus)': 'onFocus($event)',
        '(blur)': 'tabbingBackOut.set(false)',
    },
})
export class TabsList implements AfterContentInit {
    /** The trigger holding the roving tab stop (`tabindex="0"`), none until one has been focused. */
    readonly tabStop = signal<string | undefined>(undefined);
    /** Set while Shift+Tab leaves the list, so the group's own tab stop does not catch the focus. */
    protected readonly tabbingBackOut = signal(false);
    protected clickFocus = false;

    private readonly tabs = inject(Tabs);
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly triggers = contentChildren(TabTrigger);
    private keyManager!: FocusKeyManager<TabTrigger>;

    ngAfterContentInit(): void {
        // The tabs are fixed for the workspace's lifetime, so a snapshot of the triggers is enough.
        this.keyManager = new FocusKeyManager(this.triggers()).withVerticalOrientation().withWrap().withHomeAndEnd();
    }

    /** Keyboard focus landing on the list itself moves on to the active tab (else the last focused). */
    protected onFocus(event: FocusEvent): void {
        const keyboardFocus = !this.clickFocus;
        this.clickFocus = false;
        if (event.target !== this.host.nativeElement || !keyboardFocus || this.tabbingBackOut()) return;
        const triggers = this.triggers();
        const index = triggers.findIndex((trigger) => trigger.value() === this.tabs.value());
        const current = triggers.findIndex((trigger) => trigger.value() === this.tabStop());
        this.keyManager.setActiveItem(index >= 0 ? index : Math.max(0, current));
    }

    onTriggerFocus(trigger: TabTrigger): void {
        this.tabStop.set(trigger.value());
        this.keyManager.updateActiveItem(trigger);
    }

    onTriggerKeydown(event: KeyboardEvent): void {
        if (event.key === 'Tab' && event.shiftKey) {
            this.tabbingBackOut.set(true);
            return;
        }
        this.keyManager.onKeydown(event);
    }
}

/**
 * Radix `Tabs.Trigger`: a `role="tab"` button that activates on focus (automatic activation),
 * mouse down or Enter/Space, linked to its panel by id.
 */
@Directive({
    selector: 'button[pcTabTrigger]',
    host: {
        type: 'button',
        role: 'tab',
        'data-orientation': 'vertical',
        '[attr.aria-selected]': 'selected()',
        '[attr.aria-controls]': 'tabs.contentId(value())',
        '[attr.data-state]': "selected() ? 'active' : 'inactive'",
        '[id]': 'tabs.triggerId(value())',
        '[tabindex]': 'value() === list.tabStop() ? 0 : -1',
        '(mousedown)': 'onMousedown($event)',
        '(keydown)': 'onKeydown($event)',
        '(focus)': 'onFocus()',
    },
})
export class TabTrigger implements FocusableOption {
    readonly value = input.required<string>();

    protected readonly tabs = inject(Tabs);
    protected readonly list = inject(TabsList);
    private readonly element = inject<ElementRef<HTMLButtonElement>>(ElementRef);

    protected readonly selected = () => this.value() === this.tabs.value();

    focus(): void {
        this.element.nativeElement.focus();
    }

    /** A primary click selects; Radix suppresses the others so they do not move focus either. */
    protected onMousedown(event: MouseEvent): void {
        if (event.button === 0 && !event.ctrlKey) this.tabs.select(this.value());
        else event.preventDefault();
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (event.target !== event.currentTarget) return;
        if (event.key === ' ' || event.key === 'Enter') this.tabs.select(this.value());
        this.list.onTriggerKeydown(event);
    }

    protected onFocus(): void {
        this.list.onTriggerFocus(this);
        this.tabs.select(this.value());
    }
}

/**
 * Radix `Tabs.Content` for the selected tab. Radix unmounts the other panels, so the parent only
 * renders the selected one and this directive always reads as active.
 */
@Directive({
    selector: 'div[pcTabContent]',
    host: {
        role: 'tabpanel',
        'data-state': 'active',
        'data-orientation': 'vertical',
        tabindex: '0',
        '[attr.aria-labelledby]': 'tabs.triggerId(value())',
        '[id]': 'tabs.contentId(value())',
    },
})
export class TabContent {
    readonly value = input.required<string>();
    protected readonly tabs = inject(Tabs);
}
