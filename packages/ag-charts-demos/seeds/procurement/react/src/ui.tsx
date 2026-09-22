// Thin wrappers around Radix UI primitives, styled via procurement.css. Radix gives
// accessible, keyboard-navigable selects and toggles; the plain button helper below is
// a styled native element (Radix has no Button).
import * as RLabel from '@radix-ui/react-label';
import * as RSelect from '@radix-ui/react-select';
import * as RToggleGroup from '@radix-ui/react-toggle-group';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

// Forwards its ref so a caller can put focus back on the control it came from — see `AttentionAlert`.
export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
    ({ children, className, type = 'button', ...rest }, ref) => (
        <button ref={ref} type={type} className={className ? `pc-btn ${className}` : 'pc-btn'} {...rest}>
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
    if (!label) return trigger;
    return (
        <RLabel.Root className="pc-labeled-select">
            <span>{label}</span>
            {trigger}
        </RLabel.Root>
    );
}

export function ToggleGroup({
    value,
    onValueChange,
    options,
    ariaLabel,
}: {
    value: string;
    onValueChange: (value: string) => void;
    options: SelectOption[];
    ariaLabel: string;
}) {
    return (
        <RToggleGroup.Root
            className="pc-toggle-group"
            type="single"
            value={value}
            aria-label={ariaLabel}
            onValueChange={(next) => next && onValueChange(next)}
        >
            {options.map((option) => (
                <RToggleGroup.Item key={option.value} className="pc-toggle-item" value={option.value}>
                    {option.label}
                </RToggleGroup.Item>
            ))}
        </RToggleGroup.Root>
    );
}
