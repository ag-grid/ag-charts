import { afterEach, describe, expect, it } from '@jest/globals';

import type { AgChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';
import { deproxy, setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';

import { ukData } from '../series/map-test/ukData';
import ukTopology from '../series/map-test/ukTopology.json';
import { prepareEnterpriseTestOptions } from './utils';

// AG-17296: Verify that a user-supplied partial `colorScale` (e.g. `{}` or `{ mode: 'discrete' }`)
// does not wipe the theme-supplied fills for series that derive their palette via `$map` theme
// expressions. The options graph's CHILDREN_SOURCE_EDGE propagation previously required a separate
// `colorRange` fallback to survive partial overrides; these tests confirm the `$map` approach works.
describe('colorScale partial options — theme fills survive user partials', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: any;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            chart = undefined;
        }
    });

    function assertColorScalePopulated(_label: string) {
        const series: any = deproxy(chart).series.find((s: any) => s.colorScale != null);
        expect(series).toBeDefined();
        expect(series.colorScale.domain.length).toBeGreaterThanOrEqual(2);
        expect(series.colorScale.range.length).toBeGreaterThanOrEqual(2);
        expect(series.colorScale.range).not.toEqual(['red', 'blue']);
    }

    it('heatmap with colorScale: {}', async () => {
        const options: AgChartOptions = prepareEnterpriseTestOptions({
            data: [
                { x: 'A', y: '1', v: 10 },
                { x: 'B', y: '1', v: 20 },
                { x: 'A', y: '2', v: 30 },
                { x: 'B', y: '2', v: 40 },
            ],
            series: [{ type: 'heatmap', xKey: 'x', yKey: 'y', colorKey: 'v', colorScale: {} }],
        });

        chart = AgCharts.create(options);
        await waitForChartStability(chart);
        assertColorScalePopulated('heatmap');
    });

    it('treemap with colorScale: {}', async () => {
        const options: AgChartOptions = prepareEnterpriseTestOptions({
            data: [
                { title: 'A', size: 10, color: 1, children: [{ title: 'A1', size: 5, color: 2 }] },
                { title: 'B', size: 20, color: 3, children: [{ title: 'B1', size: 8, color: 4 }] },
            ],
            series: [
                {
                    type: 'treemap',
                    labelKey: 'title',
                    sizeKey: 'size',
                    colorKey: 'color',
                    childrenKey: 'children',
                    colorScale: {},
                },
            ],
        });

        chart = AgCharts.create(options);
        await waitForChartStability(chart);
        assertColorScalePopulated('treemap');
    });

    it('sunburst with colorScale: {}', async () => {
        const options: AgChartOptions = prepareEnterpriseTestOptions({
            data: [
                { name: 'A', size: 10, color: 1, children: [{ name: 'A1', size: 5, color: 2 }] },
                { name: 'B', size: 20, color: 3, children: [{ name: 'B1', size: 8, color: 4 }] },
            ],
            series: [
                {
                    type: 'sunburst',
                    labelKey: 'name',
                    sizeKey: 'size',
                    colorKey: 'color',
                    childrenKey: 'children',
                    colorScale: {},
                },
            ],
        });

        chart = AgCharts.create(options);
        await waitForChartStability(chart);
        assertColorScalePopulated('sunburst');
    });

    it('map-marker with colorScale: {}', async () => {
        const options: AgChartOptions = prepareEnterpriseTestOptions({
            data: ukData,
            topology: ukTopology,
            series: [
                { type: 'map-shape-background' },
                { type: 'map-marker', idKey: 'name', colorKey: 'population', colorScale: {} },
            ],
        });

        chart = AgCharts.create(options);
        await waitForChartStability(chart);
        assertColorScalePopulated('map-marker');
    });

    it('map-shape with colorScale: {}', async () => {
        const options: AgChartOptions = prepareEnterpriseTestOptions({
            data: ukData,
            topology: ukTopology,
            series: [{ type: 'map-shape', idKey: 'name', colorKey: 'population', colorScale: {} }],
        });

        chart = AgCharts.create(options);
        await waitForChartStability(chart);
        assertColorScalePopulated('map-shape');
    });

    it('heatmap with colorScale: { mode: "discrete" }', async () => {
        const options: AgChartOptions = prepareEnterpriseTestOptions({
            data: [
                { x: 'A', y: '1', v: 10 },
                { x: 'B', y: '1', v: 20 },
                { x: 'A', y: '2', v: 30 },
                { x: 'B', y: '2', v: 40 },
            ],
            series: [{ type: 'heatmap', xKey: 'x', yKey: 'y', colorKey: 'v', colorScale: { mode: 'discrete' } }],
        });

        chart = AgCharts.create(options);
        await waitForChartStability(chart);
        assertColorScalePopulated('heatmap discrete');
    });
});
