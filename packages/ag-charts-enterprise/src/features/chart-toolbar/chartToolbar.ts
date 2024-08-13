import { type AgFinancialChartOptions, type AgPriceVolumeChartType, _ModuleSupport, _Scene } from 'ag-charts-community';

import { type MenuItem, Popover } from '../popover/popover';

const { ActionOnSet, Validate, BOOLEAN } = _ModuleSupport;

const menuItems: MenuItem<AgPriceVolumeChartType>[] = [
    { label: 'toolbarSeriesTypeOHLC', icon: 'ohlc-series', value: 'ohlc' },
    { label: 'toolbarSeriesTypeCandles', icon: 'candlestick-series', value: 'candlestick' },
    { label: 'toolbarSeriesTypeHollowCandles', icon: 'hollow-candlestick-series', value: 'hollow-candlestick' },
    { label: 'toolbarSeriesTypeLine', icon: 'line-series', value: 'line' },
    { label: 'toolbarSeriesTypeStepLine', icon: 'step-line-series', value: 'step-line' },
    { label: 'toolbarSeriesTypeHLC', icon: 'hlc-series', value: 'hlc' },
    { label: 'toolbarSeriesTypeHighLow', icon: 'high-low-series', value: 'high-low' },
];

const BUTTON_GROUP = 'seriesType';
const BUTTON_VALUE = 'type';

export class ChartToolbar extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @Validate(BOOLEAN)
    @ActionOnSet<ChartToolbar>({
        changeValue: function (enabled) {
            this.onEnableChanged(enabled);
        },
    })
    enabled: boolean = false;

    private readonly popover = new Popover(this.ctx, 'chart-toolbar');

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        this.destroyFns.push(
            ctx.toolbarManager.addListener('button-moved', this.toolbarButtonMoved.bind(this)),
            ctx.toolbarManager.addListener('button-pressed', this.toolbarButtonPressed.bind(this))
        );
    }

    private onEnableChanged(enabled: boolean) {
        this.ctx.toolbarManager.toggleGroup('chart-toolbar', BUTTON_GROUP, { visible: enabled });
    }

    processData() {
        if (!this.enabled) return;

        const chartType = this.getChartType();
        const icon = menuItems.find((item) => item.value === chartType)?.icon;
        if (icon != null) {
            this.ctx.toolbarManager.updateButton(BUTTON_GROUP, BUTTON_VALUE, { icon });
        }
    }

    private setAnchor(anchor: _Scene.BBox) {
        this.popover.setAnchor({ x: anchor.x + anchor.width + 6, y: anchor.y });
    }

    private toolbarButtonMoved(e: _ModuleSupport.ToolbarButtonMovedEvent<any>) {
        if (e.group !== BUTTON_GROUP) return;
        this.setAnchor(e.rect);
    }

    private toolbarButtonPressed(e: _ModuleSupport.ToolbarButtonPressedEvent<any>) {
        if (e.group !== BUTTON_GROUP) return;

        this.setAnchor(e.rect);

        this.popover.show({
            items: menuItems,
            ariaLabel: this.ctx.localeManager.t('toolbarSeriesTypeDropdown'),
            value: this.getChartType(),
            sourceEvent: e.sourceEvent,
            onPress: (item) => this.setChartType(item.value),
            onClose: () => this.hidePopover(),
        });

        this.ctx.toolbarManager.toggleButton(BUTTON_GROUP, BUTTON_VALUE, { active: true });
    }

    private hidePopover() {
        this.ctx.toolbarManager.toggleButton(BUTTON_GROUP, BUTTON_VALUE, { active: false });
        this.popover.hide();
    }

    private setChartType(chartType: AgPriceVolumeChartType) {
        const options: AgFinancialChartOptions = { chartType };
        void this.ctx.chartService.publicApi?.updateDelta(options as any);
    }

    private getChartType(): AgPriceVolumeChartType {
        const chartType = (this.ctx.chartService.publicApi?.getOptions() as AgFinancialChartOptions)?.chartType;
        if (chartType == null || !menuItems.some((item) => item.value === chartType)) {
            return 'candlestick';
        }
        return chartType;
    }
}
