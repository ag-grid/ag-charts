import type { AgChartProxy } from '../options/agChartOptions';
import type { Chart } from './chart';

/**
 * Proxy class, to allow library users to keep a stable reference to their chart, even if we need
 * to switch concrete class (e.g. when switching between CartesianChart vs. PolarChart).
 */
export class AgChartInstanceProxy implements AgChartProxy {
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
        const signatureProps = Object.keys(x.constructor?.prototype ?? {});
        return chartProps.every((prop) => signatureProps.includes(prop));
    }

    constructor(public chart: Chart) {}

    getOptions() {
        return this.chart.getOptions();
    }

    destroy() {
        this.chart.destroy();
    }
}
