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
    'range-area': { label: 'toolbarSeriesTypeArea', icon: 'area-series' },
    hlc: { label: '', icon: undefined },
    'high-low': { label: '', icon: undefined },
};

const BUTTON_GROUP = 'seriesType';
const BUTTON_VALUE = 'type';

export class ChartToolbar extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    private readonly popover = new Popover(this.ctx);
    private anchor?: _Scene.BBox = undefined;
    private didSetInitialIcon = false;
    private isPopoverVisible = false;

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        const { toolbarManager } = ctx;

        toolbarManager.toggleGroup('chart-toolbar', BUTTON_GROUP, { visible: true });

        this.destroyFns.push(
            toolbarManager.addListener('button-moved', this.toolbarButtonMoved.bind(this)),
            toolbarManager.addListener('button-pressed', this.toolbarButtonPressed.bind(this))
        );
    }

    async processData() {
        if (this.didSetInitialIcon) return;

        const { chartService, toolbarManager } = this.ctx;
        const chartType = (chartService.publicApi?.getOptions() as AgFinancialChartOptions).chartType ?? 'ohlc';
        const { icon } = itemConfigurations[chartType];
        toolbarManager.updateButton(BUTTON_GROUP, BUTTON_VALUE, { icon });
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
            this.popover.hide();
            this.isPopoverVisible = false;
            return;
        }

        this.setAnchor(e.rect);

        const item = (type: AgPriceVolumeChartType) => {
            const { label, icon } = itemConfigurations[type];
            const onPress = () => {
                this.setChartType(type);
                this.ctx.toolbarManager.updateButton(BUTTON_GROUP, BUTTON_VALUE, { icon });
            };
            return { label, icon, onPress };
        };

        this.popover.show({
            items: [
                item('ohlc'),
                item('candlestick'),
                item('hollow-candlestick'),
                item('line'),
                // @todo(AG-XXX)
                // item('line') },
                item('step-line'),
                // @todo(AG-12182)
                // item('range-area'),
            ],
            onClose: () => {
                this.popover.hide();
                this.isPopoverVisible = false;
            },
        });

        this.isPopoverVisible = true;
    }

    private setChartType(chartType: AgPriceVolumeChartType) {
        const options: AgFinancialChartOptions = { chartType };
        void this.ctx.chartService.publicApi?.updateDelta(options as any);
    }
}
