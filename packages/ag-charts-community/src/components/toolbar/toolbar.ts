import type { ModuleContext } from '../../module/moduleContext';
import { BaseProperties } from '../../util/properties';
import type { ButtonWidget } from '../../widget/buttonWidget';
import { ToolbarWidget } from '../../widget/toolbarWidget';
import { ToolbarButtonWidget, type ToolbarButtonWidgetOptions } from './toolbarButtonWidget';

const BUTTON_ACTIVE_CLASS = 'ag-charts-toolbar__button--active';

export interface ToolbarButtonOptions extends ToolbarButtonWidgetOptions {
    section?: string;
}

export class Toolbar<Button extends ToolbarButtonOptions> extends ToolbarWidget {
    public verticalSpacing = 10;

    private readonly buttonWidgets: Array<ToolbarButtonWidget> = [];

    constructor(
        private readonly ctx: ModuleContext,
        private readonly onButtonPress: (button: Button & { index: number }) => void
    ) {
        super();
        const element = this.getElement();
        element.classList.add('ag-charts-toolbar');
    }

    public updateButtons(buttons: Array<Button>) {
        const { buttonWidgets } = this;

        let first: boolean;
        let last: boolean;
        let section: string | undefined;

        for (const [index, button] of buttons.entries()) {
            const buttonWidget = this.buttonWidgets.at(index) ?? this.createButton(index, button);
            buttonWidget.update(button);

            first = index === 0 || section != button.section;
            last = index === buttons.length - 1 || button.section != buttons.at(index + 1)?.section;

            const element = buttonWidget.getElement();
            element.classList.toggle('ag-charts-toolbar__button--first', first);
            element.classList.toggle('ag-charts-toolbar__button--last', last);
            element.classList.toggle('ag-charts-zoom-buttons__button--gap', index > 0 && first);

            section = button.section;
        }

        for (let index = buttons.length; index < buttonWidgets.length; index++) {
            const button = this.buttonWidgets.at(index);
            // this.toolbar.removeChild(button); // TODO
            button?.destroy();
        }
    }

    public clearActiveButton() {
        for (const button of this.buttonWidgets) {
            button.getElement().classList.toggle(BUTTON_ACTIVE_CLASS, false);
        }
    }

    public toggleActiveButtonByIndex(index: number) {
        for (const [buttonIndex, button] of this.buttonWidgets.entries()) {
            button.getElement().classList.toggle(BUTTON_ACTIVE_CLASS, index != null && index === buttonIndex);
        }
    }

    public toggleButtonEnabledByIndex(index: number, enabled: boolean) {
        const buttonWidget = this.buttonWidgets.at(index);
        if (!buttonWidget) return;
        buttonWidget.getElement().ariaDisabled = `${!enabled}`;
    }

    private createButton(index: number, button: Button) {
        const { ctx } = this;

        const buttonWidget = new ToolbarButtonWidget(ctx);
        const element = buttonWidget.getElement();
        element.classList.add('ag-charts-toolbar__button');
        element.addEventListener('click', () => {
            this.onButtonPress({ index, ...(button instanceof BaseProperties ? button.toJson() : button) });
        });

        this.buttonWidgets.push(buttonWidget);
        this.appendChild(buttonWidget as ButtonWidget);

        return buttonWidget;
    }
}
