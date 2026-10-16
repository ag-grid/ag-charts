import { stripFloatingPointErrors } from '../../theming/utils';
import { FormattedInput } from './FormattedInput';
import type { ValueEditorProps } from './ValueEditorProps';

/** A unitless multiplier such as a line height ratio, shown as the raw number (1.5) rather than a percentage. */
export const RatioValueEditor = ({ value, onChange, icon, swipeAdjustmentDivisor = 175 }: ValueEditorProps<number>) => {
    return (
        <FormattedInput
            value={value == null ? '' : String(value)}
            onChange={(newValue) => {
                const parsed = parseFloat(newValue);
                if (!isNaN(parsed)) {
                    onChange(parsed);
                }
            }}
            onClear={() => onChange(null)}
            validateEditingString={(editingString) => {
                const ratio = parseFloat(editingString);
                return isNaN(ratio) ? null : stripFloatingPointErrors(ratio);
            }}
            icon={icon}
            getIconSwipeAdjustment={(value, pixels) => {
                const ratio = parseFloat(value);
                if (isNaN(ratio)) {
                    return value;
                }
                return stripFloatingPointErrors(ratio + pixels / swipeAdjustmentDivisor);
            }}
        />
    );
};
