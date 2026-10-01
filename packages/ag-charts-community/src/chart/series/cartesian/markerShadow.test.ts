import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AgCartesianChartOptions, AgChartInstance, AgDropShadowOptions, AgMarkerShapeFn } from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import type { Marker } from '../../marker/marker';
import { STRIPPED_NUMBER_AXES } from '../../test/bigintExamples';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    compareImageSnapshot,
    deproxy,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../../test/utils';

const SHADOW: AgDropShadowOptions = { enabled: true, color: '#000000', xOffset: 4, yOffset: 4, blur: 6 };

const SCATTER_DATA = [
    { x: 1, y: 3, size: 10 },
    { x: 2, y: 6, size: 20 },
    { x: 3, y: 4, size: 30 },
    { x: 4, y: 8, size: 15 },
];

const customShape: AgMarkerShapeFn = ({ path, x, y, size }) => {
    path.moveTo(x - size / 2, y - size / 2);
    path.lineTo(x + size / 2, y - size / 2);
    path.lineTo(x, y + size / 2);
    path.closePath();
};

const markerSeriesOptions = {
    scatter: (marker: object, shadow?: AgDropShadowOptions) => ({
        type: 'scatter' as const,
        xKey: 'x',
        yKey: 'y',
        shape: 'circle',
        size: 12,
        shadow,
        ...marker,
    }),
    bubble: (marker: object, shadow?: AgDropShadowOptions) => ({
        type: 'bubble' as const,
        xKey: 'x',
        yKey: 'y',
        sizeKey: 'size',
        shadow,
        ...marker,
    }),
    line: (marker: object, shadow?: AgDropShadowOptions) => ({
        type: 'line' as const,
        xKey: 'x',
        yKey: 'y',
        marker: { enabled: true, size: 12, ...marker, shadow },
    }),
    area: (marker: object, shadow?: AgDropShadowOptions) => ({
        type: 'area' as const,
        xKey: 'x',
        yKey: 'y',
        marker: { enabled: true, size: 12, ...marker, shadow },
    }),
};

