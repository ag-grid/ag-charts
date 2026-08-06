import {
    type AgRangesButton,
    type AgRangesButtonValue,
    type AgRangesStateStyles,
    type AgRangesStyles,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    AbstractModuleInstance,
    type BoxBounds,
    ChartAxisDirection,
    Color,
    type DynamicContext,
    clamp,
    intervalAgo,
    isTimeInterval,
    isTimeIntervalUnit,
    isValidDate,
} from 'ag-charts-core';
import type { CssColor } from 'ag-charts-types';

const { userInteraction, LayoutElement, Toolbar } = _ModuleSupport;

const DEFAULT_DROPDOWN_LABEL = 'toolbarRangeSelectRange';

type ResolvedStyles = AgRangesStyles & {
    cornerRadius: number;
    fill: string;
    fillOpacity: number;
    fontSize: number;
    fontFamily: string;
    fontWeight: string | number;
    stroke: string;
    strokeWidth: number;
    textColor: string;
    padding: number | { top?: number; right?: number; bottom?: number; left?: number };
    active: Required<AgRangesStateStyles>;
    disabled: Required<AgRangesStateStyles>;
    hover: Required<AgRangesStateStyles>;
};

const EMPTY_STATE_STYLES: Required<AgRangesStateStyles> = {
    fill: 'black',
    fillOpacity: 1,
    stroke: 'black',
    textColor: 'black',
};

const EMPTY_STYLES: ResolvedStyles = {
    cornerRadius: 0,
    fill: 'black',
    fillOpacity: 1,
    fontSize: 12,
    fontFamily: 'sans-serif',
    fontWeight: 'normal',
    stroke: 'black',
    strokeWidth: 1,
    textColor: 'black',
    padding: 0,
    active: { ...EMPTY_STATE_STYLES },
    disabled: { ...EMPTY_STATE_STYLES },
    hover: { ...EMPTY_STATE_STYLES },
};

function resolveStyles(styles: AgRangesStyles | undefined): ResolvedStyles {
    return { ...EMPTY_STYLES, ...styles } as ResolvedStyles;
}

export class Ranges extends AbstractModuleInstance {
    private container?: HTMLElement;
    private dropdownMenu?: _ModuleSupport.Menu;
    private buttonsToolbar?: _ModuleSupport.BaseToolbar;
    private dropdownToolbar?: _ModuleSupport.BaseToolbar;

    private isDropdown?: boolean;
    private dropdownLabel = DEFAULT_DROPDOWN_LABEL;
    private dropdownMinWidth?: number;

    // OPTIMIZATION: `getBounds()` has no inline height, so it forces a sync reflow every layout.
    // The height depends on the resolved options, the shown toolbar, text metrics, and the theme
    // CSS variables the button styles read — the first two form the key below, the rest are
    // covered by the resets registered in the constructor.
    private cachedToolbarHeight?: number;
    private cachedToolbarHeightOpts?: _ModuleSupport.NormalisedRangesOptions;
    private cachedToolbarHeightIsDropdown?: boolean;
    private cachedToolbarHeightLabel?: string;

    // Ranges is only created when the `ranges` subtree is configured, so assert
    // presence here and rely on rangesTheme for field-level defaults.
    private get opts(): _ModuleSupport.NormalisedRangesOptions {
        return this.ctx.chartState.getValue('options', 'ranges')!;
    }

    constructor(private readonly ctx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super();

        this.cleanup.register(
            ctx.layoutManager.registerElement(LayoutElement.ToolbarBottom, this.onLayoutStart.bind(this)),
            ctx.eventsHub.on('layout:complete', this.onLayoutComplete.bind(this)),
            ctx.widgets.chartWidget.addListener('click', this.onChartWidgetClick.bind(this)),
            ctx.eventsHub.on('zoom:change-complete', this.onZoomChanged.bind(this)),
            ctx.eventsHub.on('font:load', () => this.invalidateToolbarHeightCache()),
            ctx.eventsHub.on('theme:params-change', () => this.invalidateToolbarHeightCache()),
            ctx.chartState.observe((get) => {
                const enabled = get('options', 'ranges.enabled') ?? false;
                // Reset `isDropdown` state when the ranges module is disabled, to ensure the buttons are
                // correctly re-shown if the module is re-enabled.
                if (!enabled) this.isDropdown = undefined;
            }),
            this.teardown.bind(this)
        );
    }

