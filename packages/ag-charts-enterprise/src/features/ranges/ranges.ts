import {
    type AgRangesButtonValue,
    type AgRangesPosition,
    type CssColor,
    type FontFamily,
    type FontWeight,
    type Padding,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    BaseProperties,
    ChartAxisDirection,
    CleanupRegistry,
    type ModuleInstance,
    PropertiesArray,
    Property,
    clamp,
    intervalAgo,
    isTimeInterval,
    isTimeIntervalUnit,
    isValidDate,
} from 'ag-charts-core';

import {
    RangesButtonProperties,
    RangesDropdownProperties,
    RangesStateStylesProperties,
    RangesStylesProperties,
} from './rangesProperties';

const { userInteraction, LayoutElement, Toolbar } = _ModuleSupport;

const DEFAULT_DROPDOWN_LABEL = 'toolbarRangeSelectRange';

/**
 * Ranges extends BaseProperties to ensure the `padding` property can be correctly modified by jsonApply() when it
 * changes between a number and an object. So it manually implements ModuleInstance, instead of extending the
 * default AbstractModuleInstance class.
 */
export class Ranges extends BaseProperties implements ModuleInstance {
    @Property
    public enabled = false;

    @Property
    public buttons = new PropertiesArray(RangesButtonProperties);

    @Property
    public button = new RangesStylesProperties();

    @Property
    public dropdown = new RangesDropdownProperties();

    @Property
    public active = new RangesStateStylesProperties();

    @Property
    public hover = new RangesStateStylesProperties();

    @Property
    public enableOutOfRange = false;

    @Property
    public gap = 0;

    @Property
    public cornerRadius = 0;

    @Property
    public fill: CssColor = 'black';

    @Property
    public fillOpacity = 1;

    @Property
    public fontSize = 12;

    @Property
    public fontFamily: FontFamily = 'sans-serif';

    @Property
    public fontWeight: FontWeight = 'normal';

    @Property
    public stroke: CssColor = 'black';

    @Property
    public strokeWidth = 1;

    @Property
    public textColor: CssColor = 'black';

    @Property
    public padding: Padding = 0;

    @Property
    public position: AgRangesPosition = 'top-right';

    @Property
    public spacing: number = 0;

    @Property
    public minSize: number = 0;

    protected readonly cleanup = new CleanupRegistry();

    private readonly container: HTMLElement;
    private readonly dropdownMenu = new _ModuleSupport.Menu(this.ctx, 'ranges-dropdown');
    private readonly toolbar: _ModuleSupport.BaseToolbar;

    private isDropdown?: boolean;
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

