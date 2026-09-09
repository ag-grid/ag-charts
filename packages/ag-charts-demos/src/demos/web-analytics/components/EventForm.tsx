import { useEffect, useRef, useState } from 'react';

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
export function EventForm({ date, minDate, maxDate, onSubmit, onCancel }: EventFormProps) {
    const [dateValue, setDateValue] = useState(() => toInputValue(date));
    const [label, setLabel] = useState('');
    const [type, setType] = useState<AnnotationType>('marketing');
    const labelRef = useRef<HTMLInputElement>(null);

    useEffect(() => labelRef.current?.focus(), []);

    return (
        <form
            className="wa-event-form"
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit(fromInputValue(dateValue), label.trim(), type);
            }}
        >
            <label className="wa-field">
                <span className="wa-field-label">Event name</span>
                <input
                    ref={labelRef}
                    className="wa-input"
                    value={label}
                    maxLength={40}
                    placeholder="e.g. Pricing page test"
                    onChange={(e) => setLabel(e.target.value)}
                />
            </label>
            <label className="wa-field">
                <span className="wa-field-label">Date</span>
                <input
                    className="wa-input"
                    type="date"
                    value={dateValue}
                    min={toInputValue(minDate)}
                    max={toInputValue(maxDate)}
                    onChange={(e) => setDateValue(e.target.value)}
                />
            </label>
            <fieldset className="wa-fieldset">
                <legend className="wa-field-label">Type</legend>
                <div className="wa-radio-row">
                    {TYPES.map((option) => (
                        <label key={option.value} className="wa-radio">
                            <input
                                type="radio"
                                name="wa-event-type"
                                value={option.value}
                                checked={type === option.value}
                                onChange={() => setType(option.value)}
                            />
                            {option.label}
                        </label>
                    ))}
                </div>
            </fieldset>
            <div className="wa-event-form-actions">
                <button type="button" className="wa-btn" onClick={onCancel}>
                    Cancel
                </button>
                <button type="submit" className="wa-btn wa-btn--primary" disabled={label.trim() === '' || !dateValue}>
                    Add event
                </button>
            </div>
        </form>
    );
}
