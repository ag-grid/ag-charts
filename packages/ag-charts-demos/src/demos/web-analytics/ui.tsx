// Thin wrappers around Radix UI primitives, styled via web-analytics.css.
import * as RLabel from '@radix-ui/react-label';
import * as RSelect from '@radix-ui/react-select';

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
            <RSelect.Trigger className="wa-btn wa-select-trigger" aria-label={ariaLabel}>
                <RSelect.Value />
                <RSelect.Icon>▾</RSelect.Icon>
            </RSelect.Trigger>
            <RSelect.Portal>
                <RSelect.Content className="wa-portal wa-select-content" position="popper" sideOffset={4}>
                    <RSelect.Viewport>
                        {options.map((option) => (
                            <RSelect.Item key={option.value} value={option.value} className="wa-select-item">
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
        <RLabel.Root className="wa-labeled-select">
            <span>{label}</span>
            {trigger}
        </RLabel.Root>
    );
}
