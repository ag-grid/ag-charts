import type { AgChartInstance } from '../options/chart/chartBuilderOptions';
import { deepClone } from '../util/json';
import { ActionOnSet } from '../util/proxy';
import type { Chart } from './chart';

export interface AgChartProxy extends AgChartInstance {
    chart: AgChartInstance;
}

/**
 * Proxy class, to allow library users to keep a stable reference to their chart, even if we need
 * to switch concrete class (e.g. when switching between CartesianChart vs. PolarChart).
 */
export class AgChartInstanceProxy implements AgChartProxy {
    static chartInstances = new WeakMap<Chart, AgChartInstanceProxy>();

    static isInstance(x: any): x is AgChartInstanceProxy {
        if (x instanceof AgChartInstanceProxy) {
            // Simple case.
            return true;
        }

        if (x.constructor?.name === 'AgChartInstanceProxy' && x.chart != null) {
            // instanceof can fail if mixing bundles (e.g. grid all-modules vs. standalone).
            return true;
        }

        return x.chart != null && this.validateImplementation(x);
    }

    private static validateImplementation(x: object) {
        const chartProps: Array<keyof AgChartInstanceProxy> = ['getOptions', 'destroy'];
        const signatureProps = Object.keys(Object.getPrototypeOf(x) ?? {});
        return chartProps.every((prop) => signatureProps.includes(prop));
    }

    @ActionOnSet<AgChartInstanceProxy>({
        oldValue(chart) {
            AgChartInstanceProxy.chartInstances.delete(chart);
        },
        newValue(chart) {
            AgChartInstanceProxy.chartInstances.set(chart, this);
        },
    })
    chart: Chart;

    constructor(chart: Chart) {
        this.chart = chart;
    }

    getOptions() {
        return deepClone(this.chart.getOptions());
    }

    resetAnimations(): void {
        this.chart.resetAnimations();
    }

    skipAnimations(): void {
        this.chart.skipAnimations();
    }

    destroy() {
        this.chart.destroy();
    }
}
