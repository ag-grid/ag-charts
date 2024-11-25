import { type AgFinancialChartOptions, type AgPriceVolumeChartType, _ModuleSupport } from 'ag-charts-community';

const { BOOLEAN, ActionOnSet, LayoutElement, Logger, Menu, Toolbar, Validate } = _ModuleSupport;

const menuItems: _ModuleSupport.MenuItem<AgPriceVolumeChartType>[] = [
    { label: 'toolbarSeriesTypeOHLC', icon: 'ohlc-series', value: 'ohlc' },
    { label: 'toolbarSeriesTypeCandles', icon: 'candlestick-series', value: 'candlestick' },
    { label: 'toolbarSeriesTypeHollowCandles', icon: 'hollow-candlestick-series', value: 'hollow-candlestick' },
    { label: 'toolbarSeriesTypeLine', icon: 'line-series', value: 'line' },
    { label: 'toolbarSeriesTypeStepLine', icon: 'step-line-series', value: 'step-line' },
    { label: 'toolbarSeriesTypeHLC', icon: 'hlc-series', value: 'hlc' },
    { label: 'toolbarSeriesTypeHighLow', icon: 'high-low-series', value: 'high-low' },
];

export class ChartToolbar extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @Validate(BOOLEAN)
    @ActionOnSet<ChartToolbar>({
        changeValue: function (enabled) {
            this.onEnableChanged(enabled);
        },
    })
    enabled: boolean = false;

    private readonly toolbar = new Toolbar(this.ctx, this.onButtonPressed.bind(this));
    private readonly menu = new Menu(this.ctx, 'chart-toolbar');
    private readonly horizontalSpacing = 10;

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        this.toolbar.addClass('ag-charts-chart-toolbar');
        this.toolbar.orientation = 'vertical';
        ctx.domManager.addChild('canvas-overlay', 'chart-toolbar', this.toolbar.getElement());

        this.destroyFns.push(ctx.layoutManager.registerElement(LayoutElement.Toolbar, this.onLayoutStart.bind(this)));
    }

    private onEnableChanged(enabled: boolean) {
        if (!this.toolbar) return;
        this.toolbar.toggleButtonVisibilities(enabled ? [0] : []);
    }

    private onLayoutStart(event: _ModuleSupport.LayoutContext) {
        const { horizontalSpacing, toolbar } = this;
        const { layoutBox } = event;

        const chartType = this.getChartType();
        const icon = menuItems.find((item) => item.value === chartType)?.icon;

        if (icon != null) {
            this.toolbar.updateButtons([{ icon, tooltip: 'toolbarSeriesTypeDropdown' }]);
        }

        const width = toolbar.getBounds().width;
        toolbar.setBounds({
            x: layoutBox.x,
            y: layoutBox.y,
            width: width,
        });

        layoutBox.shrink({ left: width + horizontalSpacing });
    }

    private onButtonPressed(
        event: _ModuleSupport.MouseWidgetEvent<'click'>,
        _: _ModuleSupport.ToolbarButtonOptions,
        buttonBounds: _ModuleSupport.BBoxValues
    ) {
        this.menu.setAnchor({ x: buttonBounds.x + buttonBounds.width + 6, y: buttonBounds.y });
        this.menu.show({
            items: menuItems,
            menuItemRole: 'menuitemradio',
            ariaLabel: this.ctx.localeManager.t('toolbarSeriesTypeDropdown'),
            class: 'ag-charts-chart-toolbar__menu',
            value: this.getChartType(),
            sourceEvent: event.sourceEvent,
            onPress: (item) => {
                this.setChartType(item.value);
                this.hidePopover();
            },
            onHide: () => {
                this.toolbar.clearActiveButton();
            },
        });

        this.toolbar.toggleActiveButtonByIndex(0);
    }

    private hidePopover() {
        this.toolbar.clearActiveButton();
        this.menu.hide();
    }

    private setChartType(chartType: AgPriceVolumeChartType) {
        const options: AgFinancialChartOptions = { chartType };
        this.ctx.chartService.publicApi?.updateDelta(options as any).catch((e) => Logger.error(e));
    }

    private getChartType(): AgPriceVolumeChartType {
        const chartType = (this.ctx.chartService.publicApi?.getOptions() as AgFinancialChartOptions)?.chartType;
        if (chartType == null || !menuItems.some((item) => item.value === chartType)) {
            return 'candlestick';
        }
        return chartType;
    }
}
