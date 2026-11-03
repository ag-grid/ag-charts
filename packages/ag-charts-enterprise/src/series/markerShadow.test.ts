import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartOptions, _ModuleSupport } from 'ag-charts-community';
import {
    MARKER_SHADOW,
    customMarkerShape,
    getSeriesAt,
    getSeriesSelectionNodes,
    internalOptions,
    setupMockCanvas,
    setupMockConsole,
} from 'ag-charts-community-test';
import type { InternalAgDropShadowOptions } from 'ag-charts-core';
import type { AgChartInstance, AgMarkerShape } from 'ag-charts-types';

import { getEnterpriseSelectionNodes } from '../test/enterpriseSeriesAccessors';
import { createEnterpriseChart } from '../test/utils';
import { ukData } from './map-test/ukData';
import ukTopology from './map-test/ukTopology.json';

const RADAR_DATA = [
    { subject: 'a', value: 3, low: 1 },
    { subject: 'b', value: 6, low: 2 },
    { subject: 'c', value: 4, low: 1 },
    { subject: 'd', value: 8, low: 3 },
];

type Marker = _ModuleSupport.Marker;

/** What a test adds to the series under test: a tooltip renderer that records the params it is handed. */
interface SeriesExtras {
    tooltip?: { renderer: (params: unknown) => object };
}

interface MarkerSeriesCase {
    name: string;
    /** Chart options for a series whose markers use `shape` and (optionally) `shadow`. */
    options: (shape: AgMarkerShape, shadow?: InternalAgDropShadowOptions, extras?: SeriesExtras) => AgChartOptions;
    /** Series selection holding the marker nodes. */
    selection: 'datumSelection' | 'itemSelection' | 'markerSelection';
    /** Index of the series that draws the markers. */
    seriesIndex: number;
    /** Number of marker nodes expected to be visible. */
    count: number;
}

const CASES: MarkerSeriesCase[] = [
    {
        name: 'range-area',
        selection: 'datumSelection',
        seriesIndex: 0,
        // Each datum has a high and a low marker.
        count: RADAR_DATA.length * 2,
        options: (shape, shadow, extras) => ({
            data: RADAR_DATA,
            series: [
                {
                    type: 'range-area',
                    xKey: 'subject',
                    yHighKey: 'value',
                    yLowKey: 'low',
                    marker: { enabled: true, shape, size: 12, shadow },
                    ...extras,
                },
            ],
        }),
    },
    {
        name: 'radar-line',
        selection: 'itemSelection',
        seriesIndex: 0,
        count: RADAR_DATA.length,
        options: (shape, shadow, extras) => ({
            data: RADAR_DATA,
            series: [
                {
                    type: 'radar-line',
                    angleKey: 'subject',
                    radiusKey: 'value',
                    marker: { enabled: true, shape, size: 12, shadow },
                    ...extras,
                },
            ],
        }),
    },
    {
        name: 'radar-area',
        selection: 'itemSelection',
        seriesIndex: 0,
        count: RADAR_DATA.length,
        options: (shape, shadow, extras) => ({
            data: RADAR_DATA,
            series: [
                {
                    type: 'radar-area',
                    angleKey: 'subject',
                    radiusKey: 'value',
                    marker: { enabled: true, shape, size: 12, shadow },
                    ...extras,
                },
            ],
        }),
    },
    {
        name: 'map-marker',
        selection: 'markerSelection',
        seriesIndex: 1,
        count: ukData.length,
        options: (shape, shadow, extras) => ({
            data: ukData,
            topology: ukTopology,
            series: [
                { type: 'map-shape-background' },
                { type: 'map-marker', idKey: 'name', shape, size: 12, shadow, ...extras },
            ],
        }),
    },
];

