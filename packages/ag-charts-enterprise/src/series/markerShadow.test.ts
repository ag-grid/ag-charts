import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartOptions, AgDropShadowOptions, AgMarkerShapeFn, _ModuleSupport } from 'ag-charts-community';
import { type Chart, setupMockCanvas, setupMockConsole } from 'ag-charts-community-test';

import { createEnterpriseChart } from '../test/utils';
import { ukData } from './map-test/ukData';
import ukTopology from './map-test/ukTopology.json';

const SHADOW: AgDropShadowOptions = { enabled: true, color: '#000000', xOffset: 4, yOffset: 4, blur: 6 };

const customShape: AgMarkerShapeFn = ({ path, x, y, size }) => {
    path.moveTo(x - size / 2, y - size / 2);
    path.lineTo(x + size / 2, y - size / 2);
    path.lineTo(x, y + size / 2);
    path.closePath();
};

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
            await create(testCase.options('diamond', SHADOW));

            const markers = visibleMarkers(testCase);
            expect(markers).toHaveLength(testCase.count);
            for (const marker of markers) {
                expect(marker.fillShadow).toMatchObject(SHADOW);
            }
        });

        it('does not apply the shadow to markers with a custom function shape', async () => {
            await create(testCase.options(customShape, SHADOW));

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
});
