import { AgCharts, AllCartesianModule, AllCommunityModule, AllPolarModule, ModuleRegistry } from 'ag-charts-enterprise';
import type { AgChartInstance, AgChartOptions, AgFinancialChartOptions } from 'ag-charts-enterprise';
import { type RefObject, useEffect, useRef } from 'react';

import type { PreviewChartOptions } from './chartTypes';

/**
 * Enterprise, because the theme is mostly chrome the community bundle cannot
 * draw: the navigator, the toolbars, the context menu and the annotation panel
 * are what carry the Chrome, Buttons & Inputs and Menus & Panels params, and a
 * community-only preview leaves half the editor panel editing nothing. The
 * watermark stays off - `licenseManager` suppresses it on localhost and on
 * ag-grid.com, which is everywhere this page runs.
 *
 * Registered as three bundles rather than `AllEnterpriseModule`, which would
 * also pull maps, topology, gauges and the tree series into a docs page that
 * shows none of them.
 */
ModuleRegistry.registerModules([AllCommunityModule, AllCartesianModule, AllPolarModule]);

/**
 * Mount a chart into a container and keep it in step with `options`.
 *
 * `update` rather than a remount, because an AG Charts theme is an option rather
 * than a stylesheet: recreating the chart on every keystroke would flash the
 * canvas and throw away the entry animation.
 *
 * `options` must be memoised by the caller - it is the update trigger.
 *
 * `isFinancial` picks the factory. It is fixed for the life of the chart: a
 * preset is chosen at creation and cannot be updated into or out of, so a caller
 * switching between the two must remount rather than pass a different flag.
 */
export const useChart = (options: PreviewChartOptions, isFinancial = false): RefObject<HTMLDivElement> => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<AgChartInstance<PreviewChartOptions> | null>(null);
    // Read through a ref so mounting does not depend on the first options value,
    // which would recreate the chart whenever the caller's memo changed.
    const latestOptions = useRef(options);
    latestOptions.current = options;

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        chartRef.current = isFinancial
            ? AgCharts.createFinancialChart({ ...(latestOptions.current as AgFinancialChartOptions), container })
            : AgCharts.create({ ...(latestOptions.current as AgChartOptions), container });
        return () => {
            chartRef.current?.destroy();
            chartRef.current = null;
        };
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!chartRef.current || !container) return;
        void chartRef.current.update({ ...options, container });
    }, [options]);

    return containerRef;
};
