// Thin wrappers around Radix UI primitives, styled via procurement.css. Radix gives
// accessible, keyboard-navigable selects and toggles; the plain button helper below is
// a styled native element (Radix has no Button).
import * as RLabel from '@radix-ui/react-label';
import * as RSelect from '@radix-ui/react-select';
import * as RToggleGroup from '@radix-ui/react-toggle-group';
import { type ButtonHTMLAttributes, type ReactNode, forwardRef, useId } from 'react';

// Forwards its ref so a caller can put focus back on the control it came from — see `AttentionAlert`.
export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
    ({ children, className, type = 'button', ...rest }, ref) => (
        <button
            ref={ref}
            type={type}
            className={className == null || className === '' ? 'pc-btn' : `pc-btn ${className}`}
            {...rest}
        >
            {children}
        </button>
    )
);
Button.displayName = 'Button';

export interface SelectOption {
    value: string;
    label: string;
}

export function Select({
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
    label?: string;
}) {
    const trigger = (
        <RSelect.Root value={value} onValueChange={onValueChange}>
            <RSelect.Trigger className="pc-btn pc-select-trigger" aria-label={ariaLabel}>
                <RSelect.Value />
                <RSelect.Icon>▾</RSelect.Icon>
            </RSelect.Trigger>
            <RSelect.Portal>
                <RSelect.Content className="pc-portal pc-select-content" position="popper" sideOffset={4}>
                    <RSelect.Viewport>
                        {options.map((option) => (
                            <RSelect.Item key={option.value} value={option.value} className="pc-select-item">
                                <RSelect.ItemText>{option.label}</RSelect.ItemText>
                            </RSelect.Item>
                        ))}
                    </RSelect.Viewport>
                </RSelect.Content>
            </RSelect.Portal>
        </RSelect.Root>
    );
    if (label == null || label === '') return trigger;
    return (
        <RLabel.Root className="pc-labeled-select">
            <span>{label}</span>
            {trigger}
        </RLabel.Root>
    );
}

export interface ToggleOption extends SelectOption {
    /** Shown in place of the text; the label is kept as the item's accessible name and tooltip. */
    icon?: ReactNode;
}

/** A 16px filled glyph on Carbon's 32-unit grid, inked in the item's text colour. */
export function ToggleIcon({ children }: { children: ReactNode }) {
    return (
        <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" focusable="false">
            {children}
        </svg>
    );
}

export function ToggleGroup({
    value,
    onValueChange,
    options,
    ariaLabel,
    label,
}: {
    value: string;
    onValueChange: (value: string) => void;
    options: ToggleOption[];
    ariaLabel: string;
    label?: string;
}) {
    const labelId = useId();
    const hasLabel = label != null && label !== '';
    const group = (
        <RToggleGroup.Root
            className="pc-toggle-group"
            type="single"
            value={value}
            aria-label={hasLabel ? undefined : ariaLabel}
            aria-labelledby={hasLabel ? labelId : undefined}
            onValueChange={(next) => {
                if (next !== '') onValueChange(next);
            }}
        >
            {options.map((option) =>
                option.icon == null ? (
                    <RToggleGroup.Item key={option.value} className="pc-toggle-item" value={option.value}>
                        {option.label}
                    </RToggleGroup.Item>
                ) : (
                    <RToggleGroup.Item
                        key={option.value}
                        className="pc-toggle-item pc-toggle-item--icon"
                        value={option.value}
                        aria-label={option.label}
                        title={option.label}
                    >
                        {option.icon}
                    </RToggleGroup.Item>
                )
            )}
        </RToggleGroup.Root>
    );
    if (!hasLabel) return group;
    return (
        <div className="pc-labeled-select">
            <span id={labelId}>{label}</span>
            {group}
        </div>
    );
}