    private setup() {
        if (this.container != null) return;

        this.container = this.ctx.domManager.addChild('canvas-overlay', 'range-buttons');
        this.container.role = 'presentation';

        this.buttonsToolbar = new Toolbar(this.ctx, 'ariaLabelRangesToolbar', 'horizontal');
        this.buttonsToolbar.addClass('ag-charts-range-buttons', 'ag-charts-range-buttons--buttons');
        this.container.append(this.buttonsToolbar.getElement());

        this.dropdownToolbar = new Toolbar(this.ctx, 'ariaLabelRangesToolbar', 'horizontal');
        this.dropdownToolbar.addClass('ag-charts-range-buttons', 'ag-charts-range-buttons--dropdown');
        this.container.append(this.dropdownToolbar.getElement());

        this.dropdownMenu = new _ModuleSupport.Menu(this.ctx, 'ranges-dropdown');

        this.cleanup.register(
            this.buttonsToolbar.addToolbarListener('button-pressed', this.onButtonPress.bind(this)),
            this.dropdownToolbar.addToolbarListener('button-pressed', this.onButtonPress.bind(this))
        );
    }

    private teardown() {
        this.buttonsToolbar?.getElement().remove();
        this.buttonsToolbar?.destroy();

        this.dropdownToolbar?.getElement().remove();
        this.dropdownToolbar?.destroy();
    }

    private onLayoutStart({ layoutBox }: _ModuleSupport.LayoutContext) {
        const opts = this.opts;
        const { enabled, position, spacing } = opts;
        const dropdownVisible = opts.dropdown.visible;

        if (!enabled) {
            this.buttonsToolbar?.setHidden(true);
            this.dropdownToolbar?.setHidden(true);
            return;
        }

        this.setup();

        const { buttonsToolbar, dropdownToolbar } = this;
        if (!buttonsToolbar || !dropdownToolbar) return;

        buttonsToolbar.updateButtons(opts.buttons);
        dropdownToolbar.updateButtons([this.getDropdownButtonOptions(this.dropdownLabel)]);

        this.updateCSSVariables();

        if (dropdownVisible === 'always') {
            this.swapDropdownIn();
        } else {
            this.swapDropdownOut();
        }

        const height = this.getToolbarHeight(opts, this.isDropdown ? dropdownToolbar : buttonsToolbar);
        const bounds = { x: layoutBox.x, y: layoutBox.y };

        if (position === 'top' || position === 'top-left' || position === 'top-right') {
            layoutBox.shrink({ top: height + spacing });
        } else {
            bounds.y = layoutBox.y + layoutBox.height - height;
            layoutBox.shrink({ bottom: height + spacing });
        }

        buttonsToolbar.setBounds(bounds);
        dropdownToolbar.setBounds(bounds);
    }

    private invalidateToolbarHeightCache() {
        this.cachedToolbarHeight = undefined;
    }

    private getToolbarHeight(
        opts: _ModuleSupport.NormalisedRangesOptions,
        toolbar: _ModuleSupport.BaseToolbar
    ): number {
        if (
            this.cachedToolbarHeight !== undefined &&
            this.cachedToolbarHeightOpts === opts &&
            this.cachedToolbarHeightIsDropdown === this.isDropdown &&
            this.cachedToolbarHeightLabel === this.dropdownLabel
        ) {
            return this.cachedToolbarHeight;
        }

        const { height } = toolbar.getBounds();
        // A zero height means the toolbar isn't laid out yet; don't pin the cache to it.
        if (height === 0) return height;

        this.cachedToolbarHeight = height;
        this.cachedToolbarHeightOpts = opts;
        this.cachedToolbarHeightIsDropdown = this.isDropdown;
        this.cachedToolbarHeightLabel = this.dropdownLabel;
        return height;
    }

