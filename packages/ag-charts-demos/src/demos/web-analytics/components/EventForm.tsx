import { useEffect, useLayoutEffect, useRef, useState } from 'react';

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

/** Keeps an anchored form clear of the viewport edges. */
const MARGIN = 8;

const TYPES: { value: AnnotationType; label: string }[] = [
    { value: 'marketing', label: 'Marketing' },
    { value: 'product', label: 'Product' },
];

interface EventFormProps {
    /** Day the form opens on: the right-clicked point, or the end of the range. */
    date: Date;
    /** Days outside the plotted domain would add an event the chart cannot show. */
    minDate: Date;
    maxDate: Date;
    onSubmit: (date: Date, label: string, type: AnnotationType) => void;
    onCancel: () => void;
    /** Set when opened from the context menu; otherwise the form sits under its button. */
    anchor?: FormAnchor;
}

/** Popover form for adding an event annotation, opened from the toolbar or the context menu. */
export function EventForm({ date, minDate, maxDate, onSubmit, onCancel, anchor }: EventFormProps) {
    const [dateValue, setDateValue] = useState(() => toInputValue(date));
    const [label, setLabel] = useState('');
    const [type, setType] = useState<AnnotationType>('marketing');
    const labelRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const [position, setPosition] = useState(anchor);

    useEffect(() => labelRef.current?.focus(), []);

    // Placed before paint, from the rendered size, so the form never opens off-screen.
    useLayoutEffect(() => {
        const form = formRef.current;
        if (!anchor || !form) return;
        const { width, height } = form.getBoundingClientRect();
        setPosition({
            x: Math.max(MARGIN, Math.min(anchor.x, window.innerWidth - width - MARGIN)),
            y: Math.max(MARGIN, Math.min(anchor.y, window.innerHeight - height - MARGIN)),
        });
    }, [anchor]);

    return (
        <form
            ref={formRef}
            className={anchor ? 'wa-event-form wa-event-form--anchored' : 'wa-event-form'}
            style={position && { left: position.x, top: position.y }}
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit(fromInputValue(dateValue), label.trim(), type);
            }}
            onKeyDown={(e) => {
                if (e.key === 'Escape') onCancel();
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
