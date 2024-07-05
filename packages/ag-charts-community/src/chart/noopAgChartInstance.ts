import type { AgChartInstance, AgChartOptions, AgChartState } from 'ag-charts-types';

export class NoopAgChartInstance implements AgChartInstance {
    update(): Promise<void> {
        throw new Error('AG Charts - AG Charts - Method not implemented.');
    }
    updateDelta(): Promise<void> {
        throw new Error('AG Charts - Method not implemented.');
    }
    getOptions(): AgChartOptions {
        throw new Error('AG Charts - Method not implemented.');
    }
    waitForUpdate(): Promise<void> {
        throw new Error('AG Charts - Method not implemented.');
    }
    download(): Promise<void> {
        throw new Error('AG Charts - Method not implemented.');
    }
    resetAnimations(): void {
        throw new Error('AG Charts - Method not implemented.');
    }
    skipAnimations(): void {
        throw new Error('AG Charts - Method not implemented.');
    }
    getImageDataURL(): Promise<string> {
        throw new Error('AG Charts - Method not implemented.');
    }
    getState(): Required<AgChartState> {
        throw new Error('AG Charts - Method not implemented.');
    }
    setState(): Promise<void> {
        throw new Error('AG Charts - Method not implemented.');
    }
    destroy(): void {
        throw new Error('AG Charts - Method not implemented.');
    }
}