    private onLayoutComplete({ series: { rect: seriesRect }, layoutBox }: _ModuleSupport.LayoutCompleteEvent) {
        const { buttonsToolbar, ctx, dropdownMenu, dropdownToolbar } = this;
        const opts = this.opts;
        if (!opts.enabled || !buttonsToolbar || !dropdownToolbar || !dropdownMenu) return;

        const dropdownVisible = opts.dropdown.visible;
        const buttons = opts.buttons;

        let bounds: BoxBounds | undefined;

        if (dropdownVisible === 'auto') {
            bounds = buttonsToolbar.getBounds();
            if (bounds.width > seriesRect.width) {
                this.swapDropdownIn();
            } else {
                this.swapDropdownOut();
            }
        }

        if (this.isDropdown) {
            // Ensure the dropdown toolbar has a minimum width of the initial state.
            bounds = dropdownToolbar.getBounds();
            this.dropdownMinWidth ??= bounds.width;
            bounds.width = Math.max(bounds.width, this.dropdownMinWidth);

            bounds = this.updateToolbarBounds(dropdownToolbar, seriesRect, layoutBox, bounds);
        } else {
            bounds = this.updateToolbarBounds(buttonsToolbar, seriesRect, layoutBox, bounds);

            let index = 0;
            for (const button of buttons) {
                buttonsToolbar.toggleButtonEnabledByIndex(index, this.getButtonEnabled(button));
                index++;
            }
        }

        const anchor = {
            x: ctx.domManager.isRtl ? bounds.x + bounds.width : bounds.x,
            y: bounds.y + bounds.height + 1,
        };
        const fallbackAnchor = { x: bounds.x + bounds.width, y: bounds.y - 1 };
        dropdownMenu.setAnchor(anchor, fallbackAnchor);
    }

    private onChartWidgetClick() {
        this.dropdownMenu?.hide();
    }

    private updateToolbarBounds(
        toolbar: _ModuleSupport.BaseToolbar,
        seriesRect: _ModuleSupport.BBox,
        layoutBox: Readonly<_ModuleSupport.BBox>,
        cachedBounds?: BoxBounds
    ) {
        const position = this.opts.position;
        const bounds = cachedBounds ?? toolbar.getBounds();

        if (position === 'top-right' || position === 'bottom-right') {
            bounds.x = layoutBox.x + layoutBox.width - bounds.width;
        } else if (position === 'top' || position === 'bottom') {
            bounds.x = layoutBox.x + layoutBox.width / 2 - bounds.width / 2;
        }

        bounds.x = clamp(seriesRect.x, bounds.x, seriesRect.x + seriesRect.width - bounds.width);
        toolbar.setBounds({ x: bounds.x, y: bounds.y, width: bounds.width });

        return bounds;
    }

