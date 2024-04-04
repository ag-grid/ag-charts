import { BaseProperties } from '../../util/properties';
import { ObserveChanges } from '../../util/proxy';
import { ARRAY, BOOLEAN, UNION, Validate } from '../../util/validation';

export class ToolbarSectionProperties extends BaseProperties {
    @ObserveChanges<ToolbarSectionProperties>((target) => {
        target.onEnabledChange(target.enabled);
    })
    @Validate(BOOLEAN)
    enabled?: boolean;

    @Validate(UNION(['top', 'right', 'bottom', 'left']), { optional: true })
    position: 'top' | 'right' | 'bottom' | 'left' = 'top';

    @Validate(BOOLEAN, { optional: true })
    floating = false;

    @ObserveChanges<ToolbarSectionProperties>((target) => {
        target.onButtonsChange(target.buttons);
    })
    @Validate(ARRAY, { optional: true })
    buttons?: [{ label: string; value: any }];

    constructor(
        private readonly onEnabledChange: (enabled?: boolean) => void,
        private readonly onButtonsChange: (buttons?: [{ label: string; value: any }]) => void
    ) {
        super();
    }
}
