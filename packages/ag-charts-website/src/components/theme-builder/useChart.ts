import { type RefObject, useEffect, useRef } from 'react';

import { AgCharts, ModuleRegistry } from 'ag-charts-enterprise';
import type { AgChartInstance, AgChartOptions } from 'ag-charts-enterprise';

import type { PreviewTooltipTarget } from './chartTypes';
import { PREVIEW_MODULES } from './previewModules';

ModuleRegistry.registerModules(PREVIEW_MODULES);

export interface ChartHold {
    /** The datum whose tooltip is held open. */
    tooltipTarget?: PreviewTooltipTarget;
}

/**
 * Mount a chart into a container and keep it in step with `options`, which must
 * be memoised by the caller - it is the update trigger. Updates rather than
 * remounts, so a keystroke does not flash the canvas or restart the animation.
 */
export const useChart = (
    options: AgChartOptions,
    { tooltipTarget }: ChartHold = {}
): { containerRef: RefObject<HTMLDivElement> } => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<AgChartInstance | null>(null);
    // Read through a ref so mounting does not depend on the first options value,
    // which would recreate the chart whenever the caller's memo changed.
    const latestOptions = useRef(options);
    latestOptions.current = options;

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const chart = AgCharts.create({ ...latestOptions.current, container });
        chartRef.current = chart;
        return () => {
            chart.destroy();
            chartRef.current = null;
        };
    }, []);

    // Kept so the effect below can wait for the update in hand: the chart's
    // state is only settled once it resolves.
    const pendingUpdate = useRef<Promise<void>>();
    useEffect(() => {
        const container = containerRef.current;
        if (!chartRef.current || !container) return;
        pendingUpdate.current = chartRef.current.update({ ...options, container });
    }, [options]);

    // Runs after every update, not only on a change of target: an options change
    // large enough to rebuild the series drops the active datum. Waits for the
    // update to settle, since until then the chart still reports the datum about
    // to be dropped, and reads back what it shows rather than re-applying blind.
    const appliedTarget = useRef<PreviewTooltipTarget>();
    useEffect(() => {
        let stale = false;
        const apply = async () => {
            // An update that failed is the update's own business; the state it
            // left behind is still what the chart is showing.
            await pendingUpdate.current?.catch(() => undefined);
            const chart = chartRef.current;
            if (stale || !chart) return;
            // Kept whole - a hidden series, say - so that the hold is all this changes.
            const state = chart.getState();
            let changed = false;

            const active = state.active?.activeItem;
            if (tooltipTarget) {
                if (active?.seriesId !== tooltipTarget.seriesId || active.itemId !== tooltipTarget.itemId) {
                    appliedTarget.current = tooltipTarget;
                    state.active = { activeItem: { type: 'series-node', ...tooltipTarget }, frozen: true };
                    changed = true;
                }
            } else if (appliedTarget.current) {
                appliedTarget.current = undefined;
                state.active = { activeItem: undefined, frozen: false };
                changed = true;
            }

            if (changed) void chart.setState(state);
        };
        void apply();
        return () => {
            stale = true;
        };
    }, [options, tooltipTarget?.seriesId, tooltipTarget?.itemId]);

    return { containerRef };
};
