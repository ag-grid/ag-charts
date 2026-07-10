import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { AgChartInstance, AgChartOptions } from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import {
    deproxy,
    expectWarningsCalls,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';
import { findCategoryLegend } from './legendPaginationOriginator';

describe('Legend pagination state (AG-13436)', () => {
    setupMockConsole();

    setupMockCanvas();
    let chart: AgChartInstance;
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.append(container);
    });

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        container.remove();
    });

    const buildPaginatingSeries = (count: number) =>
        Array.from({ length: count }, (_v, i) => ({
            type: 'line' as const,
            data: [{ x: i, y: i }],
            xKey: 'x',
            yKey: 'y',
            yName: `Series ${i}`,
        }));

    const paginatingOptions = (count = 100): AgChartOptions => ({
        legend: { position: 'right' },
        series: buildPaginatingSeries(count),
    });

    const getCategoryLegend = (instance: AgChartInstance) =>
        findCategoryLegend(deproxy(instance).modulesManager.legends());

    it('includes legendPagination in getState when the legend is paginated', async () => {
        const options = paginatingOptions();
        prepareTestOptions(options, container);
        chart = AgCharts.create(options);
        await waitForChartStability(chart);

        const legend = getCategoryLegend(chart);
        expect(legend?.pagination).toBeDefined();
        expect(legend!.pagination!.totalPages).toBeGreaterThan(1);

        legend!.pagination!.setPage(1);
        expect(chart.getState().legendPagination).toBe(1);
    });

    it('omits legendPagination in getState when the legend is disabled', async () => {
        const options: AgChartOptions = {
            legend: { enabled: false },
            data: [
                { x: 'a', y: 1 },
                { x: 'b', y: 2 },
            ],
            series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
        };
        prepareTestOptions(options, container);
        chart = AgCharts.create(options);
        await waitForChartStability(chart);

        expect(chart.getState().legendPagination).toBeUndefined();
    });

    it('omits legendPagination in getState when the legend has a single page', async () => {
        const options: AgChartOptions = {
            legend: {},
            data: [{ x: 'a', y1: 1, y2: 2 }],
            series: [
                { type: 'bar', xKey: 'x', yKey: 'y1' },
                { type: 'bar', xKey: 'x', yKey: 'y2' },
            ],
        };
        prepareTestOptions(options, container);
        chart = AgCharts.create(options);
        await waitForChartStability(chart);

        expect(getCategoryLegend(chart)!.pagination!.totalPages).toBe(1);
        expect(chart.getState().legendPagination).toBeUndefined();
    });

    it('restores the legend pagination page via setState on a like-sized chart', async () => {
        const optionsA = paginatingOptions();
        const containerA = document.createElement('div');
        document.body.append(containerA);
        prepareTestOptions(optionsA, containerA);
        const chartA = AgCharts.create(optionsA);
        await waitForChartStability(chartA);
        getCategoryLegend(chartA)!.pagination!.setPage(1);
        const state = chartA.getState();
        expect(state.legendPagination).toBe(1);
        chartA.destroy();
        containerA.remove();

        const optionsB = paginatingOptions();
        prepareTestOptions(optionsB, container);
        chart = AgCharts.create(optionsB);
        await waitForChartStability(chart);
        await chart.setState(state);
        await waitForChartStability(chart);

        expect(getCategoryLegend(chart)!.pagination!.currentPage).toBe(1);
    });

    it('applies the legend pagination page from initialState', async () => {
        const options: AgChartOptions = { ...paginatingOptions(), initialState: { legendPagination: 1 } };
        prepareTestOptions(options, container);
        chart = AgCharts.create(options);
        await waitForChartStability(chart);

        const legend = getCategoryLegend(chart);
        expect(legend!.pagination!.totalPages).toBeGreaterThan(1);
        expect(legend!.pagination!.currentPage).toBe(1);
    });

    it('clamps a restored page that is out of range at a smaller paginating size', async () => {
        const optionsA = paginatingOptions();
        const containerA = document.createElement('div');
        document.body.append(containerA);
        prepareTestOptions(optionsA, containerA);
        optionsA.height = 250;
        const chartA = AgCharts.create(optionsA);
        await waitForChartStability(chartA);
        const paginationA = getCategoryLegend(chartA)!.pagination!;
        const lastPage = paginationA.totalPages - 1;
        paginationA.setPage(lastPage);
        const state = chartA.getState();
        expect(state.legendPagination).toBe(lastPage);
        chartA.destroy();
        containerA.remove();

        const optionsB = paginatingOptions();
        prepareTestOptions(optionsB, container);
        optionsB.height = 600;
        chart = AgCharts.create(optionsB);
        await waitForChartStability(chart);
        await chart.setState(state);
        await waitForChartStability(chart);

        const paginationB = getCategoryLegend(chart)!.pagination!;
        expect(paginationB.totalPages).toBeGreaterThan(1);
        expect(lastPage).toBeGreaterThan(paginationB.totalPages - 1);
        expect(paginationB.currentPage).toBe(paginationB.totalPages - 1);
    });

    it('rejects a non-integer initialState pagination page and keeps the first page', async () => {
        const options: AgChartOptions = {
            ...paginatingOptions(),
            initialState: { legendPagination: 1.5 },
        };
        prepareTestOptions(options, container);
        chart = AgCharts.create(options);
        await waitForChartStability(chart);

        expect(getCategoryLegend(chart)!.pagination!.currentPage).toBe(0);
        expectWarningsCalls().not.toHaveLength(0);
    });
});