describe('marker shadow', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const create = async (options: AgChartOptions) => {
        chart = await createEnterpriseChart(options);
        return chart;
    };

    const visibleMarkers = ({ selection, seriesIndex }: MarkerSeriesCase): Marker[] => {
        const markers =
            selection === 'markerSelection'
                ? getEnterpriseSelectionNodes<Marker>(chart!, selection, seriesIndex)
                : getSeriesSelectionNodes<Marker>(chart!, selection, seriesIndex);
        return markers.filter((node) => node.visible);
    };

    describe.each(CASES)('$name', (testCase) => {
        it('applies the shadow to markers with a built-in shape', async () => {
            await create(testCase.options('diamond', MARKER_SHADOW));

            const markers = visibleMarkers(testCase);
            expect(markers).toHaveLength(testCase.count);
            for (const marker of markers) {
                expect(marker.fillShadow).toMatchObject(MARKER_SHADOW);
            }
        });

        it('does not apply the shadow to markers with a custom function shape', async () => {
            await create(testCase.options(customMarkerShape, MARKER_SHADOW));

            const markers = visibleMarkers(testCase);
            expect(markers).toHaveLength(testCase.count);
            for (const marker of markers) {
                expect(marker.fillShadow).toBeUndefined();
            }
        });

        it('leaves the shadow disabled by default', async () => {
            await create(testCase.options('circle'));

            const markers = visibleMarkers(testCase);
            expect(markers).toHaveLength(testCase.count);
            for (const marker of markers) {
                expect(marker.fillShadow?.enabled ?? false).toBe(false);
            }
        });
    });

    describe('range-area item markers', () => {
        const LOW_SHADOW: InternalAgDropShadowOptions = {
            enabled: true,
            fill: '#ff0000',
            xOffset: 2,
            yOffset: 2,
            blur: 3,
        };
        const HIGH_SHADOW: InternalAgDropShadowOptions = {
            enabled: true,
            fill: '#0000ff',
            xOffset: 6,
            yOffset: 7,
            blur: 9,
        };

        const rangeAreaCase = CASES.find((c) => c.name === 'range-area')!;

        const markersByItemType = () => {
            const byType: Record<'low' | 'high', Marker[]> = { low: [], high: [] };
            for (const marker of visibleMarkers(rangeAreaCase)) {
                // The marker node's datum is untyped; range-area marker datums carry the item they mark.
                byType[(marker.datum as { itemType: 'low' | 'high' }).itemType].push(marker);
            }
            return byType;
        };

        it('applies each item marker its own shadow', async () => {
            await create(
                internalOptions<AgChartOptions>({
                    data: RADAR_DATA,
                    series: [
                        {
                            type: 'range-area',
                            xKey: 'subject',
                            yHighKey: 'value',
                            yLowKey: 'low',
                            marker: { enabled: true, shape: 'circle', size: 12 },
                            item: {
                                low: { marker: { shadow: LOW_SHADOW } },
                                high: { marker: { shadow: HIGH_SHADOW } },
                            },
                        },
                    ],
                })
            );

            const { low, high } = markersByItemType();
            expect(low).toHaveLength(RADAR_DATA.length);
            expect(high).toHaveLength(RADAR_DATA.length);
            for (const marker of low) {
                expect(marker.fillShadow).toMatchObject(LOW_SHADOW);
            }
            for (const marker of high) {
                expect(marker.fillShadow).toMatchObject(HIGH_SHADOW);
            }
        });

        it('shadows only the item whose marker sets a shadow', async () => {
            await create(
                internalOptions<AgChartOptions>({
                    data: RADAR_DATA,
                    series: [
                        {
                            type: 'range-area',
                            xKey: 'subject',
                            yHighKey: 'value',
                            yLowKey: 'low',
                            marker: { enabled: true, shape: 'circle', size: 12 },
                            item: { high: { marker: { shadow: HIGH_SHADOW } } },
                        },
                    ],
                })
            );

            const { low, high } = markersByItemType();
            for (const marker of low) {
                expect(marker.fillShadow?.enabled ?? false).toBe(false);
            }
            for (const marker of high) {
                expect(marker.fillShadow).toMatchObject(HIGH_SHADOW);
            }
        });
    });

    describe.each(CASES.filter((c) => c.name !== 'map-marker'))('$name tooltip renderer', (testCase) => {
        it('does not receive the marker shadow in its params', async () => {
            const received: unknown[] = [];
            await create(
                testCase.options('square', MARKER_SHADOW, {
                    tooltip: {
                        renderer: (params) => {
                            received.push(params);
                            return {};
                        },
                    },
                })
            );

            getSeriesAt(chart!).getTooltipContent(0, undefined);

            expect(received).toHaveLength(1);
            expect(received[0]).not.toHaveProperty('shadow');
        });
    });
});
