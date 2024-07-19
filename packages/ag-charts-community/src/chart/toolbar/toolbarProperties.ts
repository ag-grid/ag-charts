import { Logger } from '../../util/logger';
import { BaseProperties } from '../../util/properties';
import { ObserveChanges } from '../../util/proxy';
import { ARRAY, BOOLEAN, UNION, Validate } from '../../util/validation';
import {
    TOOLBAR_ALIGNMENTS,
    TOOLBAR_POSITIONS,
    type ToolbarAlignment,
    type ToolbarButton,
    ToolbarPosition,
} from './toolbarTypes';

export class ToolbarGroupProperties extends BaseProperties {
    @ObserveChanges<ToolbarGroupProperties>((target) => {
        target.onChange(target.enabled);
    })
    @Validate(BOOLEAN)
    enabled?: boolean;

    @ObserveChanges<ToolbarGroupProperties>((target) => {
        target.onChange(target.enabled);
    })
    @Validate(UNION([...TOOLBAR_ALIGNMENTS]), { optional: true })
    align: ToolbarAlignment = 'start';

    @ObserveChanges<ToolbarGroupProperties>((target) => {
        target.onChange(target.enabled);
    })
    @Validate(UNION(TOOLBAR_POSITIONS), { optional: true })
    position: ToolbarPosition = ToolbarPosition.Top;

    @ObserveChanges<ToolbarGroupProperties>((target) => {
        target.onChange(target.enabled);
    })
    @Validate(UNION(['small', 'normal']), { optional: true })
    size: 'small' | 'normal' = 'normal';

    @ObserveChanges<ToolbarGroupProperties>((target) => {
        for (const button of target.buttons ?? []) {
            if (button.icon === 'zoom-in-alt' || button.icon === 'zoom-out-alt') {
                Logger.warnOnce(`Icon '${button.icon}' is deprecated, use another icon instead.`);
            }
            if (button.value != null && typeof button.value === 'object' && button.id == null) {
                Logger.warnOnce(`Buttons with non-primitive values must specify an id.`);
            }
        }
        target.buttonsChanged();
    })
    @Validate(ARRAY, { optional: true })
    protected buttons?: Array<ToolbarButton>;

    private readonly buttonOverrides = new Map<any, Omit<ToolbarButton, 'value'>>();

    constructor(
        private readonly onChange: (enabled?: boolean) => void,
        private readonly onButtonsChange: (buttons?: Array<ToolbarButton>) => void
    ) {
        super();
    }

    buttonConfigurations() {
        return (
            this.buttons?.map((button) => {
                const id = button.id ?? button.value;
                const overrides = this.buttonOverrides.get(id);
                return overrides != null ? { ...button, ...overrides } : button;
            }) ?? []
        );
    }

    private buttonsChanged() {
        this.onButtonsChange(this.buttonConfigurations());
    }

    overrideButtonConfiguration(id: string, options: Omit<ToolbarButton, 'value'> | undefined) {
        if (options == null) {
            this.buttonOverrides.delete(id);
        } else {
            this.buttonOverrides.set(id, options);
        }

        this.buttonsChanged();
    }
}
