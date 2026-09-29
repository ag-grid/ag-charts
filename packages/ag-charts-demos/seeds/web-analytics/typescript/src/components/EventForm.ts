import { type View, h } from '../dom';
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

const TYPES: { value: AnnotationType; label: string }[] = [
    { value: 'marketing', label: 'Marketing' },
    { value: 'product', label: 'Product' },
];

interface EventFormProps {
    /** Day the form opens on: the right-clicked point, or the end of the range. */
    date: Date;
    /** Days outside the chart's date domain would add an event the chart cannot show. */
    minDate: Date;
    maxDate: Date;
    onSubmit: (date: Date, label: string, type: AnnotationType) => void;
    onCancel: () => void;
}

/** Popover form for adding an event annotation, opened from the toolbar or the context menu. */
export function createEventForm({ date, minDate, maxDate, onSubmit, onCancel }: EventFormProps): View {
    let dateValue = toInputValue(date);
    let label = '';
    let type: AnnotationType = 'marketing';

    const submit = h('button', { type: 'submit', class: 'wa-btn wa-btn--primary' }, 'Add event');
    const render = () => {
        submit.disabled = label.trim() === '' || !dateValue;
    };

    const labelInput = h('input', {
        class: 'wa-input',
        value: label,
        maxlength: '40',
        placeholder: 'e.g. Pricing page test',
        oninput: (e: Event) => {
            label = (e.target as HTMLInputElement).value;
            render();
        },
    });

    const el = h(
        'form',
        {
            class: 'wa-event-form',
            onsubmit: (e: Event) => {
                e.preventDefault();
                onSubmit(fromInputValue(dateValue), label.trim(), type);
            },
        },
        h('label', { class: 'wa-field' }, h('span', { class: 'wa-field-label' }, 'Event name'), labelInput),
        h(
            'label',
            { class: 'wa-field' },
            h('span', { class: 'wa-field-label' }, 'Date'),
            h('input', {
                class: 'wa-input',
                type: 'date',
                value: dateValue,
                min: toInputValue(minDate),
                max: toInputValue(maxDate),
                oninput: (e: Event) => {
                    dateValue = (e.target as HTMLInputElement).value;
                    render();
                },
            })
        ),
        h(
            'fieldset',
            { class: 'wa-fieldset' },
            h('legend', { class: 'wa-field-label' }, 'Type'),
            h(
                'div',
                { class: 'wa-radio-row' },
                ...TYPES.map((option) =>
                    h(
                        'label',
                        { class: 'wa-radio' },
                        h('input', {
                            type: 'radio',
                            name: 'wa-event-type',
                            value: option.value,
                            checked: type === option.value,
                            onchange: () => {
                                type = option.value;
                            },
                        }),
                        option.label
                    )
                )
            )
        ),
        h(
            'div',
            { class: 'wa-event-form-actions' },
            h('button', { type: 'button', class: 'wa-btn', onclick: onCancel }, 'Cancel'),
            submit
        )
    );
    render();

    return {
        el,
        mount() {
            labelInput.focus();
        },
        destroy() {},
    };
}
