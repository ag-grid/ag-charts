import type { AgIconName } from './icons';

export type AgIconPosition = 'before' | 'after';

export interface ToolbarButton {
    /** Icon to display on the button. */
    icon?: AgIconName;
    /**
     * Position of the icon, before or after the label.
     *
     * Default: `'before'`
     */
    iconPosition?: AgIconPosition;
    /** Text label to display on the button. */
    label?: string;
    /** Text label to announce in screen readers. */
    ariaLabel?: string;
    /** Tooltip text to display on hover over the button. */
    tooltip?: string;
}

export interface ToolbarSwitch extends ToolbarButton {
    /** Overrides for the switch-button when checked. */
    checkedOverrides?: ToolbarButton;
}
