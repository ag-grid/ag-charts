import type { ModuleContext } from '../../module/moduleContext';
import { BBox } from '../../scene/bbox';
import { createElement, getIconClassNames } from '../../util/dom';
import { BaseProperties } from '../../util/properties';
import type { ButtonWidget as BaseButtonWidget } from '../../widget/buttonWidget';
import { NativeWidget } from '../../widget/nativeWidget';
import { ToolbarWidget } from '../../widget/toolbarWidget';
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
        private readonly onButtonPress: (button: ButtonOptions & { index: number; sourceEvent: MouseEvent }) => void,
        private readonly onDragStart?: (sourceEvent: MouseEvent, element: HTMLElement) => void
    ) {
        super();

        const element = this.getElement();
        element.classList.add('ag-charts-toolbar');

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
        buttonWidget.getElement().ariaDisabled = (!enabled).toString();
    }

    public toggleSwitchCheckedByIndex(index: number, checked: boolean) {
        const buttonWidget = this.buttonWidgets.at(index);
        if (!buttonWidget) return;
        buttonWidget.getElement().ariaChecked = checked.toString();
    }

    public toggleButtonVisibilities(visibleIndices: Array<number>) {
        for (const [index, buttonWidget] of this.buttonWidgets.entries()) {
            buttonWidget
                .getElement()
                .classList.toggle('ag-charts-toolbar__button--hidden-toggled', !visibleIndices.includes(index));
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
            const element = buttonWidget.getElement();

            first = (onDragStart == null && index === 0) || section != element.getAttribute('data-section');
            last =
                index === buttonWidgets.length - 1 ||
                element.getAttribute('data-section') !=
                    buttonWidgets
                        .at(index + 1)
                        ?.getElement()
                        .getAttribute('data-section');

            element.classList.toggle('ag-charts-toolbar__button--first', first);
            element.classList.toggle('ag-charts-toolbar__button--last', last);
            element.classList.toggle('ag-charts-toolbar__button--gap', index > 0 && first);

            section = element.getAttribute('data-section');
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
        const element = buttonWidget.getElement();
        element.classList.add('ag-charts-toolbar__button');

        element.addEventListener('click', (sourceEvent) => {
            this.onButtonPress({
                index,
                ...(button instanceof BaseProperties ? button.toJson() : button),
                sourceEvent,
            });
        });

        if (button.section) {
            element.setAttribute('data-section', button.section);
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
