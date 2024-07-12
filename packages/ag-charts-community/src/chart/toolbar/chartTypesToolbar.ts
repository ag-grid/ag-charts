import type { ModuleContext } from '../../module/moduleContext';
import { Logger } from '../../util/logger';
import { type ToolbarButtonPressedEvent, ToolbarManager } from '../interaction/toolbarManager';

export class ChartTypesToolbar {
    constructor(private readonly ctx: ModuleContext) {}

    private visible: boolean = false;
    private enabled: boolean = true;
    public toggle(enabled: boolean) {
        this.enabled = enabled;
        this.ctx.toolbarManager?.toggleGroup('chartTypes', 'chartTypes', Boolean(enabled));
        this.toggleButtons(enabled);
    }

    public toggleButtons(enabled: boolean, chartType = 'candlestick') {
        const { toolbarManager } = this.ctx;
        const { visible } = this;
        toolbarManager.toggleButton('chartTypes', 'candlestick', {
            enabled,
            visible,
            active: chartType === 'candlestick',
        });
        toolbarManager.toggleButton('chartTypes', 'ohlc', { enabled, visible, active: chartType === 'ohlc' });
        toolbarManager.toggleButton('chartTypes', 'hollow-candlestick', {
            enabled,
            visible,
            active: chartType === 'hollow-candlestick',
        });
        toolbarManager.toggleButton('chartTypes', 'line', { enabled, visible, active: chartType === 'line' });
        toolbarManager.toggleButton('chartTypes', 'step-line', { enabled, visible, active: chartType === 'step-line' });
        toolbarManager.toggleButton('chartTypes', 'range-area', {
            enabled,
            visible,
            active: chartType === 'range-area',
        });
    }

    public onButtonPress(event: ToolbarButtonPressedEvent) {
        if (ToolbarManager.isGroup('chartOptionsTools', event)) {
            this.visible = !this.visible;
            this.toggle(this.visible);
            return;
        }

        if (ToolbarManager.isGroup('chartTypes', event)) {
            const chartType = event.value;
            this.ctx.chartService.publicApi?.update({ chartType } as any).catch((e) => {
                Logger.warn('Unable to update chart type', e);
            });
            this.toggleButtons(this.enabled, chartType);
            return;
        }

        this.toggle(false);
    }
}
