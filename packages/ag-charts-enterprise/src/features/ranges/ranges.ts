import {
    type AgRangesButtonValue,
    type AgRangesDropdown,
    type AgRangesPosition,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    AbstractModuleInstance,
    ChartAxisDirection,
    PropertiesArray,
    Property,
    clamp,
    intervalAgo,
    isTimeInterval,
    isTimeIntervalUnit,
    isValidDate,
} from 'ag-charts-core';

import { RangesButtonProperties } from './rangesButtonProperties';

const { userInteraction, LayoutElement, Toolbar } = _ModuleSupport;

const DEFAULT_DROPDOWN_LABEL = 'toolbarRangeSelectRange';

export class Ranges extends AbstractModuleInstance {
    @Property
    public enabled = false;

    @Property
    public buttons = new PropertiesArray(RangesButtonProperties);

    @Property
    public dropdown: AgRangesDropdown = 'auto';

    @Property
    public enableOutOfRange = false;

    @Property
    public position: AgRangesPosition = 'top-right';

    @Property
    public spacing: number = 0;

    private readonly container: HTMLElement;
    private readonly dropdownMenu = new _ModuleSupport.Menu(this.ctx, 'ranges-dropdown');
    private readonly toolbar: _ModuleSupport.BaseToolbar;

    private isDropdown = false;
    private dropdownLabel = DEFAULT_DROPDOWN_LABEL;

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        this.container = ctx.domManager.addChild('canvas-overlay', 'range-buttons');
        this.container.role = 'presentation';

        this.toolbar = new Toolbar(this.ctx, 'ariaLabelRangesToolbar', 'horizontal');
        this.toolbar.addClass('ag-charts-range-buttons');
        this.container.append(this.toolbar.getElement());