    destroy() {
        this.cleanup.flush();
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

        this.updateCSSVariables();

        toolbar.setHidden(false);

        if (dropdown.visible === 'always') {
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

        if (bounds.width > seriesRect.width && dropdown.visible === 'auto') {
            this.swapDropdownIn();
            bounds = toolbar.getBounds();
        } else if (dropdown.visible !== 'always') {
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

    private updateCSSVariables() {
        if (this.gap > 0) {
            this.toolbar.getElement().classList.add('ag-charts-range-buttons--gapped');
        } else {
            this.toolbar.getElement().classList.remove('ag-charts-range-buttons--gapped');
        }

        const numericKeys = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'strokeWidth'];
        this.ctx.domManager.setModuleCSSVariables(
            'ranges',
            undefined,
            undefined,
            { gap: this.gap, minSize: this.minSize },
            ['gap', 'minSize']
        );
        this.ctx.domManager.setModuleCSSVariables(
            'ranges',
            'button',
            undefined,
            this.getComponentVariables(this.button),
            numericKeys
        );
        this.ctx.domManager.setModuleCSSVariables(
            'ranges',
            'button',
            'active',
            this.getComponentStateVariables(this.button, 'active'),
            numericKeys
        );
        this.ctx.domManager.setModuleCSSVariables(
            'ranges',
            'button',
            'hover',
            this.getComponentStateVariables(this.button, 'hover'),
            numericKeys
        );
        this.ctx.domManager.setModuleCSSVariables(
            'ranges',
            'dropdown',
            undefined,
            this.getComponentVariables(this.dropdown),
            numericKeys
        );
        this.ctx.domManager.setModuleCSSVariables(
            'ranges',
            'dropdown',
            'active',
            this.getComponentStateVariables(this.dropdown, 'active'),
            numericKeys
        );
        this.ctx.domManager.setModuleCSSVariables(
            'ranges',
            'dropdown',
            'hover',
            this.getComponentStateVariables(this.dropdown, 'hover'),
            numericKeys
        );
    }

    private getComponentVariables(component: Ranges | RangesStylesProperties) {
        return {
            cornerRadius: component.cornerRadius,
            fill: component.fill,
            fillOpacity: component.fillOpacity,
            fontSize: component.fontSize,
            fontFamily: component.fontFamily,
            fontWeight: component.fontWeight,
            stroke: component.stroke,
            strokeWidth: component.strokeWidth,
            textColor: component.textColor,
            paddingTop: typeof component.padding === 'number' ? component.padding : component.padding.top ?? 0,
            paddingRight: typeof component.padding === 'number' ? component.padding : component.padding.right ?? 0,
            paddingBottom: typeof component.padding === 'number' ? component.padding : component.padding.bottom ?? 0,
            paddingLeft: typeof component.padding === 'number' ? component.padding : component.padding.left ?? 0,
        };
    }

    private getComponentStateVariables(component: RangesStylesProperties, state: 'active' | 'hover') {
        return {
            fill: component[state].fill,
            fillOpacity: component[state].fillOpacity,
            stroke: component[state].stroke,
            strokeWidth: component[state].strokeWidth,
            textColor: component[state].textColor,
        };
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
        if (this.isDropdown) return;

        this.isDropdown = true;
        this.toolbar.getElement().classList.add('ag-charts-range-buttons--dropdown');
        this.toolbar.clearButtons();
        this.toolbar.updateButtons([
            { label: this.dropdownLabel, value: Infinity, icon: 'chevron-filled-down', iconPosition: 'after' },
        ]);
    }

    private swapDropdownOut() {
        if (this.isDropdown === false) return;

        this.isDropdown = false;
        this.toolbar.getElement().classList.remove('ag-charts-range-buttons--dropdown');
        this.toolbar.updateButtons(this.buttons);
        this.toolbar.clearActiveButton();
        this.dropdownMenu.hide();
    }

    private resetDropdownButton() {
        this.dropdownLabel = DEFAULT_DROPDOWN_LABEL;
        this.toolbar.updateButtonByIndex(0, { label: this.dropdownLabel, value: Infinity });
    }

    private showDropdownMenu() {
        const buttonWidget = this.toolbar.getButtonWidget(0);
        if (!buttonWidget) return;

        this.toolbar.toggleActiveButtonByIndex(0);

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
            onHide: () => {
                this.toolbar.clearActiveButton();
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

        if (updateWithFn.valid === false || updateWithFn.fn == null) {
            zoomManager.resetZoom(sourcing);
        } else {
            zoomManager.updateWith(sourcing, ChartAxisDirection.X, updateWithFn.fn);
        }

        this.toolbar.toggleActiveButtonByIndex(index);
    }

    private getUpdateWithFn(value: AgRangesButtonValue): {
        fn?: _ModuleSupport.UpdateZoomWithFunction;
        valid: boolean;
    } {
        if (value == null) return { valid: true };

        if (typeof value === 'number') {
            return { fn: (_start, end) => [Number(end) - value, undefined], valid: true };
        }

        if (Array.isArray(value)) {
            return { fn: () => value, valid: true };
        }

        if (typeof value === 'function') {
            return { fn: value, valid: true };
        }

        if (isTimeInterval(value) || isTimeIntervalUnit(value)) {
            const [, domainMax] =
                this.ctx.axisManager.getAxisContext(ChartAxisDirection.X).at(0)?.scale.getDomainMinMax() ?? [];

            if (isValidDate(domainMax)) {
                const start = intervalAgo(value, domainMax);
                return { fn: (d0) => [start ?? d0, undefined], valid: true };
            }

            return { valid: false };
        }

        return { valid: true };
    }

    private getButtonEnabled(button: RangesButtonProperties) {
        const {
            enableOutOfRange,
            ctx: { zoomManager },
        } = this;

        let buttonEnabled = button.enabled ?? enableOutOfRange;

        if (button.enabled == null && enableOutOfRange === false) {
            const updateWithFn = this.getUpdateWithFn(button.value);
            if (updateWithFn.valid === false) return false;

            buttonEnabled =
                updateWithFn.fn == null ? true : zoomManager.isValidUpdateWith(ChartAxisDirection.X, updateWithFn.fn);
        }

        return buttonEnabled;
    }
}
