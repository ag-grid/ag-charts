import type { BoxBounds } from 'ag-charts-core';
import { BaseProperties } from 'ag-charts-core';

import type { EventsHub } from '../../core/eventsHub';
import type { LocaleManager } from '../../locale/localeManager';
import type { ModuleContext } from '../../module/moduleContext';
import { BBox } from '../../scene/bbox';
import { Listeners } from '../../util/listeners';
import { CollapseMode } from '../../widget/collapseMode';
import type { ExpandableWidget, ExpansionControllerWidget } from '../../widget/expandableWidget';
import type { RovingDirection } from '../../widget/rovingDirection';
import { ToolbarWidget } from '../../widget/toolbarWidget';
import type { MouseWidgetEvent } from '../../widget/widgetEvents';
import { ToolbarButtonWidget, type ToolbarButtonWidgetOptions } from './toolbarButtonWidget';

const BUTTON_ACTIVE_CLASS = 'ag-charts-toolbar__button--active';

export interface ToolbarButtonOptions extends ToolbarButtonWidgetOptions {
    section?: string;
}

export interface ToolbarEventMap<ButtonOptions extends ToolbarButtonOptions = ToolbarButtonOptions> {
    'button-pressed': {
        event: MouseWidgetEvent<'click'>;
        button: ButtonOptions & { index: number };
        buttonBounds: BoxBounds;
        buttonWidget: ExpansionControllerWidget<HTMLElement>;
    };
    'button-focused': {
        button: { index: number };
    };
}

export abstract class BaseToolbar<
    ButtonOptions extends ToolbarButtonOptions = ToolbarButtonOptions,
    ButtonWidget extends ToolbarButtonWidget = ToolbarButtonWidget,
    EventMap extends ToolbarEventMap<ButtonOptions> = ToolbarEventMap<ButtonOptions>,
> extends ToolbarWidget {
    public horizontalSpacing = 10;
    public verticalSpacing = 10;

    protected readonly events = new Listeners<keyof EventMap & string, any>();
    protected hasPrefix = false;

    private readonly buttonWidgets: Array<ButtonWidget> = [];
    private expanded?: ExpandableWidget;

    protected readonly eventsHub: EventsHub;
    protected readonly localeManager: LocaleManager;

    private readonly updateAriaLabel = () => this.setAriaLabel(this.localeManager.t(this.ariaLabelId));

    constructor(
        { eventsHub, localeManager }: ModuleContext,
        private ariaLabelId: string,
        orientation: RovingDirection
    ) {
        super(orientation);
        this.eventsHub = eventsHub;
        this.localeManager = localeManager;
        this.addClass('ag-charts-toolbar');
        this.toggleClass('ag-charts-toolbar--horizontal', orientation === 'horizontal');
        this.toggleClass('ag-charts-toolbar--vertical', orientation === 'vertical');

        this.eventsHub.on('locale:change', this.updateAriaLabel);
        this.updateAriaLabel();
    }

    public setAriaLabelId(ariaLabelId: string): void {
        this.ariaLabelId = ariaLabelId;
        this.updateAriaLabel();
    }

    public addToolbarListener<K extends keyof EventMap & string>(eventType: K, handler: (event: EventMap[K]) => void) {
        return this.events.addListener(eventType, handler);
    }

    public clearButtons() {
        this.expanded?.collapse({ mode: CollapseMode.DESTROY });
        for (const button of this.buttonWidgets) {
            button.destroy();
        }
        this.buttonWidgets.splice(0);
    }

    public updateButtons(buttons: Array<ButtonOptions>) {
        const { buttonWidgets } = this;

        for (const [index, button] of buttons.entries()) {
            const buttonWidget = this.buttonWidgets.at(index) ?? this.createButton(index, button);
            buttonWidget.update(button);
        }

        for (let index = buttons.length; index < buttonWidgets.length; index++) {
            const button = this.buttonWidgets.at(index);
            button?.destroy();
        }

        this.buttonWidgets.splice(buttons.length);
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

    public getButtonBounds() {
        return this.buttonWidgets.map((buttonWidget) => this.getButtonWidgetBounds(buttonWidget));
    }

    public setButtonHiddenByIndex(index: number, hidden: boolean) {
        // This method should be usually be avoided as it breaks keyboard navigation if a single
        // button in a toolbar is hidden.
        this.buttonWidgets.at(index)?.setHidden(hidden);
    }

    protected getButtonWidgetBounds(buttonWidget: ButtonWidget) {
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

        buttonWidget.addListener('click', (event) => {
            const buttonOptions = { index, ...(button instanceof BaseProperties ? button.toJson() : button) };
            const buttonBounds = this.getButtonWidgetBounds(buttonWidget);
            const params: ToolbarEventMap<ButtonOptions>['button-pressed'] = {
                event,
                button: buttonOptions,
                buttonBounds,
                buttonWidget,
            };
            this.events.dispatch('button-pressed', params);
        });
        buttonWidget.addListener('focus', () => {
            const params: ToolbarEventMap<ButtonOptions>['button-focused'] = { button: { index } };
            this.events.dispatch('button-focused', params);
        });
        buttonWidget.addListener('expand-controlled-widget', (e) => {
            this.expanded?.collapse({ mode: CollapseMode.SIDLING_OPENED });
            this.expanded = e.controlled;
            const removeListener = this.expanded.addListener('collapse-widget', () => {
                this.expanded = undefined;
                removeListener();
            });
        });

        if (button.section) {
            buttonWidget.section = button.section;
        }

        this.buttonWidgets.push(buttonWidget);
        this.addChild(buttonWidget);

        return buttonWidget;
    }

    protected abstract createButtonWidget(): ButtonWidget;
}

export class Toolbar<ButtonOptions extends ToolbarButtonOptions> extends BaseToolbar<ButtonOptions> {
    protected createButtonWidget() {
        return new ToolbarButtonWidget(this.localeManager);
    }
}
