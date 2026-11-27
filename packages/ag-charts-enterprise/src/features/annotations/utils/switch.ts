import type { _ModuleSupport } from 'ag-charts-community';
import type { ToolbarButton } from 'ag-charts-types';

interface SwitchButtonOptions extends _ModuleSupport.ToolbarButtonOptions {
    checkedOverrides?: ToolbarButton;
}

/** A switch keeps its name when its state changes, so only an explicit `checkedOverrides.ariaLabel` renames it. */
export function withSwitchState<T extends SwitchButtonOptions>(button: T, checked: boolean): T {
    return {
        ...button,
        ariaLabel: button.ariaLabel ?? button.tooltip ?? button.label,
        ...(checked ? button.checkedOverrides : undefined),
        checked,
    };
}
