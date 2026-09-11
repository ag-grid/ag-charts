import { AgCharts, ModuleRegistry } from 'ag-charts-enterprise';
import type { AgChartInstance, AgChartOptions, AgFinancialChartOptions } from 'ag-charts-enterprise';
import { type RefObject, useEffect, useRef } from 'react';

import type { PreviewChartOptions, PreviewPreset, PreviewTooltipTarget } from './chartTypes';
import { PREVIEW_MODULES } from './previewModules';

ModuleRegistry.registerModules(PREVIEW_MODULES);

/**
 * Mount a chart into a container and keep it in step with `options`.
 *
 * `update` rather than a remount, because an AG Charts theme is an option rather
 * than a stylesheet: recreating the chart on every keystroke would flash the
 * canvas and throw away the entry animation.
 *
 * `options` must be memoised by the caller - it is the update trigger.
 *
 * `preset` picks the factory. It is fixed for the life of the chart: a preset is
 * chosen at creation and cannot be updated into or out of, so a caller switching
 * between the two must remount rather than pass a different value.
 *
 * `tooltipTarget` holds a tooltip open on one datum, and releases it when
 * absent. It is the chart's own `setState` rather than a synthesised hover, so
 * the tooltip stays put across the updates a param edit causes, and `frozen`
 * keeps a stray mouse from moving it mid-edit.
 */
export const useChart = (
    options: PreviewChartOptions,
    preset?: PreviewPreset,
    tooltipTarget?: PreviewTooltipTarget
): RefObject<HTMLDivElement> => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<AgChartInstance<PreviewChartOptions> | null>(null);
    // Read through a ref so mounting does not depend on the first options value,
    // which would recreate the chart whenever the caller's memo changed.
    const latestOptions = useRef(options);
    latestOptions.current = options;

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        chartRef.current =
            preset === 'price-volume'
                ? AgCharts.createFinancialChart({ ...(latestOptions.current as AgFinancialChartOptions), container })
                : AgCharts.create({ ...(latestOptions.current as AgChartOptions), container });
        return () => {
            chartRef.current?.destroy();
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

    // Run after every update as well as on a change of target, because a chart
    // carries its active datum through most updates but not all of them: an
    // options change big enough to rebuild the series - switching the preview
    // from bars to a donut - drops it, which would leave the panel holding a
    // tooltip that is no longer on screen. What the chart already shows is read
    // back rather than re-applied blind, so the common case - a colour being
    // dragged, an update a frame - costs a read instead of a pick and a tooltip
    // rebuild; and it is read once the update has settled, since until then the
    // chart still reports the datum the update is about to drop.
    //
    // `appliedTarget` is for the other direction only: it says whether this hook
    // has a tooltip of its own to let go of, so that a release clears the state
    // once rather than on every keystroke of an unrelated edit.
    const appliedTarget = useRef<PreviewTooltipTarget>();
    useEffect(() => {
        let stale = false;
        const apply = async () => {
            // An update that failed is the update's own business; the state it
            // left behind is still what the chart is showing.
            await pendingUpdate.current?.catch(() => undefined);
            const chart = chartRef.current;
            if (stale || !chart) return;
            if (tooltipTarget) {
                const active = chart.getState().active?.activeItem;
                if (active?.seriesId === tooltipTarget.seriesId && active.itemId === tooltipTarget.itemId) return;
                appliedTarget.current = tooltipTarget;
                void chart.setState({
                    // The rest of the state as it stands - a zoom, a hidden
                    // series - so that opening a tooltip is all this does.
                    ...chart.getState(),
                    active: { activeItem: { type: 'series-node', ...tooltipTarget }, frozen: true },
                });
            } else if (appliedTarget.current) {
                appliedTarget.current = undefined;
                void chart.setState({ ...chart.getState(), active: { activeItem: undefined, frozen: false } });
            }
        };
        void apply();
        return () => {
            stale = true;
        };
    }, [options, tooltipTarget?.seriesId, tooltipTarget?.itemId]);

    return containerRef;
};
