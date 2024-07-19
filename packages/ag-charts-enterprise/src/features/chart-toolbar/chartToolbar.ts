import {
    type AgFinancialChartOptions,
    type AgIconName,
    type AgPriceVolumeChartType,
    _ModuleSupport,
    _Scene,
} from 'ag-charts-community';

import { Popover } from '../popover/popover';

const chartIcons: Record<AgPriceVolumeChartType, AgIconName | undefined> = {
    ohlc: 'ohlc',
    candlestick: 'candles',
    'hollow-candlestick': 'hollow-candles',
    line: 'line',
    'step-line': 'step-line',
    'range-area': 'area',
    hlc: undefined,
    'high-low': undefined,
};

const BUTTON_GROUP = 'seriesType';
const BUTTON_CHART_TYPE = 'type';
export class ChartToolbar extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    private readonly popover = new Popover(this.ctx);
    private anchor?: _Scene.BBox = undefined;
    private didSetInitialIcon = false;
    private isPopoverVisible = false;

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        const { toolbarManager } = ctx;

        toolbarManager.toggleGroup('chart-toolbar', BUTTON_GROUP, true);

        this.destroyFns.push(
            toolbarManager.addListener('button-moved', this.toolbarButtonMoved.bind(this)),
            toolbarManager.addListener('button-pressed', this.toolbarButtonPressed.bind(this))
        );
    }

    async processData() {
        if (this.didSetInitialIcon) return;

        const { toolbarManager } = this.ctx;
        const chartType = this.getChartType();
        toolbarManager.updateButton(BUTTON_GROUP, BUTTON_CHART_TYPE, { icon: chartIcons[chartType] });
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
        const item = (title: string, type: AgPriceVolumeChartType) => {
            const icon = chartIcons[type];
            const active = type === chartType;
            const onPress = () => {
                this.setChartType(type);
                this.ctx.toolbarManager.updateButton(BUTTON_GROUP, BUTTON_CHART_TYPE, { icon });
            };
            return { title, icon, active, onPress };
        };

        this.popover.show({
            items: [
                item('toolbarSeriesTypeOHLC', 'ohlc'),
                item('toolbarSeriesTypeCandles', 'candlestick'),
                item('toolbarSeriesTypeHollowCandles', 'hollow-candlestick'),
                item('toolbarSeriesTypeLine', 'line'),
                // @todo(AG-XXX)
                // item('toolbarSeriesTypeLineWithMarkers' 'line') },
                item('toolbarSeriesTypeStepLine', 'step-line'),
                // @todo(AG-12182)
                // item('toolbarSeriesTypeArea', 'range-area'),
            ],
            onClose: () => {
                this.hidePopover();
            },
        });

        this.isPopoverVisible = true;
        this.ctx.toolbarManager.toggleButton(BUTTON_GROUP, BUTTON_CHART_TYPE, { active: true });
    }

    private hidePopover() {
        this.ctx.toolbarManager.toggleButton(BUTTON_GROUP, BUTTON_CHART_TYPE, { active: false });
        this.popover.hide();
        this.isPopoverVisible = false;
    }

    private setChartType(chartType: AgPriceVolumeChartType) {
        const options: AgFinancialChartOptions = { chartType };
        void this.ctx.chartService.publicApi?.updateDelta(options as any);
    }

    private getChartType() {
        return (this.ctx.chartService.publicApi?.getOptions() as AgFinancialChartOptions).chartType ?? 'ohlc';
    }
}
