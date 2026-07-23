import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';
import {
    type PlacedLabelGeometry,
    compareImageSnapshot,
    deproxy,
    expectPixelIdenticalAcrossUpdate,
    setupMockCanvas,
    setupMockConsole,
    topLabelAnchorGap,
    waitForChartStability,
} from 'ag-charts-community-test';

import { createEnterpriseChart, prepareEnterpriseTestOptions } from '../test/utils';
import { ukRoadData } from './map-test/ukRoadData';
import ukRoadTopology from './map-test/ukRoadTopology.json';
import ukTopology from './map-test/ukTopology.json';

// Consolidated placement/collision coverage for enterprise series. Collision resolution always runs;
// `collideWith` within `label.collision` is undocumented, so option objects that use it are built
// untyped and cast at the AgCharts.create boundary.
describe('label collision avoidance', () => {
    setupMockConsole();

    let chart: any;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const renderAndSnapshot = async (options: object) => {
        prepareEnterpriseTestOptions(options as AgChartOptions);
        chart = deproxy(AgCharts.create(options as AgChartOptions));
        await compareImageSnapshot(chart, ctx);
    };

    // A tight cluster of lat/lon markers (projection fixed by the UK background) forces overlapping
    // labels, so placement candidates always resolve real collisions; `suppressHide` only decides the
    // terminal outcome for a label that fails every candidate.
    describe('map-marker', () => {
        // 4x4 grid of points within a ~1° box; at the UK-wide projection they land in a small pixel
        // region, so their labels overlap heavily.
        const collisionData = Array.from({ length: 16 }, (_, i) => ({
            name: `Site ${i + 1}`,
            lat: 51.5 + (i % 4) * 0.3,
            lon: -1.5 + Math.floor(i / 4) * 0.3,
        }));
        const markerOptions = (config: object) => ({
            topology: ukTopology,
            series: [
                { type: 'map-shape-background' },
                {
                    type: 'map-marker',
                    data: collisionData,
                    latitudeKey: 'lat',
                    longitudeKey: 'lon',
                    labelKey: 'name',
                    label: { enabled: true, placement: ['top', 'right', 'left', 'bottom'], ...config },
                },
            ],
        });

        it('reposition overlapping labels around the candidate list (suppressHide: false, default)', async () => {
            await renderAndSnapshot(markerOptions({}));
        });

        it('keeps a label that fails every candidate visible when suppressHide is true', async () => {
            await renderAndSnapshot(markerOptions({ collision: { suppressHide: true } }));
        });

        // `label.spacing` is the gap between a marker-based label and its anchor; a larger value pushes
        // the label further from the marker. A single isolated marker so its 'top' label never collides.
        const singleMarker = (spacing: number) =>
            ({
                topology: ukTopology,
                series: [
                    { type: 'map-shape-background' },
                    {
                        type: 'map-marker',
                        data: [{ name: 'Site', lat: 52, lon: -1.5 }],
                        latitudeKey: 'lat',
                        longitudeKey: 'lon',
                        labelKey: 'name',
                        label: { enabled: true, placement: 'top', spacing },
                    },
                ],
            }) as AgChartOptions;

        const anchorGap = async (spacing: number) => {
            chart?.destroy();
            chart = await createEnterpriseChart(singleMarker(spacing));
            const series = chart.series.find((s: any) => s.type === 'map-marker') as unknown as PlacedLabelGeometry;
            return topLabelAnchorGap(series);
        };

        it('a larger label.spacing widens the gap between a map-marker label and its anchor', async () => {
            const near = await anchorGap(5);
            const far = await anchorGap(40);
            expect(far).toBeGreaterThan(near);
            expect(far - near).toBeCloseTo(35, 0);
        });
    });

    // Map-line labels centre on the line (no directional placement), so collision resolution only ever
    // decides whether an overlapping label is hidden or kept.
    describe('map-line', () => {
        const lineOptions = (config: object) => ({
            topology: ukRoadTopology,
            data: ukRoadData,
            series: [
                {
                    type: 'map-line',
                    idKey: 'name',
                    labelKey: 'name',
                    // Large bold labels so neighbouring route names genuinely overlap, forcing the
                    // collision pass to drop some by default (and keep them all with suppressHide: true).
                    label: { enabled: true, fontSize: 24, fontWeight: 'bold', ...config },
                },
            ],
        });

        it('drops overlapping route labels (suppressHide: false, default)', async () => {
            await renderAndSnapshot(lineOptions({}));
        });

        it('keeps every overlapping route label when suppressHide is true', async () => {
            await renderAndSnapshot(lineOptions({ collision: { suppressHide: true } }));
        });
    });

    // Bar-family `placement` was widened to accept an ordered array, but the bar candidate-fallback
    // engine is not yet wired. Until then a supplied array must be inert-safe: the first candidate is
    // used, matching the single-value render, with no error raised.
    describe('bar-family placement (widened type, fallback not yet wired)', () => {
        it('waterfall renders an array placement identically to its first candidate', async () => {
            const options = (placement: string | string[]): AgChartOptions => ({
                data: [
                    { year: '2020', spending: 10 },
                    { year: '2021', spending: -20 },
                    { year: '2022', spending: 30 },
                ],
                series: [
                    {
                        type: 'waterfall',
                        xKey: 'year',
                        yKey: 'spending',
                        item: {
                            positive: { label: { enabled: true, placement } },
                            negative: { label: { enabled: true, placement } },
                            total: { label: { enabled: true, placement } },
                        },
                    } as never,
                ],
            });
            await expectPixelIdenticalAcrossUpdate(
                ctx,
                createEnterpriseChart,
                options('inside-end'),
                options(['inside-end', 'outside-end'])
            );
        });

        const rangeData = [
            { x: 'A', low: 2, high: 8 },
            { x: 'B', low: 3, high: 9 },
            { x: 'C', low: 1, high: 7 },
        ];
        const rangeAxes = {
            x: { type: 'category', position: 'bottom' },
            y: { type: 'number', position: 'left' },
        };

        it('range-bar renders an array placement identically to its first candidate', async () => {
            const options = (placement: string | string[]): AgChartOptions => ({
                data: rangeData,
                axes: rangeAxes as never,
                series: [
                    {
                        type: 'range-bar',
                        xKey: 'x',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        label: { enabled: true, placement },
                    } as never,
                ],
            });
            await expectPixelIdenticalAcrossUpdate(
                ctx,
                createEnterpriseChart,
                options('outside'),
                options(['outside', 'inside'])
            );
        });

        it('range-area renders an array placement identically to its first candidate', async () => {
            const options = (placement: string | string[]): AgChartOptions => ({
                data: rangeData,
                axes: rangeAxes as never,
                series: [
                    {
                        type: 'range-area',
                        xKey: 'x',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        label: { enabled: true, placement },
                    } as never,
                ],
            });
            await expectPixelIdenticalAcrossUpdate(
                ctx,
                createEnterpriseChart,
                options('outside'),
                options(['outside', 'inside'])
            );
        });
    });

    // `label.orientation` rotates bar-family labels along/across the bar's length. Coverage across the
    // enterprise bar-family series; the `horizontal`/`vertical` distinction is what varies.
    describe('bar-family label orientation', () => {
        const orientations = ['horizontal', 'vertical', 'vertical-reversed'];
        const rangeData = [
            { x: 'A', low: 2, high: 8 },
            { x: 'B', low: 3, high: 9 },
            { x: 'C', low: 1, high: 7 },
        ];
        const rangeAxes = {
            x: { type: 'category', position: 'bottom' },
            y: { type: 'number', position: 'left' },
        };

        for (const orientation of orientations) {
            it(`waterfall renders labels with orientation '${orientation}'`, async () => {
                await renderAndSnapshot({
                    data: [
                        { year: '2020', spending: 10 },
                        { year: '2021', spending: -20 },
                        { year: '2022', spending: 30 },
                    ],
                    series: [
                        {
                            type: 'waterfall',
                            xKey: 'year',
                            yKey: 'spending',
                            item: {
                                positive: { label: { enabled: true, orientation } },
                                negative: { label: { enabled: true, orientation } },
                                total: { label: { enabled: true, orientation } },
                            },
                        },
                    ],
                });
            });

            it(`range-bar renders labels with orientation '${orientation}'`, async () => {
                await renderAndSnapshot({
                    data: rangeData,
                    axes: rangeAxes,
                    series: [
                        {
                            type: 'range-bar',
                            xKey: 'x',
                            yLowKey: 'low',
                            yHighKey: 'high',
                            label: { enabled: true, orientation },
                        },
                    ],
                });
            });
        }

        // Orientation array fall-through for waterfall (inside-center, so the fit region is the bar rect):
        // tall, thin bars whose long upright (horizontal) label overflows the bar width fall through to
        // vertical for every bar, matching a fixed vertical orientation. Alternating deltas keep
        // the bars tall so the vertical candidate fits the bar height.
        it('waterfall falls through to vertical when the horizontal label overflows a thin bar', async () => {
            const thinWaterfall = (orientation: string | string[]) => {
                const label = { enabled: true, placement: 'inside-center', orientation, formatter: () => 'WWWWWWWWWW' };
                return {
                    data: Array.from({ length: 12 }, (_, i) => ({ year: `Y${i}`, spending: i % 2 === 0 ? 100 : -100 })),
                    series: [
                        {
                            type: 'waterfall',
                            xKey: 'year',
                            yKey: 'spending',
                            item: { positive: { label }, negative: { label }, total: { label } },
                        },
                    ],
                };
            };
            await expectPixelIdenticalAcrossUpdate(
                ctx,
                createEnterpriseChart,
                thinWaterfall(['horizontal', 'vertical']) as any,
                thinWaterfall('vertical') as any
            );
        });

        // Range-bar carries two labels (low + high) per node, each anchored at a bar end. An inside
        // orientation array resolves against the bar rect and the resolved label is slid flush inside
        // it, so neither end label straddles or overflows the bar. Coverage of the dual-label seam.
        it('range-bar resolves an inside-placement orientation array against the bar rect', async () => {
            await renderAndSnapshot({
                data: Array.from({ length: 10 }, (_, i) => ({ x: `C${i}`, low: 0, high: 100 })),
                axes: rangeAxes,
                series: [
                    {
                        type: 'range-bar',
                        xKey: 'x',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        label: {
                            enabled: true,
                            placement: 'inside',
                            orientation: ['horizontal', 'vertical'],
                            formatter: () => 'WWWWWWWWWW',
                        },
                    },
                ],
            });
        });
    });

    describe('cross-series obstacles (baked range-bar labels vs scatter label)', () => {
        type Box = { x: number; y: number; width: number; height: number };
        const overlaps = (a: Box, b: Box) =>
            a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

        // Range-bar A spans low 2 to high 8, baking a label at each end. The HIT scatter point sits just
        // below the low label so its `top` candidate lands on it; the rest are clear.
        const rangeData = [
            { x: 'A', low: 2, high: 8 },
            { x: 'B', low: 3, high: 7 },
            { x: 'C', low: 1, high: 9 },
        ];
        const scatterData = [
            { x: 'A', y: 1.9, name: 'HIT' },
            { x: 'B', y: 5, name: 'S1' },
        ];

        const visibleLabelBoxes = (series: {
            labelSelection: { nodes(): { visible: boolean; computeBBox(): Box | undefined }[] };
        }) =>
            series.labelSelection
                .nodes()
                .filter((node) => node.visible)
                .map((node) => node.computeBBox())
                .filter((box): box is Box => box != null);

        const options = (): any => ({
            legend: { enabled: false },
            axes: { x: { type: 'category' }, y: { type: 'number' } },
            series: [
                {
                    type: 'range-bar',
                    xKey: 'x',
                    yLowKey: 'low',
                    yHighKey: 'high',
                    data: rangeData,
                    label: { enabled: true, collision: { suppressHide: true } },
                },
                {
                    type: 'scatter',
                    xKey: 'x',
                    yKey: 'y',
                    labelKey: 'name',
                    data: scatterData,
                    label: {
                        enabled: true,
                        placement: ['top', 'bottom'],
                        collision: { suppressHide: false },
                    },
                },
            ],
        });

        it('renders with the scatter label cleared off the range-bar labels', async () => {
            await renderAndSnapshot(options());
        });

        it('drops a hideable scatter label overlapping a range-bar baked label', async () => {
            const opts = options();
            prepareEnterpriseTestOptions(opts);
            chart = deproxy(AgCharts.create(opts));
            await waitForChartStability(chart);
            const [rangeBar, scatter] = chart.series as unknown as Parameters<typeof visibleLabelBoxes>[0][];
            const rangeBarBoxes = visibleLabelBoxes(rangeBar);
            const scatterBoxes = visibleLabelBoxes(scatter);
            // Anti-vacuous guards: both series must render labels for the invariant to mean anything.
            expect(rangeBarBoxes.length).toBeGreaterThan(0);
            expect(scatterBoxes.length).toBeGreaterThan(0);
            // A hideable scatter label must never remain visible on top of a range-bar's baked label
            // (this covers both the low and high end labels contributed to the obstacle index).
            for (const rangeBarBox of rangeBarBoxes) {
                for (const scatterBox of scatterBoxes) {
                    expect(overlaps(rangeBarBox, scatterBox)).toBe(false);
                }
            }
        });
    });
});