    private updateCSSVariables() {
        const opts = this.opts;
        const gap = opts.gap;
        if (gap > 0) {
            this.buttonsToolbar?.addClass('ag-charts-range-buttons--gapped');
        } else {
            this.buttonsToolbar?.removeClass('ag-charts-range-buttons--gapped');
        }

        const numericKeys = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'strokeWidth'];
        const button = resolveStyles(opts.button);
        const dropdown = resolveStyles(opts.dropdown);
        // `minSize` is undocumented but emitted by rangesTheme/priceVolumePreset (theme: 0, preset: 34).
        const minSize = (opts as { minSize?: number }).minSize ?? 0;
        this.ctx.domManager.setModuleCSSVariables('ranges', undefined, undefined, { gap, minSize }, ['gap', 'minSize']);
        this.ctx.domManager.setModuleCSSVariables(
            'ranges',
            'button',
            undefined,
            this.getComponentVariables(button),
            numericKeys
        );
        this.ctx.domManager.setModuleCSSVariables(
            'ranges',
            'button',
            'active',
            this.getComponentStateVariables(button, 'active'),
            numericKeys
        );
        this.ctx.domManager.setModuleCSSVariables(
            'ranges',
            'button',
            'disabled',
            this.getComponentStateVariables(button, 'disabled'),
            numericKeys
        );
        this.ctx.domManager.setModuleCSSVariables(
            'ranges',
            'button',
            'hover',
            this.getComponentStateVariables(button, 'hover'),
            numericKeys
        );
        this.ctx.domManager.setModuleCSSVariables(
            'ranges',
            'dropdown',
            undefined,
            this.getComponentVariables(dropdown),
            numericKeys
        );
        this.ctx.domManager.setModuleCSSVariables(
            'ranges',
            'dropdown',
            'active',
            this.getComponentStateVariables(dropdown, 'active'),
            numericKeys
        );
        this.ctx.domManager.setModuleCSSVariables(
            'ranges',
            'dropdown',
            'disabled',
            this.getComponentStateVariables(dropdown, 'disabled'),
            numericKeys
        );
        this.ctx.domManager.setModuleCSSVariables(
            'ranges',
            'dropdown',
            'hover',
            this.getComponentStateVariables(dropdown, 'hover'),
            numericKeys
        );
    }

    private getComponentVariables(component: ResolvedStyles) {
        const padding = component.padding;
        const padToObj =
            typeof padding === 'number'
                ? { top: padding, right: padding, bottom: padding, left: padding }
                : {
                      top: padding.top ?? 0,
                      right: padding.right ?? 0,
                      bottom: padding.bottom ?? 0,
                      left: padding.left ?? 0,
                  };
        return {
            cornerRadius: component.cornerRadius,
            fill: this.getComponentFill(component.fill, component.fillOpacity),
            fontSize: component.fontSize,
            fontFamily: component.fontFamily,
            fontWeight: component.fontWeight,
            stroke: component.stroke,
            strokeWidth: component.strokeWidth,
            textColor: component.textColor,
            paddingTop: padToObj.top,
            paddingRight: padToObj.right,
            paddingBottom: padToObj.bottom,
            paddingLeft: padToObj.left,
        };
    }

    private getComponentStateVariables(component: ResolvedStyles, state: 'active' | 'disabled' | 'hover') {
        const stateStyles = component[state];
        return {
            fill: this.getComponentFill(stateStyles.fill, stateStyles.fillOpacity),
            fillOpacity: stateStyles.fillOpacity,
            // Colour refs are resolved during theme-merge, so this is a concrete CSS colour by render.
            stroke: stateStyles.stroke as CssColor,
            textColor: stateStyles.textColor,
        };
    }

    private getComponentFill(fill: string, fillOpacity: number) {
        if (fillOpacity >= 1) return fill;
        const fillColor = Color.fromString(fill);
        const fillOpacityColor = new Color(fillColor.r, fillColor.g, fillColor.b, fillOpacity);
        return fillOpacityColor.toString();
    }

    private onZoomChanged() {
        this.buttonsToolbar?.clearActiveButton();

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

        this.buttonsToolbar?.setHidden(true);
        this.dropdownToolbar?.setHidden(false);
    }

    private swapDropdownOut() {
        if (this.isDropdown === false) return;
        this.isDropdown = false;

        this.buttonsToolbar?.setHidden(false);
        this.dropdownToolbar?.setHidden(true);
        this.buttonsToolbar?.clearActiveButton();
        this.dropdownMenu?.hide();
    }

    private resetDropdownButton() {
        this.dropdownToolbar?.updateButtonByIndex(0, this.getDropdownButtonOptions(DEFAULT_DROPDOWN_LABEL));
    }

    private getDropdownButtonOptions(label: string) {
        this.dropdownLabel = label;
        return { label, value: Infinity, icon: 'chevron-filled-down', iconPosition: 'after' } as const;
    }

    private showDropdownMenu() {
        const buttonWidget = this.dropdownToolbar?.getButtonWidget(0);
        if (!this.dropdownToolbar || !this.dropdownMenu || !buttonWidget) return;

        this.dropdownToolbar.toggleActiveButtonByIndex(0);

        const menuItems = this.opts.buttons.map((button, index) => {
            return {
                ariaLabel: button.ariaLabel,
                enabled: this.getButtonEnabled(button),
                label: button.label ?? `${index}`,
                value: `${index}`,
                icon: button.icon,
            };
        });

        this.dropdownMenu.show(buttonWidget, {
            class: 'ag-charts-range-buttons-menu',
            items: menuItems,
            minWidth: this.dropdownMinWidth,
            onPress: (item) => {
                const index = Number(item.value);
                this.updateZoomWithButtonIndex(index);
                this.dropdownToolbar?.updateButtonByIndex(
                    0,
                    this.getDropdownButtonOptions(item.label ?? DEFAULT_DROPDOWN_LABEL)
                );
            },
            onHide: () => {
                this.dropdownToolbar?.clearActiveButton();
            },
        });
    }

    private updateZoomWithButtonIndex(index: number) {
        const zoomManager = this.ctx.zoomManager;
        if (!zoomManager) return;

        const button = this.opts.buttons.at(index);
        if (!button) return;

        const { value } = button;

        const sourcing = userInteraction(`zoom-range-button-${index}`);
        const updateWithFn = this.getUpdateWithFn(value);

        if (updateWithFn.valid === false || updateWithFn.fn == null) {
            zoomManager.resetZoom(sourcing);
        } else {
            zoomManager.updateWith(sourcing, ChartAxisDirection.X, updateWithFn.fn);
        }

        this.buttonsToolbar?.toggleActiveButtonByIndex(index);
    }

    private getUpdateWithFn(value: AgRangesButtonValue): {
        fn?: _ModuleSupport.UpdateZoomWithFunction;
        valid: boolean;
    } {
        if (value == null) return { valid: true };

        if (typeof value === 'number') {
            return { fn: ({ end }) => [Number(end) - value, undefined], valid: true };
        }

        if (Array.isArray(value)) {
            return { fn: () => value, valid: true };
        }

        if (typeof value === 'function') {
            const context = this.ctx.chartState.getValue('options', 'context');
            return { fn: (params) => value({ ...params, context }), valid: true };
        }

        if (isTimeInterval(value) || isTimeIntervalUnit(value)) {
            const [, domainMax] =
                this.ctx.axisManager.getAxisContext(ChartAxisDirection.X).at(0)?.scale.getDomainMinMax() ?? [];

            if (isValidDate(domainMax)) {
                const start = intervalAgo(value, domainMax);
                return { fn: ({ start: domainStart }) => [start ?? domainStart, undefined], valid: true };
            }

            return { valid: false };
        }

        return { valid: true };
    }

    private getButtonEnabled(button: AgRangesButton) {
        const enableOutOfRange = this.opts.enableOutOfRange;
        const zoomManager = this.ctx.zoomManager;

        let buttonEnabled = button.enabled ?? enableOutOfRange;

        if (button.enabled == null && enableOutOfRange === false) {
            const updateWithFn = this.getUpdateWithFn(button.value);
            if (updateWithFn.valid === false) return false;

            buttonEnabled =
                updateWithFn.fn == null || zoomManager == null
                    ? true
                    : zoomManager.isValidUpdateWith(ChartAxisDirection.X, updateWithFn.fn, 'range-check');
        }

        return buttonEnabled;
    }
}
