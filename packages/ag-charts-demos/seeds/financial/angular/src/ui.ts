// The Angular counterparts of the React demo's Radix UI wrappers (ui.tsx), styled for the terminal
// via financial.css. Each renders the DOM Radix renders (same elements, classes, roles and data-*
// state attributes), with Angular CDK supplying the behaviour: FocusKeyManager for the toggle
// group's roving focus, and the overlay + ActiveDescendantKeyManager for the select's listbox.
import {
    ActiveDescendantKeyManager,
    FocusKeyManager,
    type FocusableOption,
    type Highlightable,
} from '@angular/cdk/a11y';
import { CdkConnectedOverlay, CdkOverlayOrigin, type ConnectedPosition } from '@angular/cdk/overlay';
import {
    AfterViewInit,
    Component,
    Directive,
    ElementRef,
    inject,
    input,
    output,
    signal,
    viewChild,
    viewChildren,
} from '@angular/core';

/** A styled native button (Radix has no Button): `<button finBtn>` gets `type="button"` and the `fin-btn` class. */
@Directive({
    selector: 'button[finBtn]',
    host: { class: 'fin-btn', type: 'button' },
})
export class FinButton {}

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
    selector: 'div[finSelectItem]',
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
 * trigger, with the listbox in an overlay while open.
 */
@Component({
    selector: 'label[finSelect]',
    imports: [CdkConnectedOverlay, CdkOverlayOrigin, SelectItem],
    host: { class: 'fin-labeled-select', '[attr.for]': 'label()' },
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
            class="fin-btn fin-select-trigger"
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
                class="fin-portal fin-select-content"
                tabindex="-1"
                style="box-sizing: border-box; display: flex; flex-direction: column; outline: none;"
                (keydown)="onListKeydown($event)"
            >
                <div role="presentation" style="position: relative; flex: 1 1 0%; overflow: auto;">
                    @for (option of options(); track option.value) {
                        <div
                            finSelectItem
                            [value]="option.value"
                            role="option"
                            [attr.aria-selected]="option.value === value()"
                            [attr.data-state]="option.value === value() ? 'checked' : 'unchecked'"
                            tabindex="-1"
                            class="fin-select-item"
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

    protected readonly contentId = `fin-select-${nextSelectId++}`;
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
@Directive({ selector: 'button[finToggleItem]', host: { '(focus)': 'focused.emit(value())' } })
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
    selector: 'div[finToggleGroup]',
    imports: [ToggleItem],
    host: {
        class: 'fin-toggle-group',
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
                finToggleItem
                type="button"
                [value]="option.value"
                [attr.data-state]="option.value === value() ? 'on' : 'off'"
                role="radio"
                [attr.aria-checked]="option.value === value()"
                class="fin-toggle-item"
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
