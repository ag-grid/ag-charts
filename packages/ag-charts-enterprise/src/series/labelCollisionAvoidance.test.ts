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

    type Box = { x: number; y: number; width: number; height: number };
    const overlaps = (a: Box, b: Box) =>
        a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

    const renderAndSnapshot = async (options: object) => {
        prepareEnterpriseTestOptions(options as AgChartOptions);
        chart = deproxy(AgCharts.create(options as AgChartOptions));
        await compareImageSnapshot(chart, ctx);
    };

    const visibleLabelCount = () => {
        const series = chart.series[0] as unknown as { labelSelection: { nodes(): { visible: boolean }[] } };
        return series.labelSelection.nodes().filter((node) => node.visible).length;
    };

    // Renders a placement-cascade options factory and returns how many labels stayed visible.
    const renderPlacementCount = async (
        makeOptions: (collision: object, placement?: string | string[]) => object,
        collision: object,
        placement?: string | string[]
    ) => {
        const opts = makeOptions(collision, placement);
        prepareEnterpriseTestOptions(opts as AgChartOptions);
        chart = deproxy(AgCharts.create(opts as AgChartOptions));
        await waitForChartStability(chart);
        return visibleLabelCount();
    };

    // A tight cluster of lat/lon markers (projection fixed by the UK background) forces overlapping
    // labels, so placement candidates always resolve real collisions; `alwaysShow` only decides the
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

        it('reposition overlapping labels around the candidate list (alwaysShow: false)', async () => {
            await renderAndSnapshot(markerOptions({ collision: { alwaysShow: false } }));
        });

        it('keeps a label that fails every candidate visible when alwaysShow is true', async () => {
            await renderAndSnapshot(markerOptions({ collision: { alwaysShow: true } }));
        });

        // The theme default is `collision.alwaysShow: false` (map-marker hides on collision), so a chart
        // with no explicit `collision` option must behave exactly like the explicit `alwaysShow: false` case.
        it('hides overlapping labels by default, matching the explicit alwaysShow: false count', async () => {
            const render = async (config: object) => {
                chart?.destroy();
                const opts = markerOptions(config);
                prepareEnterpriseTestOptions(opts as AgChartOptions);
                chart = deproxy(AgCharts.create(opts as AgChartOptions));
                await waitForChartStability(chart);
                const series = chart.series.find((s: any) => s.type === 'map-marker') as unknown as {
                    labelSelection: { nodes(): { visible: boolean }[] };
                };
                return series.labelSelection.nodes().filter((node) => node.visible).length;
            };

            const defaultVisible = await render({});
            // Anti-vacuous guard: the dense cluster must actually force some labels to hide.
            expect(defaultVisible).toBeLessThan(collisionData.length);

            const explicitVisible = await render({ collision: { alwaysShow: false } });
            expect(defaultVisible).toBe(explicitVisible);
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
                    // collision pass to drop some when hideable (and keep them all with alwaysShow: true).
                    label: { enabled: true, fontSize: 24, fontWeight: 'bold', ...config },
                },
            ],
        });

        it('drops overlapping route labels (alwaysShow: false)', async () => {
            await renderAndSnapshot(lineOptions({ collision: { alwaysShow: false } }));
        });

        it('keeps every overlapping route label when alwaysShow is true', async () => {
            await renderAndSnapshot(lineOptions({ collision: { alwaysShow: true } }));
        });

        // The theme default is `collision.alwaysShow: false` (map-line hides on collision), so a chart
        // with no explicit `collision` option must behave exactly like the explicit `alwaysShow: false` case.
        it('drops overlapping route labels by default, matching the explicit alwaysShow: false count', async () => {
            const render = async (config: object) => {
                chart?.destroy();
                const opts = lineOptions(config);
                prepareEnterpriseTestOptions(opts as AgChartOptions);
                chart = deproxy(AgCharts.create(opts as AgChartOptions));
                await waitForChartStability(chart);
                return visibleLabelCount();
            };

            const defaultVisible = await render({});
            // Anti-vacuous guard: the bold, large route labels must actually force some to hide.
            expect(defaultVisible).toBeLessThan(ukRoadData.length);

            const explicitVisible = await render({ collision: { alwaysShow: false } });
            expect(defaultVisible).toBe(explicitVisible);
        });
    });

    // A `placement` array is an ordered fallback list: the first candidate that clears its obstacles wins,
    // so an array whose first candidate already fits renders identically to that single placement.
    describe('bar-family placement cascade (first fitting candidate wins)', () => {
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
                    label: { enabled: true, collision: { alwaysShow: true } },
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
                        collision: { alwaysShow: false },
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

    describe('waterfall placement cascade and own-label hiding', () => {
        // A single positive bar filling the value axis; its `outside-end` label overflows the series area
        // into the padding band, so a hideable single-placement label is dropped when series-area
        // avoidance is on, while a placement array cascades to an inside candidate that fits.
        const options = (collision: object, placement: string | string[] = 'outside-end'): any => ({
            data: [{ x: 'A', y: 10 }],
            legend: { enabled: false },
            padding: { top: 100, right: 10, bottom: 10, left: 10 },
            axes: { x: { type: 'category' }, y: { type: 'number', min: 0, max: 10 } },
            series: [
                {
                    type: 'waterfall',
                    xKey: 'x',
                    yKey: 'y',
                    item: { positive: { label: { enabled: true, placement, collision } } },
                },
            ],
        });

        it('drops a hideable outside label overflowing the series area', async () => {
            expect(await renderPlacementCount(options, { alwaysShow: false, collideWith: { seriesArea: true } })).toBe(
                0
            );
        });

        it('keeps the same label when it is not hideable (alwaysShow: true)', async () => {
            expect(await renderPlacementCount(options, { alwaysShow: true, collideWith: { seriesArea: true } })).toBe(
                1
            );
        });

        it('cascades a hideable outside label to an inside placement that fits', async () => {
            // The single `outside-end` label above hides (0); the array falls through to `inside-center`,
            // which fits inside the tall bar, so the label is kept even though `alwaysShow` is false.
            expect(
                await renderPlacementCount(options, { alwaysShow: false, collideWith: { seriesArea: true } }, [
                    'outside-end',
                    'inside-center',
                ])
            ).toBe(1);
        });

        // With an `['inside-center', ...]` cascade that has a non-inside fallback, a label too large to fit
        // inside the bar must keep its full text and cascade to the outside fallback rather than being
        // truncated to the bar and pinned inside. (Only an inside-only placement binds the text to the bar.)
        it('keeps full text and cascades an oversized inside-first label to the outside fallback', async () => {
            // A very short bar whose long label cannot fit inside. Without the fix the label is fitted to the
            // tiny inside container and dropped; with it, full text cascades to the outside fallback.
            const opts: any = {
                data: [{ x: 'A', y: 1 }],
                legend: { enabled: false },
                padding: { top: 100, right: 100, bottom: 10, left: 100 },
                axes: { x: { type: 'category' }, y: { type: 'number', min: 0, max: 100 } },
                series: [
                    {
                        type: 'waterfall',
                        xKey: 'x',
                        yKey: 'y',
                        item: {
                            positive: {
                                label: {
                                    enabled: true,
                                    formatter: () => 'WWWWWWWWWWWWWWWWWWWW',
                                    placement: ['inside-center', 'outside-end'],
                                    collision: { alwaysShow: false },
                                },
                            },
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(opts);
            chart = deproxy(AgCharts.create(opts));
            await waitForChartStability(chart);
            const series = chart.series[0] as unknown as {
                labelSelection: { nodes(): { visible: boolean; datum: { label?: { placement?: string } } }[] };
            };
            const labels = series.labelSelection.nodes().filter((node) => node.visible);
            expect(labels).toHaveLength(1);
            expect(labels[0].datum.label?.placement).toBe('outside-end');
        });

        // The short bars keep the `outside-end` label above the bar; the full-height bar whose
        // `outside-end` overflows the top series area cascades to `inside-center`; the total bar carries
        // a label too wide to fit inside, which the two cases below resolve differently.
        const multiBarCascade = (label: object) => {
            const barLabel = {
                enabled: true,
                placement: ['outside-end', 'inside-center'],
                collision: { alwaysShow: false, collideWith: { seriesArea: true } },
                ...label,
            };
            return {
                data: [
                    { year: 'Y0', spending: 3 },
                    { year: 'Y1', spending: 3 },
                    { year: 'Y2', spending: 4 },
                ],
                legend: { enabled: false },
                padding: { top: 60, right: 10, bottom: 10, left: 10 },
                axes: { x: { type: 'category' }, y: { type: 'number', min: 0, max: 10 } },
                series: [
                    {
                        type: 'waterfall',
                        xKey: 'year',
                        yKey: 'spending',
                        totals: [{ totalType: 'total', index: 2, axisLabel: 'Total' }],
                        item: {
                            positive: { label: barLabel },
                            negative: { label: barLabel },
                            total: { label: { ...barLabel, formatter: () => 'WWWWWWWWWWWWWWWWWWWW' } },
                        },
                    },
                ],
            };
        };

        // A placement array turns truncation on, so the total's oversized label is ellipsised into the
        // candidate that keeps the most of it rather than dropped.
        it('renders outside, cascaded-inside and dropped labels across a multi-bar chart', async () => {
            await renderAndSnapshot(multiBarCascade({}));
        });

        // Opting out of truncation leaves nothing to fall back on: every candidate for the oversized
        // label overflows at full text, so it is dropped instead.
        it('drops rather than truncates the oversized label when truncate is off', async () => {
            await renderAndSnapshot(multiBarCascade({ truncate: false }));
        });
    });

    // A range bar carries an independent label at each value end (low, high). With a placement array each
    // end cascades on its own, so only the end whose candidates all collide is hidden or repositioned.
    describe('range-bar per-label placement cascade and hiding', () => {
        // The bar's high end sits at the axis max, so its `outside` label overflows the top series-area
        // padding band; the low end sits mid-plot with room, so its `outside` label clears it.
        const options = (collision: object, placement: string | string[] = 'outside'): any => ({
            data: [{ x: 'A', low: 2, high: 10 }],
            legend: { enabled: false },
            padding: { top: 100, right: 10, bottom: 10, left: 10 },
            axes: { x: { type: 'category' }, y: { type: 'number', min: 0, max: 10 } },
            series: [
                {
                    type: 'range-bar',
                    xKey: 'x',
                    yLowKey: 'low',
                    yHighKey: 'high',
                    label: { enabled: true, placement, collision },
                },
            ],
        });

        it('drops only the colliding high-end label, keeping the low-end label', async () => {
            expect(await renderPlacementCount(options, { alwaysShow: false, collideWith: { seriesArea: true } })).toBe(
                1
            );
        });

        it('keeps both labels when not hideable (alwaysShow: true)', async () => {
            expect(await renderPlacementCount(options, { alwaysShow: true, collideWith: { seriesArea: true } })).toBe(
                2
            );
        });

        it('cascades the colliding high-end label to an inside placement, keeping both', async () => {
            // Only the high end overflows: it falls through to `inside`, while the low end stays outside.
            expect(
                await renderPlacementCount(options, { alwaysShow: false, collideWith: { seriesArea: true } }, [
                    'outside',
                    'inside',
                ])
            ).toBe(2);
        });

        // Each bar carries an independent low and high label. One render covering every outcome: bar A
        // keeps both labels `outside` (room above the high end and below the low end); bar B's high end
        // reaches the axis top so its overflowing `outside` label cascades to `inside`, while its low
        // label stays outside; bar C's high label is too wide to fit inside and is dropped.
        const multiBarCascade = (label: object) => ({
            data: [
                { x: 'A', low: 2, high: 6 },
                { x: 'B', low: 1, high: 10 },
                { x: 'C', low: 1, high: 10 },
            ],
            legend: { enabled: false },
            padding: { top: 60, right: 10, bottom: 10, left: 10 },
            axes: { x: { type: 'category' }, y: { type: 'number', min: 0, max: 10 } },
            series: [
                {
                    type: 'range-bar',
                    xKey: 'x',
                    yLowKey: 'low',
                    yHighKey: 'high',
                    label: {
                        enabled: true,
                        // Range-bar labels default to white (usually drawn inside the bar); force a dark
                        // colour so the outside labels are legible against the plot background too.
                        color: 'black',
                        formatter: ({ datum }: any) => (datum.x === 'C' ? 'WWWWWWWWWWWWWWWWWWWW' : undefined),
                        placement: ['outside', 'inside'],
                        collision: { alwaysShow: false, collideWith: { seriesArea: true } },
                        ...label,
                    },
                },
            ],
        });

        // A placement array turns truncation on, so bar C's oversized high label is ellipsised into the
        // candidate that keeps the most of it rather than dropped.
        it('renders outside, cascaded-inside and dropped labels across a multi-bar chart', async () => {
            await renderAndSnapshot(multiBarCascade({}));
        });

        // Opting out of truncation leaves nothing to fall back on: every candidate for that label
        // overflows at full text, so it is dropped instead.
        it('drops rather than truncates the oversized label when truncate is off', async () => {
            await renderAndSnapshot(multiBarCascade({ truncate: false }));
        });
    });

    describe('range-bar sibling-label collision (shared bar rect)', () => {
        const visibleLabels = (series: {
            labelSelection: {
                nodes(): { visible: boolean; datum: { placement?: string }; computeBBox(): Box | undefined }[];
            };
        }) =>
            series.labelSelection
                .nodes()
                .filter((node) => node.visible)
                .map((node) => ({ placement: node.datum.placement, box: node.computeBBox() }))
                .filter((label): label is { placement: string | undefined; box: Box } => label.box != null);

        // A single short bar (low 48, high 52 on a 0-100 axis) whose two end labels cannot both fit inside
        // the bar rect. With `placement: ['inside', 'outside']` and hideable labels, neither label may be
        // dropped for failing to fit inside (both can escape outside), and the second-placed label must
        // treat its already-placed sibling — sharing the one bar rect — as an obstacle and cascade outside.
        it('cascades one sibling label outside instead of dropping or overlapping it inside', async () => {
            const opts: any = {
                data: [{ x: 'A', low: 48, high: 52 }],
                legend: { enabled: false },
                axes: { x: { type: 'category' }, y: { type: 'number', min: 0, max: 100 } },
                series: [
                    {
                        type: 'range-bar',
                        xKey: 'x',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        label: { enabled: true, placement: ['inside', 'outside'], collision: { alwaysShow: false } },
                    },
                ],
            };
            prepareEnterpriseTestOptions(opts);
            chart = deproxy(AgCharts.create(opts));
            await waitForChartStability(chart);
            const series = chart.series[0] as unknown as Parameters<typeof visibleLabels>[0];
            const labels = visibleLabels(series);
            // Anti-vacuous guard: both end labels must stay visible (neither hidden for failing inside).
            expect(labels.length).toBe(2);
            expect(overlaps(labels[0].box, labels[1].box)).toBe(false);
            // Exactly one end cascades outside; the other stays inside.
            expect(labels.filter((l) => l.placement?.startsWith('outside'))).toHaveLength(1);
        });

        // Visual coverage with default styling (no `color`, default `alwaysShow`): three short bars whose
        // two end labels collide inside. With `placement: ['inside', 'outside']` one label per bar renders
        // outside the bar to avoid the sibling, rather than being hidden — and the outside label picks up
        // the legible `outsideStyle` colour (dark on the background) while the inside label stays white.
        it('renders one label per short bar outside to avoid the inside collision', async () => {
            await renderAndSnapshot({
                data: [
                    { x: 'A', low: 44, high: 50 },
                    { x: 'B', low: 47, high: 53 },
                    { x: 'C', low: 50, high: 56 },
                ],
                legend: { enabled: false },
                padding: { top: 40, right: 40, bottom: 20, left: 40 },
                axes: { x: { type: 'category' }, y: { type: 'number', min: 0, max: 100 } },
                series: [
                    {
                        type: 'range-bar',
                        xKey: 'x',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        label: { enabled: true, placement: ['inside', 'outside'] },
                    },
                ],
            });
        });
    });

    describe('range-bar reversed value axis', () => {
        // A reversed value axis puts the low value at the top of the bar and the high value at the bottom,
        // so the low label must render above the high label. Covers both the baked path (single inside
        // placement) and the placement-cascade path.
        const reversedLabelEnds = async (label: object) => {
            const opts: any = {
                data: [{ x: 'A', low: 2, high: 8 }],
                legend: { enabled: false },
                padding: { top: 60, right: 40, bottom: 60, left: 40 },
                axes: { x: { type: 'category' }, y: { type: 'number', min: 0, max: 10, reverse: true } },
                series: [{ type: 'range-bar', xKey: 'x', yLowKey: 'low', yHighKey: 'high', label }],
            };
            prepareEnterpriseTestOptions(opts);
            chart = deproxy(AgCharts.create(opts));
            await waitForChartStability(chart);
            const series = chart.series[0] as unknown as {
                labelSelection: {
                    nodes(): { visible: boolean; datum: { itemType: string }; computeBBox(): Box | undefined }[];
                };
            };
            const nodes = series.labelSelection.nodes().filter((node) => node.visible);
            const low = nodes.find((node) => node.datum.itemType === 'low')?.computeBBox();
            const high = nodes.find((node) => node.datum.itemType === 'high')?.computeBBox();
            return { low, high };
        };

        it('places the low label above the high label (baked inside placement)', async () => {
            const { low, high } = await reversedLabelEnds({ enabled: true, placement: 'inside' });
            expect(low).toBeDefined();
            expect(high).toBeDefined();
            expect(low!.y).toBeLessThan(high!.y);
        });

        it('places the low label above the high label (placement cascade)', async () => {
            const { low, high } = await reversedLabelEnds({
                enabled: true,
                placement: ['outside', 'inside'],
                collision: { alwaysShow: false },
            });
            expect(low).toBeDefined();
            expect(high).toBeDefined();
            expect(low!.y).toBeLessThan(high!.y);
        });
    });

    // Range-area labels are point-anchored on the low and high strokes, so they resolve through the
    // compass placement engine: the coarse `outside`/`inside` vocabulary maps per datum onto the
    // direction that faces away from / into the band.
    describe('range-area label placement', () => {
        type LabelNode = {
            visible: boolean;
            datum: { itemType: string; placement?: string; valueSide: string };
            computeBBox(): Box | undefined;
        };
        /** A visible label node's resolved placement, band side, and rendered box. */
        type PlacedLabelInfo = { placement?: string; side: string; box: Box };
        /** Range-area's engine output, in the plot-local coordinates its anchor points also use. */
        type RangeAreaPlacedLabel = {
            y: number;
            height: number;
            placement?: string;
            datum: { itemType: string; point: { y: number } };
        };
        const placedLabelData = (): RangeAreaPlacedLabel[] => chart.series[0].placedLabelData;

        const placedLabels = async (options: object): Promise<PlacedLabelInfo[]> => {
            chart?.destroy();
            const opts = options as AgChartOptions;
            prepareEnterpriseTestOptions(opts);
            chart = deproxy(AgCharts.create(opts));
            await waitForChartStability(chart);
            const series = chart.series[0] as unknown as { labelSelection: { nodes(): LabelNode[] } };
            const labels: PlacedLabelInfo[] = [];
            for (const node of series.labelSelection.nodes()) {
                const box = node.visible ? node.computeBBox() : undefined;
                if (box != null) {
                    labels.push({ placement: node.datum.placement, side: node.datum.valueSide, box });
                }
            }
            return labels;
        };

        const narrowBand = (label: object) => ({
            data: [{ x: 'A', low: 46, high: 54 }],
            legend: { enabled: false },
            padding: { top: 40, right: 40, bottom: 20, left: 40 },
            axes: { x: { type: 'category' }, y: { type: 'number', min: 0, max: 100 } },
            series: [{ type: 'range-area', xKey: 'x', yLowKey: 'low', yHighKey: 'high', label }],
        });

        // A band too narrow for both end labels to sit inside it. With `placement: ['inside', 'outside']`
        // the second-placed label must treat its already-placed sibling as an obstacle and cascade
        // outside, rather than overlapping it or being dropped.
        it('cascades one sibling label outside instead of dropping or overlapping it inside', async () => {
            const labels = await placedLabels(
                narrowBand({ enabled: true, placement: ['inside', 'outside'], collision: { alwaysShow: false } })
            );
            // Anti-vacuous guard: both end labels stay visible (neither hidden for failing inside).
            expect(labels).toHaveLength(2);
            expect(overlaps(labels[0].box, labels[1].box)).toBe(false);
            // Both resolved a vertical placement, and exactly one of them cascaded outside.
            expect(labels.filter((l) => l.placement === 'bottom' || l.placement === 'top')).toHaveLength(2);
            const outside = labels.filter((l) => (l.placement === 'top') === (l.side === 'high'));
            expect(outside).toHaveLength(1);
        });

        // A dense band of long labels: every candidate collides, so `alwaysShow` decides the outcome.
        const crowded = (collision: object) => ({
            data: Array.from({ length: 12 }, (_, i) => ({ x: `Category ${i}`, low: 40 + i, high: 44 + i })),
            legend: { enabled: false },
            axes: { x: { type: 'category' }, y: { type: 'number', min: 0, max: 100 } },
            series: [
                {
                    type: 'range-area',
                    xKey: 'x',
                    yLowKey: 'low',
                    yHighKey: 'high',
                    label: {
                        enabled: true,
                        formatter: () => 'A very long range-area label',
                        placement: ['outside', 'inside'],
                        collision,
                    },
                },
            ],
        });

        it('drops labels that fit nowhere when alwaysShow is false, keeps them when true', async () => {
            const hidden = await placedLabels(crowded({ alwaysShow: false }));
            const kept = await placedLabels(crowded({ alwaysShow: true }));
            expect(hidden.length).toBeLessThan(kept.length);
            expect(kept).toHaveLength(24);
        });

        // `low > high` draws the low value above the high value, so each label's facing side flips: the
        // `high` label of an inverted datum must render below its own stroke, not above it.
        it('places every outside label clear of the band, including on an inverted datum', async () => {
            await placedLabels({
                data: [
                    { x: 'A', low: 20, high: 80 },
                    { x: 'B', low: 80, high: 20 },
                ],
                legend: { enabled: false },
                padding: { top: 40, right: 40, bottom: 20, left: 40 },
                axes: { x: { type: 'category' }, y: { type: 'number', min: 0, max: 100 } },
                series: [
                    {
                        type: 'range-area',
                        xKey: 'x',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        invertedStyle: { enabled: true },
                        label: { enabled: true, placement: 'outside' },
                    },
                ],
            });
            const placed = placedLabelData();
            expect(placed).toHaveLength(4);
            const anchorYs = placed.map((label) => label.datum.point.y);
            const bandMidY = (Math.min(...anchorYs) + Math.max(...anchorYs)) / 2;
            for (const label of placed) {
                const anchorY = label.datum.point.y;
                if (anchorY < bandMidY) {
                    // Upper stroke: the label sits entirely above its anchor.
                    expect(label.placement).toBe('top');
                    expect(label.y + label.height).toBeLessThanOrEqual(anchorY);
                } else {
                    expect(label.placement).toBe('bottom');
                    expect(label.y).toBeGreaterThanOrEqual(anchorY);
                }
            }
            // Anti-vacuous guard: the inverted datum's `high` label is the one on the lower stroke.
            const invertedHigh = placed.filter(
                (label) => label.datum.itemType === 'high' && label.placement === 'bottom'
            );
            expect(invertedHigh).toHaveLength(1);
        });

        // A label sits `gap + spacing` from its anchor, `gap` being the marker radius, so it never
        // lands on its own marker.
        it('offsets an outside label from its marker by the marker radius plus label.spacing', async () => {
            const markerSize = 20;
            const spacing = 12;
            await placedLabels({
                data: [{ x: 'A', low: 20, high: 80 }],
                legend: { enabled: false },
                padding: { top: 60, right: 40, bottom: 20, left: 40 },
                axes: { x: { type: 'category' }, y: { type: 'number', min: 0, max: 100 } },
                series: [
                    {
                        type: 'range-area',
                        xKey: 'x',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        marker: { enabled: true, size: markerSize },
                        label: { enabled: true, placement: 'outside', spacing },
                    },
                ],
            });
            expect(topLabelAnchorGap(chart.series[0] as PlacedLabelGeometry)).toBeCloseTo(markerSize / 2 + spacing, 5);
        });

        it('reports the resolved coarse placement to the label itemStyler', async () => {
            const captured: (string | undefined)[] = [];
            const itemStyler = (params: { placement?: string }) => {
                captured.push(params.placement);
                return {};
            };
            await placedLabels(
                narrowBand({
                    enabled: true,
                    placement: ['inside', 'outside'],
                    collision: { alwaysShow: false },
                    itemStyler,
                })
            );
            expect(new Set(captured)).toEqual(new Set(['inside', 'outside']));
        });

        // The structural tests above assert the placement the engine resolved; these pin what actually
        // renders, so a cascade that reports the right placement but draws in the wrong spot still fails.
        // The first two are a contrast pair over identical data: without a fallback the colliding sibling
        // is dropped, with one it survives outside the band. Each asserts its label distribution first, so
        // no baseline can bake in a render where the fallback silently failed to fire.
        describe('rendered placement fallback', () => {
            // Bands narrow enough that the two end labels cannot both sit inside at the theme's spacing.
            const cascadeBands = (placement: string | string[]) => ({
                data: [
                    { x: 'A', low: 46, high: 54 },
                    { x: 'B', low: 44, high: 56 },
                    { x: 'C', low: 47, high: 53 },
                ],
                legend: { enabled: false },
                padding: { top: 40, right: 40, bottom: 40, left: 40 },
                axes: { x: { type: 'category' }, y: { type: 'number', min: 0, max: 100 } },
                series: [
                    {
                        type: 'range-area',
                        xKey: 'x',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        label: { enabled: true, placement, collision: { alwaysShow: false } },
                    },
                ],
            });
            const isOutside = (l: { placement?: string; side: string }) =>
                (l.placement === 'top') === (l.side === 'high');

            it('drops the colliding sibling label when inside is the only placement', async () => {
                const labels = await placedLabels(cascadeBands('inside'));
                // Two of the six end labels have nowhere to go once their sibling claims the inside slot.
                expect(labels).toHaveLength(4);
                expect(labels.filter(isOutside)).toHaveLength(0);
                await compareImageSnapshot(chart, ctx);
            });

            it('keeps both sibling labels by cascading one outside when a fallback is offered', async () => {
                const labels = await placedLabels(cascadeBands(['inside', 'outside']));
                // Same data as above: the two labels dropped there are recovered outside their bands.
                expect(labels).toHaveLength(6);
                expect(labels.filter(isOutside)).toHaveLength(2);
                await compareImageSnapshot(chart, ctx);
            });

            // Labels too long for either candidate are dropped rather than overlapped, leaving visible gaps.
            it('drops labels whose every placement candidate collides', async () => {
                const labels = await placedLabels({
                    data: Array.from({ length: 8 }, (_, i) => ({ x: `Category ${i}`, low: 42 + i, high: 50 + i })),
                    legend: { enabled: false },
                    padding: { top: 40, right: 40, bottom: 40, left: 40 },
                    axes: { x: { type: 'category' }, y: { type: 'number', min: 0, max: 100 } },
                    series: [
                        {
                            type: 'range-area',
                            xKey: 'x',
                            yLowKey: 'low',
                            yHighKey: 'high',
                            label: {
                                enabled: true,
                                placement: ['outside', 'inside'],
                                formatter: () => 'A very long range-area label',
                                collision: { alwaysShow: false },
                            },
                        },
                    ],
                });
                // All three cascade outcomes must be present, so the render shows each of them: some
                // labels keep `outside`, some fall back to `inside`, and the rest are dropped.
                expect(labels.filter(isOutside).length).toBeGreaterThan(0);
                expect(labels.filter((l) => !isOutside(l)).length).toBeGreaterThan(0);
                expect(labels.length).toBeLessThan(16);
                await compareImageSnapshot(chart, ctx);
            });
        });
    });
});
