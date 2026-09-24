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

    /** What the series hands the placement engine: the labels that reserve space and act as obstacles. */
    const placementLabelData = (seriesIndex = 0) => {
        const series = deproxy(chart as any).series[seriesIndex] as unknown as { getLabelData(): unknown[] };
        return series.getLabelData();
    };

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

        /**
         * The orientation-only route bakes the placement rather than letting the engine walk candidates, so
         * a disabled label has to be left out of the label data here or it reserves space and acts as an
         * obstacle while drawing nothing. It takes an explicit `alwaysShow`, since an orientation array
         * otherwise makes the label hideable and routes it through the cascade.
         */
        const orientationOnly = (styler: (params: any) => object) =>
            rangeBarChart({
                placement: 'inside',
                orientation: ['horizontal', 'vertical'],
                collision: { alwaysShow: true },
                itemStyler: styler,
            });

        it('reserves no placement for a disabled label on the orientation-only route', async () => {
            await render(orientationOnly(() => ({ enabled: false })));
            expect(visibleLabels()).toHaveLength(0);
            expect(placementLabelData()).toHaveLength(0);
        });

        it('still reserves placement for an enabled label on the orientation-only route', async () => {
            await render(orientationOnly(() => ({})));
            expect(placementLabelData().length).toBeGreaterThan(0);
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

    /**
     * Funnel-family series map their public placements onto the bar vocabulary internally, so every route
     * that resolves a styled box has to report the public value back: `itemStyler` is documented API and
     * must only ever be handed a value the series was configured with. The funnel cases configure
     * `before`/`after`, which map onto bar `inside-start`/`inside-end`, so a leaked bar value is distinct.
     */
    describe('funnel family reports public placements to the styler', () => {
        const FUNNEL_PLACEMENTS = ['inside-before', 'inside-after'];
        const CONE_FUNNEL_PLACEMENT = /^(start|middle|end)-(before|center|after)$/;

        const seriesChart = (type: string, placement: string[], extra: object, seen: Set<string>) => ({
            data: [
                { stage: 'A', value: 9 },
                { stage: 'B', value: 6 },
                { stage: 'C', value: 3 },
            ],
            legend: { enabled: false },
            series: [
                {
                    type,
                    stageKey: 'stage',
                    valueKey: 'value',
                    ...extra,
                    label: {
                        enabled: true,
                        placement,
                        itemStyler: (params: any) => {
                            seen.add(String(params.placement));
                            return {};
                        },
                    },
                },
            ],
        });

        const styledPlacements = async (type: string, placement: string[], extra: object = {}) => {
            const seen = new Set<string>();
            const options = seriesChart(type, placement, extra, seen);
            await render(options);
            expect(placementLabelData().length).toBeGreaterThan(0);
            expect(seen.size).toBeGreaterThan(0);
            // The second pass is the route that resolves a styled box from a placement already mapped into
            // the bar vocabulary, so it must be seen calling the styler in its own right.
            seen.clear();
            await chart.update(options as AgChartOptions);
            await waitForChartStability(chart);
            expect(placementLabelData().length).toBeGreaterThan(0);
            expect(seen.size).toBeGreaterThan(0);
            return [...seen];
        };

        it('reports funnel placements to a funnel label styler', async () => {
            const seen = await styledPlacements('funnel', FUNNEL_PLACEMENTS);
            expect(seen.every((placement) => FUNNEL_PLACEMENTS.includes(placement))).toBe(true);
        });

        it('reports pyramid placements to a pyramid label styler', async () => {
            const seen = await styledPlacements('pyramid', FUNNEL_PLACEMENTS, { direction: 'vertical' });
            expect(seen.every((placement) => FUNNEL_PLACEMENTS.includes(placement))).toBe(true);
        });

        it('reports cone-funnel placements to a cone-funnel label styler', async () => {
            const seen = await styledPlacements('cone-funnel', ['start-center', 'end-center']);
            expect(seen.every((placement) => CONE_FUNNEL_PLACEMENT.test(placement))).toBe(true);
        });
    });

    /**
     * Map labels resolve one series-wide style (their styler takes no datum), so a disabled label is known
     * before the label data is built and must be left out of it — hiding it at render time alone would
     * leave it reserving placement space and displacing its neighbours.
     */
    describe('map-marker', () => {
        const mapMarkerChart = (label: object) => ({
            series: [
                {
                    type: 'map-marker',
                    data: [
                        { name: 'One', lat: 10, lon: 10 },
                        { name: 'Two', lat: 10.5, lon: 10.5 },
                    ],
                    latitudeKey: 'lat',
                    longitudeKey: 'lon',
                    labelKey: 'name',
                    label: { enabled: true, ...label },
                },
            ],
        });

        it('reserves no placement for a label its styler disabled', async () => {
            await render(mapMarkerChart({ itemStyler: () => ({ enabled: false }) }));
            expect(visibleLabels()).toHaveLength(0);
            expect(placementLabelData()).toHaveLength(0);
        });

        it('still reserves placement for a label its styler leaves enabled', async () => {
            await render(mapMarkerChart({ itemStyler: () => ({}) }));
            expect(placementLabelData().length).toBeGreaterThan(0);
        });
    });
});
