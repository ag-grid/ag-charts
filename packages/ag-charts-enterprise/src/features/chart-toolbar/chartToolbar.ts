import {
    type AgFinancialChartOptions,
    type AgIconName,
    type AgPriceVolumeChartType,
    _ModuleSupport,
    _Scene,
} from 'ag-charts-community';

import { Popover } from '../popover/popover';

const itemConfigurations: Record<AgPriceVolumeChartType, { label: string; icon: AgIconName | undefined }> = {
    ohlc: { label: 'toolbarSeriesTypeOHLC', icon: 'ohlc-series' },
    candlestick: { label: 'toolbarSeriesTypeCandles', icon: 'candlestick-series' },
    'hollow-candlestick': { label: 'toolbarSeriesTypeHollowCandles', icon: 'hollow-candlestick-series' },
    line: { label: 'toolbarSeriesTypeLine', icon: 'line-series' },
    'step-line': { label: 'toolbarSeriesTypeStepLine', icon: 'step-line-series' },
    'range-area': { label: '', icon: undefined },
    hlc: { label: 'toolbarSeriesTypeHLC', icon: 'hlc-series' },
    'high-low': { label: 'toolbarSeriesTypeHighLow', icon: 'high-low-series' },
};

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

    private readonly popover = new Popover(this.ctx);
    private anchor?: _Scene.BBox = undefined;
    private didSetInitialIcon = false;
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
        if (this.didSetInitialIcon) return;

        const { toolbarManager } = this.ctx;
        const chartType = this.getChartType();
        const icon = itemConfigurations[chartType]?.icon;
        if (icon != null) {
            toolbarManager.updateButton(BUTTON_GROUP, BUTTON_VALUE, { icon });
        }
        this.didSetInitialIcon = true;
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

        const chartType = this.getChartType();
        const item = (type: AgPriceVolumeChartType) => {
            const { label, icon } = itemConfigurations[type]!;
            const active = type === chartType;
            const onPress = () => {
                this.setChartType(type);
                this.ctx.toolbarManager.updateButton(BUTTON_GROUP, BUTTON_VALUE, { icon });
            };
            return { label, icon, active, onPress };
        };

        this.popover.show({
            items: [
                item('ohlc'),
                item('candlestick'),
                item('hollow-candlestick'),
                item('line'),
                item('step-line'),
                item('hlc'),
                item('high-low'),
            ],
            onClose: () => {
                this.hidePopover();
            },
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
        return (this.ctx.chartService.publicApi?.getOptions() as AgFinancialChartOptions)?.chartType ?? 'candlestick';
    }
}
