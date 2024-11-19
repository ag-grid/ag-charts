import type { Chart } from '../chart';
import type { MockEvent } from '../interaction/regionManager';

export function findMouseTarget(chart: Chart, canvasX: number, canvasY: number): MockEvent {
    type TestModuleFns = { testFindTarget: typeof findMouseTarget };
    for (const moduleName of ['legend', 'navigator', 'zoom']) {
        const mod = chart.modulesManager.getModule<TestModuleFns>(moduleName);
        const modTarget = mod?.testFindTarget(canvasX, canvasY);
        if (modTarget) {
            return modTarget;
        }
    }
    return this.seriesAreaManager.testFindTarget(canvasX, canvasY);
}