        this.cleanup.register(
            this.toolbar.addToolbarListener('button-pressed', this.onButtonPress.bind(this)),
            ctx.layoutManager.registerElement(LayoutElement.ToolbarBottom, this.onLayoutStart.bind(this)),
            ctx.eventsHub.on('layout:complete', this.onLayoutComplete.bind(this)),
            ctx.eventsHub.on('zoom:change-complete', this.onZoomChanged.bind(this)),
            this.teardown.bind(this)
        );
    }

    private teardown() {
        this.toolbar.getElement().remove();
        this.toolbar.destroy();
    }

    private onLayoutStart({ layoutBox }: _ModuleSupport.LayoutContext) {
        const { dropdown, enabled, position, spacing, toolbar } = this;

        if (!enabled) {
            toolbar.setHidden(true);
            return;
        }

        toolbar.setHidden(false);

        if (dropdown === 'always') {
            this.swapDropdownIn();
        } else {
            this.swapDropdownOut();
        }

        const { height } = toolbar.getBounds();
        const bounds = { x: layoutBox.x, y: layoutBox.y };

        if (position === 'top' || position === 'top-left' || position === 'top-right') {
            layoutBox.shrink({ top: height + spacing });
        } else {
            bounds.y = layoutBox.y + layoutBox.height - height;
            layoutBox.shrink({ bottom: height + spacing });
        }

        toolbar.setBounds(bounds);
    }

    private onLayoutComplete({ series: { rect: seriesRect }, layoutBox }: _ModuleSupport.LayoutCompleteEvent) {
        const { buttons, dropdown, dropdownMenu, enabled, position, toolbar } = this;

        if (!enabled) return;

        let bounds = toolbar.getBounds();

        if (bounds.width > seriesRect.width && dropdown === 'auto') {
            this.swapDropdownIn();
            bounds = toolbar.getBounds();
        } else if (dropdown !== 'always') {
            this.swapDropdownOut();
        }

        if (position === 'top-right' || position === 'bottom-right') {
            bounds.x = layoutBox.x + layoutBox.width - bounds.width;
        } else if (position === 'top' || position === 'bottom') {
            bounds.x = layoutBox.x + layoutBox.width / 2 - bounds.width / 2;
        }

        bounds.x = clamp(seriesRect.x, bounds.x, seriesRect.x + seriesRect.width - bounds.width);
        toolbar.setBounds({ x: bounds.x, y: bounds.y });

        const anchor = { x: bounds.x, y: bounds.y + bounds.height - 1 };
        const fallbackAnchor = { x: bounds.x + bounds.width, y: bounds.y + 2 };
        dropdownMenu.setAnchor(anchor, fallbackAnchor);

        if (!this.isDropdown) {
            let index = 0;
            for (const button of buttons) {
                toolbar.toggleButtonEnabledByIndex(index, this.getButtonEnabled(button));
                index++;
            }
        }
    }

    private onZoomChanged() {
        this.toolbar.clearActiveButton();

        if (this.isDropdown) {
            this.resetDropdownButton();
        }
    }

    private onButtonPress({ button: { index } }: _ModuleSupport.ToolbarEventMap['button-pressed']) {
        if (this.isDropdown) {
            this.showDropdownMenu();
        } else {
            this.updateZoomWithButtonIndex(index);
        }
    }

    private swapDropdownIn() {
        this.isDropdown = true;
        this.toolbar.clearButtons();
        this.toolbar.updateButtons([{ label: this.dropdownLabel, value: Infinity }]);
    }

    private swapDropdownOut() {
        this.isDropdown = false;
        this.toolbar.updateButtons(this.buttons);
        this.dropdownMenu.hide();
    }

    private resetDropdownButton() {
        this.dropdownLabel = DEFAULT_DROPDOWN_LABEL;
        this.toolbar.updateButtonByIndex(0, { label: this.dropdownLabel, value: Infinity });
    }

    private showDropdownMenu() {
        const buttonWidget = this.toolbar.getButtonWidget(0);
        if (!buttonWidget) return;

        const menuItems = this.buttons.map((button, index) => {
            return {
                ariaLabel: button.ariaLabel,
                enabled: this.getButtonEnabled(button),
                label: button.label ?? `${index}`,
                value: `${index}`,
                icon: button.icon,
            };
        });

        this.dropdownMenu.show(buttonWidget, {
            items: menuItems,
            onPress: (item) => {
                const index = Number(item.value);
                this.updateZoomWithButtonIndex(index);
                this.dropdownLabel = item.label ?? DEFAULT_DROPDOWN_LABEL;
            },
        });
    }

    private updateZoomWithButtonIndex(index: number) {
        const { zoomManager } = this.ctx;

        const button = this.buttons.at(index);
        if (!button) return;

        const { value } = button;

        const sourcing = userInteraction(`zoom-range-button-${index}`);
        const updateWithFn = this.getUpdateWithFn(value);

        if (updateWithFn == null) {
            zoomManager.resetZoom(sourcing);
        } else {
            zoomManager.updateWith(sourcing, ChartAxisDirection.X, updateWithFn);
        }

        this.toolbar.toggleActiveButtonByIndex(index);
    }

    private getUpdateWithFn(value: AgRangesButtonValue): _ModuleSupport.UpdateZoomWithFunction | undefined {
        if (value == null) return;

        if (typeof value === 'number') {
            return (_start, end) => [Number(end) - value, undefined];
        }

        if (Array.isArray(value)) {
            return () => value;
        }

        if (typeof value === 'function') {
            return value;
        }

        if (isTimeInterval(value) || isTimeIntervalUnit(value)) {
            const [, domainMax] =
                this.ctx.axisManager.getAxisContext(ChartAxisDirection.X).at(0)?.scale.getDomainMinMax() ?? [];
            if (isValidDate(domainMax)) {
                const start = intervalAgo(value, domainMax);
                return (d0, d1) => [start ?? d0, d1];
            }
        }
    }

    private getButtonEnabled(button: RangesButtonProperties) {
        const {
            enableOutOfRange,
            ctx: { zoomManager },
        } = this;

        let buttonEnabled = button.enabled ?? enableOutOfRange;

        if (button.enabled == null && enableOutOfRange === false) {
            const updateWithFn = this.getUpdateWithFn(button.value);
            buttonEnabled =
                updateWithFn == null ? true : zoomManager.isValidUpdateWith(ChartAxisDirection.X, updateWithFn);
        }

        return buttonEnabled;
    }
}
