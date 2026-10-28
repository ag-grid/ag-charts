import { type MockInstance, afterEach, describe, expect, it, vi } from 'vitest';

import type { AgChartInstance, AgChartOptions, AgDropShadowOptions } from 'ag-charts-community';
import { deproxy, setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';
import { Group } from 'ag-charts-core';

import { type SeriesGroupName, getSeriesGroup } from '../test/enterpriseSeriesAccessors';
import { HIERARCHY_SHADOW_DATA, createEnterpriseChart } from '../test/utils';
import { ukData } from './map-test/ukData';
import ukTopology from './map-test/ukTopology.json';

// A shadow with no blur, so that a pixel is lit by the shadow of a caster or it is not.
const SHADOW: AgDropShadowOptions = { enabled: true, color: 'rgba(0, 0, 0, 0.7)', xOffset: 24, yOffset: 24, blur: 0 };

const RED = [255, 0, 0, 255];

const FLOW_DATA = [
    { from: 'A', to: 'C', size: 8 },
    { from: 'A', to: 'D', size: 4 },
    { from: 'B', to: 'C', size: 5 },
    { from: 'B', to: 'D', size: 7 },
];

const RADAR_DATA = [
    { subject: 'Maths', a: 7, b: 4.2 },
    { subject: 'Physics', a: 4.3, b: 8.5 },
    { subject: 'Biology', a: 3, b: 3 },
    { subject: 'History', a: 6.5, b: 4.3 },
    { subject: 'P.E.', a: 9.8, b: 6.4 },
];

const NIGHTINGALE_DATA = [
    { category: 'A', a: 7, b: 4.2 },
    { category: 'B', a: 4.3, b: 8.5 },
    { category: 'C', a: 3, b: 3 },
    { category: 'D', a: 6.5, b: 4.3 },
];

const STAGES = [
    { group: 'Qualify', value: 7910 },
    { group: 'Develop', value: 8170 },
    { group: 'Propose', value: 7260 },
    { group: 'Close', value: 4460 },
];

const CHART = { animation: { enabled: false }, legend: { enabled: false } };

describe('series that cast their shadows through the shadow root', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance | undefined;
    let rootSpy: MockInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
        // Only the spy: restoring every mock would disarm the console check that setupMockConsole makes after each test.
        rootSpy?.mockRestore();
        rootSpy = undefined;
    });

    const create = async (options: AgChartOptions) => {
        chart?.destroy();
        chart = await createEnterpriseChart({ ...CHART, ...options });
        await waitForChartStability(chart);
        return deproxy(chart);
    };

    const pixels = () => {
        const { canvas } = deproxy(chart!).ctx.scene;
        return Array.from(canvas.context.getImageData(0, 0, canvas.width, canvas.height).data as ArrayLike<number>);
    };

    /** Gathers nothing for the root to cast, so that every group batches its own shadows, as it does without a root. */
    const withoutRoot = () => {
        rootSpy = vi.spyOn(Group.prototype, 'gatherShadowChildren').mockImplementation(() => {});
    };

    /** How the group of a series that is named, which holds the shapes that it casts shadows from, batches them. */
    const batching = (name: SeriesGroupName, seriesIndex = 0) => getSeriesGroup(chart!, name, seriesIndex).batchShadows;

    /**
     * Draws the chart without any shadow, then with the shadow of the series that `build` makes cast. Returns the
     * positions of the pixels that are exactly the opaque `fill` the chart drew without shadows, and what each is
     * after the shadow is cast, so that a test can tell whether the shadow lands on a fill that is beneath it.
     */
    const fillPixelsAfterCasting = async (build: (shadow: AgDropShadowOptions | undefined) => AgChartOptions) => {
        await create(build(undefined));
        const plain = pixels();
        const fills: number[] = [];
        for (let i = 0; i < plain.length; i += 4) {
            if (RED.every((channel, c) => plain[i + c] === channel)) fills.push(i);
        }
        expect(fills.length).toBeGreaterThan(100);

        await create(build(SHADOW));
        const shadowed = pixels();
        expect(shadowed.some((value, i) => value !== plain[i])).toBe(true);
        return fills.map((i) => RED.every((channel, c) => shadowed[i + c] === channel));
    };

    const allRed = (fills: boolean[]) => fills.every(Boolean);

    // A batch of its own and the root blend a shadow over the strokes of the shapes around it a channel value apart.
    // The root casts a translucent fill at one strength, so the shapes compared this way have opaque fills.
    const same = async (options: AgChartOptions, tolerance = 0) => {
        await create(options);
        const through = pixels();
        expect(through.some((value, i) => i % 4 !== 3 && value !== 255)).toBe(true);

        withoutRoot();
        await create(options);
        const local = pixels();
        expect(local).toHaveLength(through.length);
        expect(through.every((value, i) => Math.abs(value - local[i]) <= tolerance)).toBe(true);
    };

    describe('the opt-in', () => {
        it.each([
            ['sankey', 'linkGroup'],
            ['sankey', 'nodeGroup'],
            ['chord', 'linkGroup'],
            ['chord', 'nodeGroup'],
        ] as const)('should cast the shadows of %s through the root, from its %s', async (type, group) => {
            await create({
                data: FLOW_DATA,
                series: [{ type, fromKey: 'from', toKey: 'to', sizeKey: 'size' }],
            } as AgChartOptions);

            expect(batching(group)).toBe('shared');
        });

        it('should batch the shadow of a hovered flow item in the highlight layer, as before', async () => {
            await create({
                data: FLOW_DATA,
                series: [{ type: 'sankey', fromKey: 'from', toKey: 'to', sizeKey: 'size' }],
            } as AgChartOptions);

            expect(batching('focusLinkGroup')).toBe(true);
            expect(batching('focusNodeGroup')).toBe(true);
        });

        it('should cast the shadows of a pyramid through the root', async () => {
            await create({
                data: STAGES,
                series: [{ type: 'pyramid', stageKey: 'group', valueKey: 'value' }],
            } as AgChartOptions);

            expect(batching('itemGroup')).toBe('shared');
        });

        it('should cast the shadows of a radar area through the root', async () => {
            await create({
                data: RADAR_DATA,
                series: [{ type: 'radar-area', angleKey: 'subject', radiusKey: 'a' }],
            } as AgChartOptions);

            expect(batching('areaGroup')).toBe('shared');
        });

        it('should cast the marker shadows of a radar area through the root, as it does its own', async () => {
            await create({
                data: RADAR_DATA,
                series: [{ type: 'radar-area', angleKey: 'subject', radiusKey: 'a' }],
            } as AgChartOptions);

            expect(batching('itemGroup')).toBe('shared');
        });

        it('should cast the shadows of a polar series through the root', async () => {
            await create({
                data: NIGHTINGALE_DATA,
                series: [{ type: 'nightingale', angleKey: 'category', radiusKey: 'a' }],
            } as AgChartOptions);

            expect(batching('itemGroup')).toBe('shared');
        });

        it.each(['donut', 'pie'])('should cast the sector shadows of a %s through the root', async (type) => {
            await create({
                data: NIGHTINGALE_DATA,
                series: [{ type, angleKey: 'a' }],
            } as AgChartOptions);

            expect(batching('itemGroup')).toBe('shared');
        });

        it.each(['funnel', 'cone-funnel'])(
            'should cast the stages and connectors of a %s through the root',
            async (type) => {
                await create({
                    data: STAGES,
                    series: [{ type, stageKey: 'group', valueKey: 'value' }],
                } as AgChartOptions);

                expect(batching('dataNodeGroup')).toBe('shared');
                expect(batching('connectorNodeGroup')).toBe('shared');
            }
        );

        it('should cast the shadows of a map marker through the root', async () => {
            await create({
                data: ukData,
                topology: ukTopology,
                series: [{ type: 'map-marker', idKey: 'name' }],
            } as AgChartOptions);

            expect(batching('markerGroup')).toBe('shared');
        });

        it('should cast the shadows of a map shape through the root', async () => {
            await create({
                data: ukData,
                topology: ukTopology,
                series: [{ type: 'map-shape', idKey: 'name' }],
            } as AgChartOptions);

            expect(batching('itemGroup')).toBe('shared');
        });

        it.each([
            ['radial-bar', { type: 'radial-bar', angleKey: 'a', radiusKey: 'category' }],
            ['radial-column', { type: 'radial-column', angleKey: 'category', radiusKey: 'a' }],
            ['radar-line', { type: 'radar-line', angleKey: 'category', radiusKey: 'a' }],
        ])('should cast the shadows of a %s through the root', async (_name, series) => {
            await create({ data: NIGHTINGALE_DATA, series: [series] } as AgChartOptions);

            expect(batching('itemGroup')).toBe('shared');
        });

        it.each([
            ['sankey', FLOW_DATA, { fromKey: 'from', toKey: 'to', sizeKey: 'size' }],
            ['pyramid', STAGES, { stageKey: 'group', valueKey: 'value' }],
            ['radar-area', RADAR_DATA, { angleKey: 'subject', radiusKey: 'a' }],
            ['nightingale', NIGHTINGALE_DATA, { angleKey: 'category', radiusKey: 'a' }],
        ])('should keep the highlight layer of a %s out of the root', async (type, data, keys) => {
            await create({ data, series: [{ type, ...keys }] } as AgChartOptions);

            const series = deproxy(chart!).series[0];
            expect(series.highlightGroup.batchShadows).toBe(true);
            expect(series.highlightNodeGroup.batchShadows).toBe(true);
        });

        it('should keep the tiles of a treemap layered, so that a deeper tile still shadows its parent', async () => {
            await create({
                data: HIERARCHY_SHADOW_DATA,
                series: [{ type: 'treemap', labelKey: 'name', sizeKey: 'size' }],
            } as AgChartOptions);

            expect(batching('rectGroup')).toBe('by-layer');
        });

        it('should keep the rings of a sunburst layered, so that an outer ring still shadows the one inside it', async () => {
            await create({
                data: HIERARCHY_SHADOW_DATA,
                series: [{ type: 'sunburst', labelKey: 'name', sizeKey: 'size' }],
            } as AgChartOptions);

            expect(batching('sectorGroup')).toBe('by-layer');
        });
    });

    describe('layering beneath every series', () => {
        const radar = (shadow: AgDropShadowOptions | undefined): AgChartOptions =>
            ({
                data: RADAR_DATA,
                series: [
                    { type: 'radar-area', angleKey: 'subject', radiusKey: 'a', fill: 'red', fillOpacity: 1 },
                    { type: 'radar-area', angleKey: 'subject', radiusKey: 'b', fill: 'blue', fillOpacity: 1, shadow },
                ],
            }) as AgChartOptions;

        it('should not draw the shadow of a later radar area over an earlier one', async () => {
            expect(allRed(await fillPixelsAfterCasting(radar))).toBe(true);
        });

        it('should draw the shadow of a later radar area over an earlier one when the root cannot cast, as before', async () => {
            withoutRoot();

            expect(allRed(await fillPixelsAfterCasting(radar))).toBe(false);
        });

        const radarMarkers = (shadow: AgDropShadowOptions | undefined): AgChartOptions =>
            ({
                data: RADAR_DATA,
                series: [
                    {
                        type: 'radar-area',
                        angleKey: 'subject',
                        radiusKey: 'a',
                        fill: 'red',
                        fillOpacity: 1,
                        marker: { enabled: true, size: 24, fill: 'blue', stroke: 'blue', shadow },
                    },
                ],
            }) as AgChartOptions;

        it('should not draw the marker shadows of a radar area over its own fill', async () => {
            expect(allRed(await fillPixelsAfterCasting(radarMarkers))).toBe(true);
        });

        it('should draw the marker shadows of a radar area over its own fill when the root cannot cast, as before', async () => {
            withoutRoot();

            expect(allRed(await fillPixelsAfterCasting(radarMarkers))).toBe(false);
        });

        // The inner circle covers the sector shadows that fall in the hole of the donut.
        const donutWithInnerCircle = (shadow: AgDropShadowOptions | undefined): AgChartOptions =>
            ({
                data: NIGHTINGALE_DATA,
                series: [
                    {
                        type: 'donut',
                        angleKey: 'a',
                        innerRadiusRatio: 0.5,
                        innerCircle: { fill: 'red', fillOpacity: 1 },
                        fills: ['blue', 'green', 'orange', 'purple'],
                        shadow,
                    },
                ],
            }) as AgChartOptions;

        it('should not draw the sector shadows of a donut over its own inner circle', async () => {
            expect(allRed(await fillPixelsAfterCasting(donutWithInnerCircle))).toBe(true);
        });

        it('should draw the sector shadows of a donut over its own inner circle when the root cannot cast, as before', async () => {
            withoutRoot();

            expect(allRed(await fillPixelsAfterCasting(donutWithInnerCircle))).toBe(false);
        });

        // The inner ring is the later series, whose sectors cast onto the ring around it, which is the earlier.
        const rings = (shadow: AgDropShadowOptions | undefined): AgChartOptions =>
            ({
                data: NIGHTINGALE_DATA,
                series: [
                    {
                        type: 'donut',
                        angleKey: 'a',
                        outerRadiusRatio: 1,
                        innerRadiusRatio: 0.7,
                        fills: ['red'],
                        fillOpacity: 1,
                        strokeWidth: 0,
                    },
                    {
                        type: 'donut',
                        angleKey: 'b',
                        outerRadiusRatio: 0.65,
                        innerRadiusRatio: 0.3,
                        fills: ['blue'],
                        fillOpacity: 1,
                        strokeWidth: 0,
                        shadow,
                    },
                ],
            }) as AgChartOptions;

        it('should not draw the sector shadows of an inner donut ring over the ring around it', async () => {
            expect(allRed(await fillPixelsAfterCasting(rings))).toBe(true);
        });

        it('should draw the sector shadows of an inner donut ring over the ring around it when the root cannot cast, as before', async () => {
            withoutRoot();

            expect(allRed(await fillPixelsAfterCasting(rings))).toBe(false);
        });

        // The connectors are drawn beneath the stages, and may cover the shadows that the stages cast onto them.
        const connectors = (shadow: AgDropShadowOptions | undefined): AgChartOptions =>
            ({
                data: STAGES,
                series: [
                    {
                        type: 'funnel',
                        stageKey: 'group',
                        valueKey: 'value',
                        fills: ['blue'],
                        fillOpacity: 1,
                        strokeWidth: 0,
                        dropOff: { fill: 'red', fillOpacity: 1, strokeWidth: 0 },
                        shadow,
                    },
                ],
            }) as AgChartOptions;

        it('should not draw the stage shadows of a funnel over its connectors', async () => {
            expect(allRed(await fillPixelsAfterCasting(connectors))).toBe(true);
        });

        it('should draw the stage shadows of a funnel over its connectors when the root cannot cast, as before', async () => {
            withoutRoot();

            expect(allRed(await fillPixelsAfterCasting(connectors))).toBe(false);
        });

        // The markers are beneath the shapes of the map, so that most of the shadow of one is hidden.
        const mapMarkers = (shadow: AgDropShadowOptions | undefined): AgChartOptions =>
            ({
                data: ukData,
                topology: ukTopology,
                series: [
                    { type: 'map-shape', idKey: 'name', fill: 'red', fillOpacity: 1, stroke: 'transparent' },
                    { type: 'map-marker', idKey: 'name', size: 24, fill: 'blue', shadow },
                ],
            }) as AgChartOptions;

        it('should not draw the shadows of map markers over the shapes of the map', async () => {
            expect(allRed(await fillPixelsAfterCasting(mapMarkers))).toBe(true);
        });

        it('should draw the shadows of map markers over the shapes of the map when the root cannot cast, as before', async () => {
            withoutRoot();

            expect(allRed(await fillPixelsAfterCasting(mapMarkers))).toBe(false);
        });

        const nightingale = (shadow: AgDropShadowOptions | undefined): AgChartOptions =>
            ({
                data: NIGHTINGALE_DATA,
                series: [
                    {
                        type: 'nightingale',
                        angleKey: 'category',
                        radiusKey: 'a',
                        fill: 'red',
                        fillOpacity: 1,
                        strokeWidth: 0,
                    },
                    {
                        type: 'nightingale',
                        angleKey: 'category',
                        radiusKey: 'b',
                        fill: 'blue',
                        fillOpacity: 1,
                        strokeWidth: 0,
                        shadow,
                    },
                ],
            }) as AgChartOptions;

        it('should not draw the shadow of a later polar series over an earlier one', async () => {
            expect(allRed(await fillPixelsAfterCasting(nightingale))).toBe(true);
        });

        it('should draw the shadow of a later polar series over an earlier one when the root cannot cast, as before', async () => {
            withoutRoot();

            expect(allRed(await fillPixelsAfterCasting(nightingale))).toBe(false);
        });

        const mapShapes = (shadow: AgDropShadowOptions | undefined): AgChartOptions =>
            ({
                data: ukData,
                topology: ukTopology,
                series: [
                    {
                        type: 'map-shape',
                        title: 'Earlier',
                        idKey: 'name',
                        fill: 'red',
                        fillOpacity: 1,
                        stroke: 'transparent',
                    },
                    {
                        type: 'map-shape',
                        title: 'Later',
                        data: ukData.filter(({ name }) => name === 'Scotland'),
                        idKey: 'name',
                        fill: 'blue',
                        fillOpacity: 1,
                        stroke: 'transparent',
                        shadow,
                    },
                ],
            }) as AgChartOptions;

        it('should not draw the shadow of a later map series over an earlier one', async () => {
            expect(allRed(await fillPixelsAfterCasting(mapShapes))).toBe(true);
        });

        it('should draw the shadow of a later map series over an earlier one when the root cannot cast, as before', async () => {
            withoutRoot();

            expect(allRed(await fillPixelsAfterCasting(mapShapes))).toBe(false);
        });

        describe.each(['sankey', 'chord'])('%s', (type) => {
            // The shadow of the nodes falls on the links beside them, which are drawn before the nodes.
            const flow = (shadow: AgDropShadowOptions | undefined): AgChartOptions =>
                ({
                    data: FLOW_DATA,
                    series: [
                        {
                            type,
                            fromKey: 'from',
                            toKey: 'to',
                            sizeKey: 'size',
                            link: { fill: 'red', fillOpacity: 1, strokeWidth: 0 },
                            node: { shadow },
                        },
                    ],
                }) as AgChartOptions;

            it('should not draw the shadow of the nodes over the links', async () => {
                expect(allRed(await fillPixelsAfterCasting(flow))).toBe(true);
            });

            it('should draw the shadow of the nodes over the links when the root cannot cast, as before', async () => {
                withoutRoot();

                expect(allRed(await fillPixelsAfterCasting(flow))).toBe(false);
            });
        });
    });

    describe('one series', () => {
        it.each(['sankey', 'chord'])(
            'should draw the links of a %s the same through the root as through its own batch',
            (type) =>
                same({
                    data: FLOW_DATA,
                    series: [
                        {
                            type,
                            fromKey: 'from',
                            toKey: 'to',
                            sizeKey: 'size',
                            link: { fillOpacity: 1, shadow: SHADOW },
                        },
                    ],
                } as AgChartOptions)
        );

        it('should draw a pyramid the same through the root as through its own batch', () =>
            same({
                data: STAGES,
                series: [{ type: 'pyramid', stageKey: 'group', valueKey: 'value', shadow: SHADOW }],
            } as AgChartOptions));

        it('should draw a radar area the same through the root as through its own batch', () =>
            same({
                data: RADAR_DATA,
                series: [{ type: 'radar-area', angleKey: 'subject', radiusKey: 'a', fillOpacity: 1, shadow: SHADOW }],
            } as AgChartOptions));

        it('should draw a polar series the same through the root as through its own batch', () =>
            same({
                data: NIGHTINGALE_DATA,
                series: [{ type: 'nightingale', angleKey: 'category', radiusKey: 'a', shadow: SHADOW }],
            } as AgChartOptions));

        it('should draw a map series the same through the root as through its own batch', () =>
            same(
                {
                    data: ukData,
                    topology: ukTopology,
                    series: [{ type: 'map-shape', idKey: 'name', shadow: SHADOW }],
                } as AgChartOptions,
                4
            ));
    });
});
