import { type AgChartOptions, AgCharts } from 'ag-charts-community';
import type { AgGaugeOptions } from 'ag-charts-enterprise';

import { h } from './dom';

/** What the host needs of an `AgChartInstance`, whichever factory created it. */
interface ChartLike<O> {
    update(options: O): Promise<void>;
    destroy(): void;
}

/**
 * The `ag-charts-react` wrapper as a plain object: the `<div style="height: 100%; width: 100%;">`
 * it renders, a chart created into it once the div is in the document, and `chart.update()` when
 * the options change identity, exactly as the wrapper's effect on its `options` prop.
 */
export interface ChartHost<O> {
    el: HTMLDivElement;
    /** Create the chart (the wrapper's layout effect). */
    mount(options: O): void;
    /** Apply new options, skipped while they are the object last applied (the wrapper's `[options]` effect). */
    update(options: O): void;
    destroy(): void;
}

// eslint-disable-next-line no-console
const logError = (e: unknown) => console.error(e);

function host<O extends object>(create: (options: O) => ChartLike<O>): ChartHost<O> {
    const el = h('div', { style: 'height: 100%; width: 100%;' });
    let chart: ChartLike<O> | undefined;
    let applied: O | undefined;
    return {
        el,
        mount(options) {
            applied = options;
            chart = create({ ...options, container: el });
        },
        update(options) {
            if (options === applied) return;
            applied = options;
            chart?.update({ ...options, container: el }).catch(logError);
        },
        destroy() {
            chart?.destroy();
            chart = undefined;
        },
    };
}

/** `<AgCharts options style={{ height: '100%', width: '100%' }} />`. */
export const chartHost = <O extends AgChartOptions>(): ChartHost<O> => host<O>((options) => AgCharts.create(options));

/** `<AgGauge options style={{ height: '100%', width: '100%' }} />`. */
export const gaugeHost = <O extends AgGaugeOptions>(): ChartHost<O> =>
    host<O>((options) => AgCharts.createGauge(options));
