import { afterEach, describe, expect, it } from 'vitest';

import { AgCharts } from 'ag-charts-community';
import {
    deproxy,
    getVisibleLabelNodes,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import type { AgChartInstance, AgChartOptions } from 'ag-charts-types';

import { prepareEnterpriseTestOptions } from '../test/utils';

/**
 * Enterprise mirror of the community suite: the label `itemStyler` participates in placement, so the
 * collision engine reserves and tests the box the styler resolves at each candidate rather than the
 * configured one.
 */
describe('label itemStyler participates in placement', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        chart?.destroy();
    });

    const render = async (options: object) => {
        prepareEnterpriseTestOptions(options as AgChartOptions);
        chart = AgCharts.create(options as AgChartOptions);
        await waitForChartStability(chart);
    };

    const visibleLabels = (seriesIndex = 0) => getVisibleLabelNodes(chart, seriesIndex);

    describe('range-bar', () => {
        // Bars ~30px deep: an unstyled label fits inside one, a label padded by 20px a side does not.
        const rangeBarChart = (label: object) => ({
            data: [
                { cat: 'A', low: 4, high: 12 },
                { cat: 'B', low: 6, high: 14 },
            ],
            legend: { enabled: false },
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left', max: 100 },
            },
            series: [
                {
                    type: 'range-bar',
                    xKey: 'cat',
                    yLowKey: 'low',
                    yHighKey: 'high',
                    label: { enabled: true, placement: ['inside', 'outside'], ...label },
                },
            ],
        });

        /**
         * The placement each label was finally drawn at, as the placement engine wrote it back. Read from
         * the scene rather than the styler's params: the render pass reuses the cached styler result for
         * the winning candidate, so the last recorded call is the last candidate probed, not the choice.
         */
        const drawnPlacements = async (label: object) => {
            await render(rangeBarChart(label));
            const series = deproxy(chart as any).series[0] as unknown as {
                contextNodeData?: { labelData: { placement?: string; hidden?: boolean }[] };
            };
            const drawn = (series.contextNodeData?.labelData ?? []).filter((datum) => datum.hidden !== true);
            expect(drawn.length).toBeGreaterThan(0);
            return drawn.map((datum) => datum.placement);
        };

        it('keeps a label inside the bar when the styled box fits it', async () => {
            // The two labels share one bar rect and avoid each other, so the low label takes the inside
            // candidate and the high label the outside one.
            const drawn = await drawnPlacements({ itemStyler: () => ({}) });
            expect(drawn.some((placement) => placement?.startsWith('inside'))).toBe(true);
        });

        it('cascades every label outside the bar when the styled box no longer fits it', async () => {
            const drawn = await drawnPlacements({ itemStyler: () => ({ fill: '#eeeeee', padding: 20 }) });
            expect(drawn.every((placement) => placement?.startsWith('outside'))).toBe(true);
        });

        it('hides a label its styler disabled', async () => {
            await render(rangeBarChart({ itemStyler: () => ({ enabled: false }) }));
            expect(visibleLabels()).toHaveLength(0);
        });
    });

    describe('range-area', () => {
        const rangeAreaChart = (label: object) => ({
            data: [
                { x: 'A', low: 2, high: 8 },
                { x: 'B', low: 3, high: 9 },
            ],
            legend: { enabled: false },
            axes: { x: { type: 'category', position: 'bottom' }, y: { type: 'number', position: 'left' } },
            series: [
                {
                    type: 'range-area',
                    xKey: 'x',
                    yLowKey: 'low',
                    yHighKey: 'high',
                    label: { enabled: true, placement: 'outside', ...label },
                },
            ],
        });

        const labelYs = async (options: object) => {
            await render(options);
            const ys = visibleLabels().map((node) => node.y);
            expect(ys.length).toBeGreaterThan(0);
            chart.destroy();
            return ys;
        };

        it('reserves the styled box, so a padded band label clears the marker by its own box edge', async () => {
            const plain = await labelYs(rangeAreaChart({}));
            const padded = await labelYs(rangeAreaChart({ itemStyler: () => ({ fill: '#eeeeee', padding: 15 }) }));

            expect(padded).toHaveLength(plain.length);
            // The `high` label sits above the band and the `low` label below it, so the box edge that has
            // to clear the marker — and with it the sign of the shift — differs between the two.
            for (const [index, y] of padded.entries()) {
                expect(Math.abs(y - plain[index])).toBeCloseTo(15, 5);
            }
        });

        it('hides a band label its styler disabled', async () => {
            await render(rangeAreaChart({ itemStyler: () => ({ enabled: false }) }));
            expect(visibleLabels()).toHaveLength(0);
        });
    });
});
