import { BaseProperties } from '../../util/properties';
import { ObserveChanges } from '../../util/proxy';
import { ARRAY, BOOLEAN, UNION, Validate } from '../../util/validation';
import type { ToolbarAlignment, ToolbarButton, ToolbarPosition } from './toolbarTypes';

export class ToolbarGroupProperties extends BaseProperties {
    @ObserveChanges<ToolbarGroupProperties>((target) => {
        target.onChange(target.enabled);
    })
    @Validate(BOOLEAN)
    enabled?: boolean;

    @ObserveChanges<ToolbarGroupProperties>((target) => {
        target.onChange(target.enabled);
    })
    @Validate(UNION(['start', 'middle', 'end']), { optional: true })
    align: ToolbarAlignment = 'start';

    @ObserveChanges<ToolbarGroupProperties>((target) => {
        target.onChange(target.enabled);
    })
    @Validate(UNION(['top', 'right', 'bottom', 'left']), { optional: true })
    position: ToolbarPosition = 'top';

    @ObserveChanges<ToolbarGroupProperties>((target) => {
        target.onButtonsChange(target.buttons);
    })
    @Validate(ARRAY, { optional: true })
    buttons?: Array<ToolbarButton>;

    constructor(
        private readonly onChange: (enabled?: boolean) => void,
        private readonly onButtonsChange: (buttons?: Array<ToolbarButton>) => void
    ) {
        super();
    }
}
