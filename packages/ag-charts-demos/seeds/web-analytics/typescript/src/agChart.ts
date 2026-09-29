import { type AgChartInstance, type AgChartOptions, AgCharts } from 'ag-charts-community';

import { type View, createSlot, h } from './dom';

// eslint-disable-next-line no-console
const logError = (e: unknown) => console.error(e);

/** The `<AgCharts options style>` wrapper as a view: a full-size div holding one chart instance. */
export interface AgChartView<O extends AgChartOptions> extends View {
    /** Re-run the options through `chart.update`, as the wrapper does when its `options` prop changes. */
    update(options: O): void;
    /** The live instance, for the imperative calls the React demo makes through its `ref`. */
    readonly chart: AgChartInstance<O> | undefined;
}

/**
 * `ag-charts-react`'s component, without React: `<AgCharts options={o} style={{ height: '100%',
 * width: '100%' }} />` renders `<div style="height: 100%; width: 100%;">`, creates the chart in it
 * once mounted, re-runs `chart.update({ ...options, container })` when the options change identity
 * (never right after creating), and destroys the chart on unmount.
 */
export function createAgChart<O extends AgChartOptions>(initial: O): AgChartView<O> {
    const el = h('div', { style: 'height: 100%; width: 100%;' });
    let options = initial;
    let chart: AgChartInstance<O> | undefined;
    return {
        el,
        get chart() {
            return chart;
        },
        mount() {
            chart = AgCharts.create({ ...options, container: el }) as AgChartInstance<O>;
        },
        update(next) {
            if (next === options) return;
            options = next;
            chart?.update({ ...options, container: el }).catch(logError);
        },
        destroy() {
            chart?.destroy();
            chart = undefined;
        },
    };
}

/** A chart whose options are a pure function of its data, as the `useMemo` chart components are. */
export interface DataChart<T> extends View {
    /** Rebuild the options and update the chart when the data changes identity. */
    update(data: T): void;
}

export function createDataChart<T, O extends AgChartOptions>(data: T, buildOptions: (data: T) => O): DataChart<T> {
    const view = createAgChart(buildOptions(data));
    return {
        el: view.el,
        mount: () => view.mount(),
        update(next) {
            if (next === data) return;
            data = next;
            view.update(buildOptions(data));
        },
        destroy: () => view.destroy(),
    };
}

/** A chart-or-empty-state branch (`{show ? <Chart data={d} /> : <EmptyState />}`). */
export interface ChartSlot<T> extends View {
    update(show: boolean, data: T): void;
}

export function createChartSlot<T>(
    show: boolean,
    data: T,
    makeChart: (data: T) => DataChart<T>,
    makeEmpty: () => View
): ChartSlot<T> {
    const slot = createSlot(() =>
        show ? { key: 'chart' as const, make: () => makeChart(data) } : { key: 'empty' as const, make: makeEmpty }
    );
    return {
        get el() {
            return slot.el;
        },
        mount: () => slot.mount(),
        update(nextShow, nextData) {
            show = nextShow;
            data = nextData;
            slot.update();
            // A slot that just swapped in a chart built it from `data`; a chart that stayed takes it now.
            if (slot.key === 'chart') (slot.view as DataChart<T>).update(data);
        },
        destroy: () => slot.destroy(),
    };
}
