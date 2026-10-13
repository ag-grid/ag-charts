import { type RefObject, useEffect, useRef } from 'react';

import { AgCharts, ModuleRegistry } from 'ag-charts-enterprise';
import type { AgChartInstance, AgChartOptions } from 'ag-charts-enterprise';

import { PREVIEW_MODULES } from './previewModules';

ModuleRegistry.registerModules(PREVIEW_MODULES);

/**
 * Mount a chart into a container and keep it in step with `options`, which must
 * be memoised by the caller - it is the update trigger. Updates rather than
 * remounts, so a keystroke does not flash the canvas or restart the animation.
 */
export const useChart = (options: AgChartOptions): { containerRef: RefObject<HTMLDivElement> } => {
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

    useEffect(() => {
        const container = containerRef.current;
        if (!chartRef.current || !container) return;
        void chartRef.current.update({ ...options, container }).catch(() => undefined);
    }, [options]);

    return { containerRef };
};
