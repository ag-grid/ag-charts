import { type AgFinancialChartOptions, type AgPriceVolumeChartType, _ModuleSupport, _Scene } from 'ag-charts-community';

import { type MenuItem, Popover } from '../popover/popover';

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
    @_ModuleSupport.Validate(_ModuleSupport.BOOLEAN)
    @_ModuleSupport.ActionOnSet<ChartToolbar>({
        changeValue: function (enabled) {
            this.enableChanged(enabled);
        },
    })
    enabled: boolean = false;

    private readonly popover = new Popover(this.ctx, 'chart-toolbar');
    private anchor?: _Scene.BBox = undefined;
    private isPopoverVisible = false;

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        const { toolbarManager } = ctx;
        this.destroyFns.push(
            toolbarManager.addListener('button-moved', this.toolbarButtonMoved.bind(this)),
            toolbarManager.addListener('button-pressed', this.toolbarButtonPressed.bind(this))
        );
    }

    private enableChanged(enabled: boolean) {
        this.ctx.toolbarManager.toggleGroup('chart-toolbar', BUTTON_GROUP, { visible: enabled });
    }

    async processData() {
        if (!this.enabled) return;

        const { toolbarManager } = this.ctx;
        const chartType = this.getChartType();
        const icon = menuItems.find((item) => item.value === chartType)?.icon;
        if (icon != null) {
            toolbarManager.updateButton(BUTTON_GROUP, BUTTON_VALUE, { icon });
        }
    }

    private setAnchor(anchor: _Scene.BBox) {
        this.anchor = anchor;
        const position = { x: this.anchor.x + this.anchor.width + 6, y: this.anchor.y };
        this.popover.setAnchor(position);
    }

    private toolbarButtonMoved(e: _ModuleSupport.ToolbarButtonMovedEvent<any>) {
        if (e.group !== BUTTON_GROUP) return;
        this.setAnchor(e.rect);
    }

    private toolbarButtonPressed(e: _ModuleSupport.ToolbarButtonPressedEvent<any>) {
        if (e.group !== BUTTON_GROUP) return;

        if (this.isPopoverVisible) {
            this.hidePopover();
            return;
        }

        this.setAnchor(e.rect);

        this.popover.show({
            items: menuItems,
            value: this.getChartType(),
            onPress: (item) => this.setChartType(item.value),
            onClose: () => this.hidePopover(),
        });

        this.isPopoverVisible = true;
        this.ctx.toolbarManager.toggleButton(BUTTON_GROUP, BUTTON_VALUE, { active: true });
    }

    private hidePopover() {
        this.ctx.toolbarManager.toggleButton(BUTTON_GROUP, BUTTON_VALUE, { active: false });
        this.popover.hide();
        this.isPopoverVisible = false;
    }

    private setChartType(chartType: AgPriceVolumeChartType) {
        const options: AgFinancialChartOptions = { chartType };
        void this.ctx.chartService.publicApi?.updateDelta(options as any);
    }

    private getChartType(): AgPriceVolumeChartType {
        let chartType = (this.ctx.chartService.publicApi?.getOptions() as AgFinancialChartOptions)?.chartType;
        if (chartType == null || !menuItems.some((item) => item.value === chartType)) {
            chartType = 'candlestick';
        }
        return chartType;
    }
}
