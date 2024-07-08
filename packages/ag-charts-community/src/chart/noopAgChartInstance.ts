import type { AgChartOptions, AgChartState } from 'ag-charts-types';

const errorMessage = 'AG Charts - Method not implemented.';
export class NoopAgChartInstance {
    update(): Promise<void> {
        throw new Error(errorMessage);
    }
    updateDelta(): Promise<void> {
        throw new Error(errorMessage);
    }
    getOptions(): AgChartOptions {
        throw new Error(errorMessage);
    }
    waitForUpdate(): Promise<void> {
        throw new Error(errorMessage);
    }
    download(): Promise<void> {
        throw new Error(errorMessage);
    }
    resetAnimations(): void {
        throw new Error(errorMessage);
    }
    skipAnimations(): void {
        throw new Error(errorMessage);
    }
    getImageDataURL(): Promise<string> {
        throw new Error(errorMessage);
    }
    getState(): Required<AgChartState> {
        throw new Error(errorMessage);
    }
    setState(): Promise<void> {
        throw new Error(errorMessage);
    }
    destroy(): void {
        throw new Error(errorMessage);
    }
}
