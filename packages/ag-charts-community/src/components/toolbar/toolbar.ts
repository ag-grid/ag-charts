import type { ModuleContext } from '../../module/moduleContext';
import { BBox } from '../../scene/bbox';
import { createElement, getIconClassNames } from '../../util/dom';
import { BaseProperties } from '../../util/properties';
import type { ButtonWidget as BaseButtonWidget } from '../../widget/buttonWidget';
import { NativeWidget } from '../../widget/nativeWidget';
import { ToolbarWidget } from '../../widget/toolbarWidget';
import type { MouseWidgetEvent } from '../../widget/widgetEvents';
import { ToolbarButtonWidget, type ToolbarButtonWidgetOptions } from './toolbarButtonWidget';

const BUTTON_ACTIVE_CLASS = 'ag-charts-toolbar__button--active';

export interface ToolbarButtonOptions extends ToolbarButtonWidgetOptions {
    section?: string;
}

export abstract class BaseToolbar<
    ButtonOptions extends ToolbarButtonOptions,
    ButtonWidget extends ToolbarButtonWidget,
> extends ToolbarWidget {
    public horizontalSpacing = 10;
    public verticalSpacing = 10;

    private readonly buttonWidgets: Array<ButtonWidget> = [];

    constructor(
        protected readonly ctx: ModuleContext,
        private readonly onButtonPress: (
            button: ButtonOptions & { index: number },
            event: MouseWidgetEvent<'click'>
        ) => void,
        private readonly onDragStart?: (event: MouseEvent, element: HTMLElement) => void
    ) {
        super();
        this.addClass('ag-charts-toolbar');
        this.createDragHandle();
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
        for (const [buttonIndex, button] of this.buttonWidgets.entries()) {
            button.toggleClass(BUTTON_ACTIVE_CLASS, index != null && index === buttonIndex);
        }
    }

    public toggleButtonEnabledByIndex(index: number, enabled: boolean) {
        this.buttonWidgets.at(index)?.setEnabled(enabled);
    }

    public toggleSwitchCheckedByIndex(index: number, checked: boolean) {
        this.buttonWidgets.at(index)?.setChecked(checked);
    }

    public toggleButtonVisibilities(visibleIndices: Array<number>) {
        for (const [index, buttonWidget] of this.buttonWidgets.entries()) {
            buttonWidget.toggleClass('ag-charts-toolbar__button--hidden-toggled', !visibleIndices.includes(index));
        }
        this.refreshButtonClasses();
    }

    public getButtonBounds() {
        return this.buttonWidgets.map((buttonWidget) => {
            const element = buttonWidget.getElement();
            const parent = element.offsetParent as HTMLElement | null;
            return new BBox(
                element.offsetLeft + (parent?.offsetLeft ?? 0),
                element.offsetTop + (parent?.offsetTop ?? 0),
                element.offsetWidth,
                element.offsetHeight
            );
        });
    }

    private refreshButtonClasses() {
        const { buttonWidgets, onDragStart } = this;

        let first: boolean;
        let last: boolean;
        let section: string | null | undefined;

        for (const [index, buttonWidget] of buttonWidgets.entries()) {
            first = (onDragStart == null && index === 0) || section != buttonWidget.section;
            last = index === buttonWidgets.length - 1 || buttonWidget.section != buttonWidgets.at(index + 1)?.section;

            buttonWidget.toggleClass('ag-charts-toolbar__button--first', first);
            buttonWidget.toggleClass('ag-charts-toolbar__button--last', last);
            buttonWidget.toggleClass('ag-charts-toolbar__button--gap', index > 0 && first);

            section = buttonWidget.section;
        }
    }

    private createDragHandle() {
        const { onDragStart } = this;
        if (!onDragStart) return;

        const dragHandle = new NativeWidget<HTMLElement>(createElement('div', 'ag-charts-toolbar__drag-handle'));
        dragHandle.getElement().innerHTML = `<span class="${getIconClassNames('drag-handle')} ag-charts-toolbar__icon"></span>`;
        dragHandle.getElement().addEventListener('mousedown', (event) => {
            onDragStart(event, dragHandle.getElement());
        });
        this.appendChild(dragHandle);
    }

    private createButton(index: number, button: ButtonOptions) {
        const buttonWidget = this.createButtonWidget();
        buttonWidget.addClass('ag-charts-toolbar__button');

        buttonWidget.addListener('click', (_, event) => {
            this.onButtonPress({ index, ...(button instanceof BaseProperties ? button.toJson() : button) }, event);
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
