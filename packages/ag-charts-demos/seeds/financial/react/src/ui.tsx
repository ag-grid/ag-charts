// Thin wrappers around Radix UI primitives, styled for the terminal via
// financial.css. Radix gives us accessible, keyboard-navigable selects and toggles;
// the plain button helper below is a styled native element (Radix has no Button).
import * as RLabel from '@radix-ui/react-label';
import * as RSelect from '@radix-ui/react-select';
import * as RToggleGroup from '@radix-ui/react-toggle-group';
import { type ButtonHTMLAttributes } from 'react';

export function Button({ children, className, type = 'button', ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button type={type} className={className ? `fin-btn ${className}` : 'fin-btn'} {...rest}>
            {children}
        </button>
    );
}

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
    label: string;
}) {
    return (
        <>
            <RLabel.Root htmlFor={label} className="fin-labeled-select">
                <span>{label}</span>
                <RSelect.Root value={value} onValueChange={onValueChange}>
                    <RSelect.Trigger className="fin-btn fin-select-trigger" aria-label={ariaLabel}>
                        <RSelect.Value />
                        <RSelect.Icon>▾</RSelect.Icon>
                    </RSelect.Trigger>
                    <RSelect.Portal>
                        <RSelect.Content className="fin-portal fin-select-content" position="popper" sideOffset={4}>
                            <RSelect.Viewport>
                                {options.map((option) => (
                                    <RSelect.Item key={option.value} value={option.value} className="fin-select-item">
                                        <RSelect.ItemText>{option.label}</RSelect.ItemText>
                                    </RSelect.Item>
                                ))}
                            </RSelect.Viewport>
                        </RSelect.Content>
                    </RSelect.Portal>
                </RSelect.Root>
            </RLabel.Root>
        </>
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
            className="fin-toggle-group"
            type="single"
            value={value}
            aria-label={ariaLabel}
            onValueChange={(next) => next && onValueChange(next)}
        >
            {options.map((option) => (
                <RToggleGroup.Item key={option.value} className="fin-toggle-item" value={option.value}>
                    {option.label}
                </RToggleGroup.Item>
            ))}
        </RToggleGroup.Root>
    );
}
