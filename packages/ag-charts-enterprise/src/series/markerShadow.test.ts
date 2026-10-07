import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartOptions, AgDropShadowOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type Chart,
    MARKER_SHADOW,
    customMarkerShape,
    setupMockCanvas,
    setupMockConsole,
} from 'ag-charts-community-test';

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

interface MarkerSeriesCase {
    name: string;
    /** Chart options for a series whose markers use `shape` and (optionally) `shadow`. */
    options: (shape: unknown, shadow?: AgDropShadowOptions) => AgChartOptions;
    /** Series property holding the marker nodes. */
    selection: string;
    /** Number of marker nodes expected to be visible. */
    count: number;
}

const CASES: MarkerSeriesCase[] = [
    {
        name: 'range-area',
        selection: 'datumSelection',
        // Each datum has a high and a low marker.
        count: RADAR_DATA.length * 2,
        options: (shape, shadow) =>
            ({
                data: RADAR_DATA,
                series: [
                    {
                        type: 'range-area',
                        xKey: 'subject',
                        yHighKey: 'value',
                        yLowKey: 'low',
                        marker: { enabled: true, shape, size: 12, shadow },
                    },
                ],
            }) as AgChartOptions,
    },
    {
        name: 'radar-line',
        selection: 'itemSelection',
        count: RADAR_DATA.length,
        options: (shape, shadow) =>
            ({
                data: RADAR_DATA,
                series: [
                    {
                        type: 'radar-line',
                        angleKey: 'subject',
                        radiusKey: 'value',
                        marker: { enabled: true, shape, size: 12, shadow },
                    },
                ],
            }) as AgChartOptions,
    },
    {
        name: 'radar-area',
        selection: 'itemSelection',
        count: RADAR_DATA.length,
        options: (shape, shadow) =>
            ({
                data: RADAR_DATA,
                series: [
                    {
                        type: 'radar-area',
                        angleKey: 'subject',
                        radiusKey: 'value',
                        marker: { enabled: true, shape, size: 12, shadow },
                    },
                ],
            }) as AgChartOptions,
    },
    {
        name: 'map-marker',
        selection: 'markerSelection',
        count: ukData.length,
        options: (shape, shadow) =>
            ({
                data: ukData,
                topology: ukTopology,
                series: [
                    { type: 'map-shape-background' },
                    { type: 'map-marker', idKey: 'name', shape, size: 12, shadow },
                ],
            }) as AgChartOptions,
    },
];

describe('marker shadow', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const create = async (options: AgChartOptions) => {
        chart = await createEnterpriseChart(options);
        return chart;
    };

    const visibleMarkers = ({ selection }: MarkerSeriesCase): Marker[] => {
        const series = chart!.series.find((s) => (s as any)[selection] != null) as any;
        return Array.from<Marker>(series[selection].nodes()).filter((node) => node.visible);
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
        const LOW_SHADOW: AgDropShadowOptions = { enabled: true, color: '#ff0000', xOffset: 2, yOffset: 2, blur: 3 };
        const HIGH_SHADOW: AgDropShadowOptions = { enabled: true, color: '#0000ff', xOffset: 6, yOffset: 7, blur: 9 };

        const rangeAreaCase = CASES.find((c) => c.name === 'range-area')!;

        const markersByItemType = () => {
            const byType: Record<'low' | 'high', Marker[]> = { low: [], high: [] };
            for (const marker of visibleMarkers(rangeAreaCase)) {
                byType[(marker.datum as { itemType: 'low' | 'high' }).itemType].push(marker);
            }
            return byType;
        };

        it('applies each item marker its own shadow', async () => {
            await create({
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
            } as AgChartOptions);

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
            await create({
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
            } as AgChartOptions);

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
            const received: any[] = [];
            const options = testCase.options('square', MARKER_SHADOW) as any;
            options.series[0].tooltip = {
                renderer: (params: unknown) => {
                    received.push(params);
                    return {};
                },
            };
            await create(options);

            (chart!.series[0] as any).getTooltipContent(0, undefined);

            expect(received).toHaveLength(1);
            expect(received[0]).not.toHaveProperty('shadow');
        });
    });
});
