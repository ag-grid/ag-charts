import { type AgFinancialChartOptions, type AgPriceVolumeChartType, _ModuleSupport } from 'ag-charts-community';
import { Logger } from 'ag-charts-core';

import type { SharedToolbar, SharedToolbarWithSection } from '../shared-toolbar/sharedToolbar';

const { ActionOnSet, LayoutElement, Menu, Property } = _ModuleSupport;

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
    @Property
    @ActionOnSet<ChartToolbar>({
        changeValue(enabled) {
            this.toolbar?.setHidden(!enabled);
        },
    })
    enabled: boolean = false;

    private readonly toolbar: SharedToolbarWithSection;
    private readonly menu = new Menu(this.ctx, 'chart-toolbar');

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        this.toolbar = ((ctx as any).sharedToolbar as SharedToolbar).getSharedToolbar('chartToolbar');

        this.destroyFns.push(
            this.toolbar.addToolbarListener('button-pressed', this.onButtonPressed.bind(this)),
            ctx.layoutManager.registerElement(LayoutElement.ToolbarLeft, this.onLayoutStart.bind(this)),
            () => this.toolbar.destroy()
        );
    }

    private onLayoutStart(event: _ModuleSupport.LayoutContext) {
        if (!this.enabled) return;
        this.updateButton();
        this.toolbar.layout(event.layoutBox);
    }

    private onButtonPressed({ event, buttonBounds }: _ModuleSupport.ToolbarEventMap['button-pressed']) {
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

    private updateButton() {
        const chartType = this.getChartType();
        const icon = menuItems.find((item) => item.value === chartType)?.icon;

        if (icon != null) {
            this.toolbar.updateButtons([{ icon, tooltip: 'toolbarSeriesTypeDropdown' }]);
        }
    }

    private hidePopover() {
        this.toolbar.clearActiveButton();
        this.menu.hide();
    }

    private setChartType(chartType: AgPriceVolumeChartType) {
        const options: AgFinancialChartOptions<never> = { chartType };
        this.ctx.chartService.publicApi?.updateDelta(options as any).catch((e) => Logger.error(e));
    }

    private getChartType(): AgPriceVolumeChartType {
        const chartType = (this.ctx.chartService.publicApi?.getOptions() as AgFinancialChartOptions<never>)?.chartType;
        if (chartType == null || !menuItems.some((item) => item.value === chartType)) {
            return 'candlestick';
        }
        return chartType;
    }
}
