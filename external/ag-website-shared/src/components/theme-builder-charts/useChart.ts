import { AgCharts, AllCommunityModule, ModuleRegistry } from 'ag-charts-community';
import type { AgChartInstance, AgChartOptions } from 'ag-charts-community';
import { type RefObject, useEffect, useRef } from 'react';

// The whole community bundle rather than the handful of modules these charts
// need: the preview is meant to grow into something that exercises more of the
// theme (tooltips, crosshairs, a second chart type), and each of those would
// otherwise fail at runtime rather than at build time. Worth trimming once the
// preview content settles.
ModuleRegistry.registerModules([AllCommunityModule]);

/**
 * Mount a chart into a container and keep it in step with `options`.
 *
 * `update` rather than a remount, because an AG Charts theme is an option rather
 * than a stylesheet: recreating the chart on every keystroke would flash the
 * canvas and throw away the entry animation.
 *
 * `options` must be memoised by the caller - it is the update trigger.
 */
export const useChart = (options: AgChartOptions): RefObject<HTMLDivElement> => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<AgChartInstance | null>(null);
    // Read through a ref so mounting does not depend on the first options value,
    // which would recreate the chart whenever the caller's memo changed.
    const latestOptions = useRef(options);
    latestOptions.current = options;

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        chartRef.current = AgCharts.create({ ...latestOptions.current, container });
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
