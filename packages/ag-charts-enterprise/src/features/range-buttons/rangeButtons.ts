import { AgRangeButtonsButton, _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

const { BOOLEAN, ActionOnSet, Validate } = _ModuleSupport;

export class RangeButtons extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @ActionOnSet<RangeButtons, boolean>({
        changeValue(enabled) {
            this.updateButtonsVisibility(enabled!, this.buttons);
        },
    })
    @Validate(BOOLEAN)
    public enabled: boolean = false;

    @ActionOnSet<RangeButtons, AgRangeButtonsButton[]>({
        changeValue(buttons) {
            this.updateButtonsVisibility(this.enabled, buttons!);
        },
    })
    public buttons: AgRangeButtonsButton[] = [];

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();
    }

    private updateButtonsVisibility(enabled: boolean, buttons: AgRangeButtonsButton[]) {
        if (enabled) {
            const rangeButtons = buttons.map((button, index) => ({
                id: `range-button-${index}`,
                label: button.label,
                value: button.duration,
            }));
            this.ctx.toolbarManager.setButtonGroup('range', rangeButtons);
        } else {
            this.ctx.toolbarManager.setButtonGroup('range', []);
        }
    }
}
