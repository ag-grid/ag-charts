import { AgCharts, ModuleRegistry } from 'ag-charts-enterprise';
import type { AgChartInstance, AgChartOptions, AgFinancialChartOptions } from 'ag-charts-enterprise';
import { type RefObject, useEffect, useRef } from 'react';

import type { PreviewChartOptions, PreviewPreset } from './chartTypes';
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
 */
export const useChart = (options: PreviewChartOptions, preset?: PreviewPreset): RefObject<HTMLDivElement> => {
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

    useEffect(() => {
        const container = containerRef.current;
        if (!chartRef.current || !container) return;
        void chartRef.current.update({ ...options, container });
    }, [options]);

    return containerRef;
};
