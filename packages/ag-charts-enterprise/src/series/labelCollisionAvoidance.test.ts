import { afterEach, describe, it } from 'vitest';

import type { AgChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';
import {
    compareImageSnapshot,
    deproxy,
    expectPixelIdenticalAcrossUpdate,
    setupMockCanvas,
    setupMockConsole,
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
});
