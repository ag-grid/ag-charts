import { afterEach, describe, expect, it } from 'vitest';

import {
    getSeriesAt,
    getSeriesContextNodeData,
    getSeriesSelectionNodes,
    getVisibleLabelNodes,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { Group, Selection, Text } from 'ag-charts-core';
import type {
    AgCartesianChartOptions,
    AgChartInstance,
    AgChartOptions,
    AgFunnelSeriesLabelPlacement,
    AgSunburstSeriesOptions,
    AgTreemapSeriesOptions,
} from 'ag-charts-types';

import { createEnterpriseChart, prepareEnterpriseTestOptions } from '../test/utils';

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

    const visibleLabels = (seriesIndex = 0) => getVisibleLabelNodes(chart, seriesIndex);

    /** What the series hands the placement engine: the labels that reserve space and act as obstacles. */
    const placementLabelData = (seriesIndex = 0) => getSeriesAt(chart, seriesIndex).getLabelData();

    describe('range-bar', () => {
        // Bars ~30px deep: an unstyled label fits inside one, a label padded by 20px a side does not.
        const rangeBarChart = (label: object): AgCartesianChartOptions => ({
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
            chart = await createEnterpriseChart(rangeBarChart(label));
            const { labelData } = getSeriesContextNodeData<unknown, { placement?: string; hidden?: boolean }>(chart);
            const drawn = labelData.filter((datum) => datum.hidden !== true);
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
            chart = await createEnterpriseChart(rangeBarChart({ itemStyler: () => ({ enabled: false }) }));
            expect(visibleLabels()).toHaveLength(0);
        });

        /**
         * The orientation-only route bakes the placement rather than letting the engine walk candidates, so
         * a disabled label has to be left out of the label data here or it reserves space and acts as an
         * obstacle while drawing nothing. It takes an explicit `alwaysShow`, since an orientation array
         * otherwise makes the label hideable and routes it through the cascade.
         */
        const orientationOnly = (styler: () => object) =>
            rangeBarChart({
                placement: 'inside',
                orientation: ['horizontal', 'vertical'],
                collision: { alwaysShow: true },
                itemStyler: styler,
            });

        it('reserves no placement for a disabled label on the orientation-only route', async () => {
            chart = await createEnterpriseChart(orientationOnly(() => ({ enabled: false })));
            expect(visibleLabels()).toHaveLength(0);
            expect(placementLabelData()).toHaveLength(0);
        });

        it('still reserves placement for an enabled label on the orientation-only route', async () => {
            chart = await createEnterpriseChart(orientationOnly(() => ({})));
            expect(placementLabelData().length).toBeGreaterThan(0);
        });
    });

    describe('range-area', () => {
        const rangeAreaChart = (label: object): AgCartesianChartOptions => ({
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

        const labelYs = async (options: AgChartOptions) => {
            chart = await createEnterpriseChart(options);
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
            chart = await createEnterpriseChart(rangeAreaChart({ itemStyler: () => ({ enabled: false }) }));
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
        const FUNNEL_PLACEMENTS: AgFunnelSeriesLabelPlacement[] = ['inside-before', 'inside-after'];
        const reportedFunnelPlacements: string[] = FUNNEL_PLACEMENTS;
        const CONE_FUNNEL_PLACEMENT = /^(start|middle|end)-(before|center|after)$/;

        const stages = {
            data: [
                { stage: 'A', value: 9 },
                { stage: 'B', value: 6 },
                { stage: 'C', value: 3 },
            ],
            legend: { enabled: false },
        };
        const keys = { stageKey: 'stage', valueKey: 'value' };

        // The label `itemStyler` that records the placement it is handed and styles nothing.
        type PlacementRecorder = (params: { placement?: unknown }) => object;

        const styledPlacements = async (chartWith: (record: PlacementRecorder) => AgChartOptions) => {
            const seen = new Set<string>();
            const options = chartWith((params) => {
                seen.add(String(params.placement));
                return {};
            });
            chart = await createEnterpriseChart(options);
            expect(placementLabelData().length).toBeGreaterThan(0);
            expect(seen.size).toBeGreaterThan(0);
            // The second pass is the route that resolves a styled box from a placement already mapped into
            // the bar vocabulary, so it must be seen calling the styler in its own right.
            seen.clear();
            await chart.update(prepareEnterpriseTestOptions(options));
            await waitForChartStability(chart);
            expect(placementLabelData().length).toBeGreaterThan(0);
            expect(seen.size).toBeGreaterThan(0);
            return [...seen];
        };

        it('reports funnel placements to a funnel label styler', async () => {
            const seen = await styledPlacements((itemStyler) => ({
                ...stages,
                series: [
                    {
                        type: 'funnel',
                        ...keys,
                        label: { enabled: true, placement: FUNNEL_PLACEMENTS, itemStyler },
                    },
                ],
            }));
            expect(seen.every((placement) => reportedFunnelPlacements.includes(placement))).toBe(true);
        });

        it('reports pyramid placements to a pyramid label styler', async () => {
            const seen = await styledPlacements((itemStyler) => ({
                ...stages,
                series: [
                    {
                        type: 'pyramid',
                        ...keys,
                        direction: 'vertical',
                        label: { enabled: true, placement: FUNNEL_PLACEMENTS, itemStyler },
                    },
                ],
            }));
            expect(seen.every((placement) => reportedFunnelPlacements.includes(placement))).toBe(true);
        });

        it('reports cone-funnel placements to a cone-funnel label styler', async () => {
            const seen = await styledPlacements((itemStyler) => ({
                ...stages,
                series: [
                    {
                        type: 'cone-funnel',
                        ...keys,
                        label: { enabled: true, placement: ['start-center', 'end-center'], itemStyler },
                    },
                ],
            }));
            expect(seen.every((placement) => CONE_FUNNEL_PLACEMENT.test(placement))).toBe(true);
        });
    });

    describe('hierarchy series fit the styled font', () => {
        const label = { fontSize: 10, itemStyler: () => ({ fontSize: 20, lineHeight: 30 }) };
        const hierarchySeries: [string, AgTreemapSeriesOptions | AgSunburstSeriesOptions][] = [
            ['treemap', { type: 'treemap', labelKey: 'name', sizeKey: 'size', tile: { label } }],
            ['sunburst', { type: 'sunburst', labelKey: 'name', sizeKey: 'size', label }],
        ];
        it.each(hierarchySeries)(
            'draws %s labels at the fontSize and lineHeight the styler returns',
            async (_type, series) => {
                chart = await createEnterpriseChart({
                    data: [
                        { name: 'Alpha', size: 3 },
                        { name: 'Bravo', size: 2 },
                    ],
                    series: [series],
                });
                const labels = getSeriesSelectionNodes<Group>(chart, 'labelSelection')
                    .flatMap((group) => Selection.selectByClass(group, Text))
                    .filter((text) => text.visible && text.text != null && text.text !== '');
                expect(labels.length).toBeGreaterThan(0);
                expect(labels.map(({ fontSize, lineHeight }) => ({ fontSize, lineHeight }))).toEqual(
                    labels.map(() => ({ fontSize: 20, lineHeight: 30 }))
                );
            }
        );
    });

    /**
     * Map labels resolve one series-wide style (their styler takes no datum), so a disabled label is known
     * before the label data is built and must be left out of it — hiding it at render time alone would
     * leave it reserving placement space and displacing its neighbours.
     */
    describe('map-marker', () => {
        const mapMarkerChart = (label: object): AgChartOptions => ({
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
            chart = await createEnterpriseChart(mapMarkerChart({ itemStyler: () => ({ enabled: false }) }));
            expect(visibleLabels()).toHaveLength(0);
            expect(placementLabelData()).toHaveLength(0);
        });

        it('still reserves placement for a label its styler leaves enabled', async () => {
            chart = await createEnterpriseChart(mapMarkerChart({ itemStyler: () => ({}) }));
            expect(placementLabelData().length).toBeGreaterThan(0);
        });
    });
});
