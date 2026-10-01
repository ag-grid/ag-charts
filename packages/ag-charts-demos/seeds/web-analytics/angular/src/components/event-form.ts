import { Component, ElementRef, afterNextRender, input, linkedSignal, output, signal, viewChild } from '@angular/core';

import type { AnnotationType } from '../types';

const pad = (n: number) => String(n).padStart(2, '0');

/** `<input type="date">` speaks 'YYYY-MM-DD' in local time; Date#toISOString does not. */
const toInputValue = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const fromInputValue = (value: string) => {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
};

/** Viewport coordinates of the right-click the form was opened from. */
export interface FormAnchor {
    x: number;
    y: number;
}

/** What the form submits: the React `onSubmit(date, label, type)` arguments as one payload. */
export interface EventFormValue {
    date: Date;
    label: string;
    type: AnnotationType;
}

const TYPES: { value: AnnotationType; label: string }[] = [
    { value: 'marketing', label: 'Marketing' },
    { value: 'product', label: 'Product' },
];

/**
 * Popover form for adding an event annotation, opened from the toolbar or the context menu. The
 * host is the `<form>` the React version renders.
 */
@Component({
    selector: 'form[waEventForm]',
    host: { class: 'wa-event-form', '(submit)': 'onSubmit($event)' },
    template: `
        <label class="wa-field">
            <span class="wa-field-label">Event name</span>
            <input
                #labelInput
                class="wa-input"
                [value]="label()"
                maxlength="40"
                placeholder="e.g. Pricing page test"
                (input)="label.set(labelInput.value)"
            />
        </label>
        <label class="wa-field">
            <span class="wa-field-label">Date</span>
            <input
                #dateInput
                class="wa-input"
                type="date"
                [value]="dateValue()"
                [attr.min]="toInputValue(minDate())"
                [attr.max]="toInputValue(maxDate())"
                (input)="dateValue.set(dateInput.value)"
            />
        </label>
        <fieldset class="wa-fieldset">
            <legend class="wa-field-label">Type</legend>
            <div class="wa-radio-row">
                @for (option of types; track option.value) {
                    <label class="wa-radio">
                        <input
                            type="radio"
                            name="wa-event-type"
                            [value]="option.value"
                            [checked]="type() === option.value"
                            (change)="type.set(option.value)"
                        />{{ option.label }}
                    </label>
                }
            </div>
        </fieldset>
        <div class="wa-event-form-actions">
            <button type="button" class="wa-btn" (click)="cancel.emit()">Cancel</button>
            <button type="submit" class="wa-btn wa-btn--primary" [disabled]="label().trim() === '' || !dateValue()"
                >Add event</button
            >
        </div>
    `,
})
export class EventForm {
    /** Day the form opens on: the right-clicked point, or the end of the range. */
    readonly date = input.required<Date>();
    /** Days outside the chart's date domain would add an event the chart cannot show. */
    readonly minDate = input.required<Date>();
    readonly maxDate = input.required<Date>();
    readonly submitted = output<EventFormValue>();
    readonly cancel = output<void>();

    protected readonly types = TYPES;
    protected readonly toInputValue = toInputValue;
    // The React `useState(() => toInputValue(date))`: seeded from the input, then the user's own.
    protected readonly dateValue = linkedSignal(() => toInputValue(this.date()));
    protected readonly label = signal('');
    protected readonly type = signal<AnnotationType>('marketing');

    private readonly labelInput = viewChild.required<ElementRef<HTMLInputElement>>('labelInput');

    constructor() {
        // The React mount effect: focus the name field once the form is in the document.
        afterNextRender(() => this.labelInput().nativeElement.focus());
    }

    protected onSubmit(event: Event): void {
        event.preventDefault();
        this.submitted.emit({ date: fromInputValue(this.dateValue()), label: this.label().trim(), type: this.type() });
    }
}