describe('marker shadow', () => {
    setupMockConsole();

    let chart: AgChartInstance;

    afterEach(() => {
        chart?.destroy();
        (chart as unknown) = undefined;
        vi.restoreAllMocks();
    });

    const ctx = setupMockCanvas();

    const create = async (options: AgCartesianChartOptions) => {
        prepareTestOptions(options);
        chart = AgCharts.create(options);
        await waitForChartStability(chart);
        return chart;
    };

    const visibleMarkers = (seriesIndex = 0): Marker[] => {
        const series = deproxy(chart).series[seriesIndex] as any;
        return Array.from<Marker>(series.datumSelection.nodes()).filter((node) => node.visible);
    };

    const shapeOption = (shape: unknown) => ({ shape });

    describe.each(['scatter', 'bubble', 'line', 'area'] as const)('%s', (type) => {
        it('applies the shadow to markers with a built-in shape', async () => {
            await create({
                data: SCATTER_DATA,
                series: [markerSeriesOptions[type](shapeOption('diamond'), SHADOW)],
            } as AgCartesianChartOptions);

            const markers = visibleMarkers();
            expect(markers).toHaveLength(SCATTER_DATA.length);
            for (const marker of markers) {
                expect(marker.fillShadow).toMatchObject(SHADOW);
            }
        });

        it('does not apply the shadow to markers with a custom function shape', async () => {
            await create({
                data: SCATTER_DATA,
                series: [markerSeriesOptions[type](shapeOption(customShape), SHADOW)],
            } as AgCartesianChartOptions);

            const markers = visibleMarkers();
            expect(markers).toHaveLength(SCATTER_DATA.length);
            for (const marker of markers) {
                expect(marker.fillShadow).toBeUndefined();
            }
        });

        it('leaves the shadow disabled by default', async () => {
            await create({
                data: SCATTER_DATA,
                series: [markerSeriesOptions[type](shapeOption('circle'))],
            } as AgCartesianChartOptions);

            const markers = visibleMarkers();
            expect(markers.length).toBeGreaterThan(0);
            for (const marker of markers) {
                expect(marker.fillShadow?.enabled ?? false).toBe(false);
            }
        });
    });

    describe('itemStyler', () => {
        it.each(['scatter', 'bubble', 'line', 'area'] as const)(
            '%s keeps the marker shadow and does not pass it to the itemStyler params',
            async (type) => {
                const received: any[] = [];
                const itemStyler = (params: any) => {
                    received.push(params);
                    return { fill: 'green' };
                };

                await create({
                    data: SCATTER_DATA,
                    series: [markerSeriesOptions[type]({ shape: 'square', itemStyler }, SHADOW)],
                } as AgCartesianChartOptions);

                expect(received.length).toBeGreaterThan(0);
                for (const params of received) {
                    expect(params.shadow).toBeUndefined();
                }

                const markers = visibleMarkers();
                expect(markers.length).toBeGreaterThan(0);
                for (const marker of markers) {
                    expect(marker.fill).toBe('green');
                    expect(marker.fillShadow).toMatchObject(SHADOW);
                }
            }
        );

        it('keeps the marker shadow when the itemStyler returns no style', async () => {
            await create({
                data: SCATTER_DATA,
                series: [markerSeriesOptions.scatter({ shape: 'square', itemStyler: () => undefined }, SHADOW)],
            } as AgCartesianChartOptions);

            for (const marker of visibleMarkers()) {
                expect(marker.fillShadow).toMatchObject(SHADOW);
            }
        });
    });

    describe('area', () => {
        const AREA_FILL_SHADOW: AgDropShadowOptions = {
            enabled: true,
            color: '#ff0000',
            xOffset: 10,
            yOffset: 12,
            blur: 14,
        };

        /** The area series' fill path is the first of its two paths; the second is the stroke. */
        const areaFillPath = () => (deproxy(chart).series[0] as any).paths[0];

        it('keeps the series fill shadow and the marker shadow independent', async () => {
            await create({
                data: SCATTER_DATA,
                series: [
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y',
                        shadow: AREA_FILL_SHADOW,
                        marker: { enabled: true, shape: 'circle', size: 12, shadow: SHADOW },
                    },
                ],
            } as AgCartesianChartOptions);

            expect(areaFillPath().fillShadow).toMatchObject(AREA_FILL_SHADOW);
            const markers = visibleMarkers();
            expect(markers).toHaveLength(SCATTER_DATA.length);
            for (const marker of markers) {
                expect(marker.fillShadow).toMatchObject(SHADOW);
            }
        });

        it('does not shadow the markers when only the series fill shadow is set', async () => {
            await create({
                data: SCATTER_DATA,
                series: [
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y',
                        shadow: AREA_FILL_SHADOW,
                        marker: { enabled: true, shape: 'circle', size: 12 },
                    },
                ],
            } as AgCartesianChartOptions);

            expect(areaFillPath().fillShadow).toMatchObject(AREA_FILL_SHADOW);
            const markers = visibleMarkers();
            expect(markers).toHaveLength(SCATTER_DATA.length);
            for (const marker of markers) {
                expect(marker.fillShadow?.enabled ?? false).toBe(false);
            }
        });

        it('does not shadow the series fill when only the marker shadow is set', async () => {
            await create({
                data: SCATTER_DATA,
                series: [
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'y',
                        marker: { enabled: true, shape: 'circle', size: 12, shadow: SHADOW },
                    },
                ],
            } as AgCartesianChartOptions);

            expect(areaFillPath().fillShadow?.enabled ?? false).toBe(false);
            const markers = visibleMarkers();
            expect(markers).toHaveLength(SCATTER_DATA.length);
            for (const marker of markers) {
                expect(marker.fillShadow).toMatchObject(SHADOW);
            }
        });
    });

    describe('image snapshots', () => {
        // Decoration-free axes, padded so the shadowed markers aren't clipped at the edge. Hiding the labels also
        // keeps the baselines independent of the platform's font rendering.
        const PADDED_AXES = {
            x: { ...STRIPPED_NUMBER_AXES.x, min: 0, max: 5 },
            y: { ...STRIPPED_NUMBER_AXES.y, min: 0, max: 10 },
        };

        const compare = () => compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);

        it('should render scatter markers with a shadow', async () => {
            await create({
                data: SCATTER_DATA,
                axes: PADDED_AXES,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'x',
                        yKey: 'y',
                        shape: 'circle',
                        size: 24,
                        shadow: { enabled: true, color: '#000000aa', xOffset: 5, yOffset: 5, blur: 6 },
                    },
                ],
            } as AgCartesianChartOptions);
            await compare();
        });

        it('should render line markers with a shadow', async () => {
            await create({
                data: SCATTER_DATA,
                axes: PADDED_AXES,
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        marker: {
                            enabled: true,
                            shape: 'square',
                            size: 20,
                            shadow: { enabled: true, color: '#000000aa', xOffset: 5, yOffset: 5, blur: 6 },
                        },
                    },
                ],
            } as AgCartesianChartOptions);
            await compare();
        });
    });
});
