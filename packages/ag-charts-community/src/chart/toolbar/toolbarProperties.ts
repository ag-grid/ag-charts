import { BaseProperties } from '../../util/properties';
import { ObserveChanges } from '../../util/proxy';
import { ARRAY, BOOLEAN, UNION, Validate } from '../../util/validation';
import type { ToolbarPosition } from './toolbarTypes';

export class ToolbarSectionProperties extends BaseProperties {
    @ObserveChanges<ToolbarSectionProperties>((target) => {
        target.onChange(target.enabled);
    })
    @Validate(BOOLEAN)
    enabled?: boolean;

    @ObserveChanges<ToolbarSectionProperties>((target) => {
        target.onChange(target.enabled);
    })
    @Validate(UNION(['top', 'right', 'bottom', 'left']), { optional: true })
    position: ToolbarPosition = 'top';

    @Validate(BOOLEAN, { optional: true })
    floating = false;

    @ObserveChanges<ToolbarSectionProperties>((target) => {
        target.onButtonsChange(target.buttons);
    })
    @Validate(ARRAY, { optional: true })
    buttons?: [{ label: string; value: any }];

    constructor(
        private readonly onChange: (enabled?: boolean) => void,
        private readonly onButtonsChange: (buttons?: [{ label: string; value: any }]) => void
    ) {
        super();
    }
}
