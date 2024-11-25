import type { ModuleContext } from '../../module/moduleContext';
import { BBox } from '../../scene/bbox';
import type { BBoxValues } from '../../util/bboxinterface';
import { BaseProperties } from '../../util/properties';
import type { ButtonWidget as BaseButtonWidget } from '../../widget/buttonWidget';
import type { RovingDirection } from '../../widget/rovingDirection';
import { ToolbarWidget } from '../../widget/toolbarWidget';
import type { MouseWidgetEvent } from '../../widget/widgetEvents';
import { ToolbarButtonWidget, type ToolbarButtonWidgetOptions } from './toolbarButtonWidget';

const BUTTON_ACTIVE_CLASS = 'ag-charts-toolbar__button--active';

export interface ToolbarButtonOptions extends ToolbarButtonWidgetOptions {
    section?: string;
}

export abstract class BaseToolbar<
    ButtonOptions extends ToolbarButtonOptions = ToolbarButtonOptions,
    ButtonWidget extends ToolbarButtonWidget = ToolbarButtonWidget,
> extends ToolbarWidget {
    public horizontalSpacing = 10;
    public verticalSpacing = 10;

    protected hasPrefix = false;

    private readonly buttonWidgets: Array<ButtonWidget> = [];

    public override set orientation(orientation: RovingDirection) {
        super.orientation = orientation;
        this.toggleClass('ag-charts-toolbar--horizontal', orientation === 'horizontal');
        this.toggleClass('ag-charts-toolbar--vertical', orientation === 'vertical');
    }

    constructor(
        protected readonly ctx: ModuleContext,
        private readonly onButtonPress: (
            event: MouseWidgetEvent<'click'>,
            button: ButtonOptions & { index: number },
            buttonBounds: BBoxValues
        ) => void
    ) {
        super();
        this.addClass('ag-charts-toolbar');
    }

    public updateButtons(buttons: Array<ButtonOptions>) {
        const { buttonWidgets } = this;

        for (const [index, button] of buttons.entries()) {
            const buttonWidget = this.buttonWidgets.at(index) ?? this.createButton(index, button);
            buttonWidget.update(button);
        }

        for (let index = buttons.length; index < buttonWidgets.length; index++) {
            const button = this.buttonWidgets.at(index);
            // this.toolbar.removeChild(button); // TODO
            button?.destroy();
        }

        this.refreshButtonClasses();
    }

    public updateButtonByIndex(index: number, button: ButtonOptions) {
        this.buttonWidgets.at(index)?.update(button);
    }

    public clearActiveButton() {
        for (const button of this.buttonWidgets) {
            button.toggleClass(BUTTON_ACTIVE_CLASS, false);
        }
    }

    public toggleActiveButtonByIndex(index: number) {
        if (index === -1) return;
        for (const [buttonIndex, button] of this.buttonWidgets.entries()) {
            button.toggleClass(BUTTON_ACTIVE_CLASS, index != null && index === buttonIndex);
        }
    }

    public toggleButtonEnabledByIndex(index: number, enabled: boolean) {
        if (index === -1) return;
        this.buttonWidgets.at(index)?.setEnabled(enabled);
    }

    public toggleSwitchCheckedByIndex(index: number, checked: boolean) {
        if (index === -1) return;
        this.buttonWidgets.at(index)?.setChecked(checked);
    }

    public toggleButtonVisibilities(visibleIndices: Array<number>) {
        for (const [index, buttonWidget] of this.buttonWidgets.entries()) {
            buttonWidget.setHidden(!visibleIndices.includes(index));
        }
        this.refreshButtonClasses();
    }

    public getButtonBounds() {
        return this.buttonWidgets.map((buttonWidget) => this.getButtonWidgetBounds(buttonWidget));
    }

    private getButtonWidgetBounds(buttonWidget: ButtonWidget) {
        const parent = this.getBounds();
        const bounds = buttonWidget.getBounds();
        return new BBox(bounds.x + parent.x, bounds.y + parent.y, bounds.width, bounds.height);
    }

    private refreshButtonClasses() {
        const { buttonWidgets, hasPrefix } = this;

        let first: boolean;
        let last: boolean;
        let section: string | null | undefined;

        for (const [index, buttonWidget] of buttonWidgets.entries()) {
            first = (!hasPrefix && index === 0) || section != buttonWidget.section;
            last = index === buttonWidgets.length - 1 || buttonWidget.section != buttonWidgets.at(index + 1)?.section;

            buttonWidget.toggleClass('ag-charts-toolbar__button--first', first);
            buttonWidget.toggleClass('ag-charts-toolbar__button--last', last);
            buttonWidget.toggleClass('ag-charts-toolbar__button--gap', index > 0 && first);

            section = buttonWidget.section;
        }
    }

    private createButton(index: number, button: ButtonOptions) {
        const buttonWidget = this.createButtonWidget();
        buttonWidget.addClass('ag-charts-toolbar__button');

        buttonWidget.addListener('click', (_, event) => {
            const buttonOptions = { index, ...(button instanceof BaseProperties ? button.toJson() : button) };
            const buttonBounds = this.getButtonWidgetBounds(buttonWidget);
            this.onButtonPress(event, buttonOptions, buttonBounds);
        });

        if (button.section) {
            buttonWidget.section = button.section;
        }

        this.buttonWidgets.push(buttonWidget);
        this.appendChild(buttonWidget as BaseButtonWidget);

        return buttonWidget;
    }

    protected abstract createButtonWidget(): ButtonWidget;
}

export class Toolbar<ButtonOptions extends ToolbarButtonOptions> extends BaseToolbar<
    ButtonOptions,
    ToolbarButtonWidget
> {
    protected createButtonWidget() {
        return new ToolbarButtonWidget(this.ctx);
    }
}
