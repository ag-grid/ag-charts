import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartOptions } from 'ag-charts-community';
import { type Chart, deproxy, setupMockCanvas, setupMockConsole } from 'ag-charts-community-test';

import { createEnterpriseChart } from '../test/utils';
import { ukData } from './map-test/ukData';
import { ukRoadData } from './map-test/ukRoadData';
import ukRoadTopology from './map-test/ukRoadTopology.json';
import ukTopology from './map-test/ukTopology.json';

describe('series label lineHeight', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const twoLineLabel = {
        enabled: true,
        fontSize: 12,
        lineHeight: 36,
        formatter: ({ value }: { value: string }) => `${value}\nsecond`,
    };

    it.each([
        {
            name: 'map-line',
            options: {
                data: ukRoadData,
                topology: ukRoadTopology,
                series: [{ type: 'map-line', idKey: 'name', labelKey: 'name', label: twoLineLabel }],
            },
        },
        {
            name: 'map-marker',
            options: {
                data: ukData,
                topology: ukTopology,
                series: [
                    { type: 'map-shape-background' },
                    { type: 'map-marker', idKey: 'name', labelKey: 'name', label: twoLineLabel },
                ],
            },
        },
    ])('measures $name label boxes by their lineHeight', async ({ options }) => {
        chart = deproxy(await createEnterpriseChart(options as AgChartOptions));
        const { labelData } = (chart.series.at(-1) as any).contextNodeData;
        expect(labelData.length).toBeGreaterThan(0);
        expect(labelData.map((datum: any) => datum.label.height)).toEqual(labelData.map(() => 72));
    });

    it('hides chord labels whose lineHeight overlaps their neighbours', async () => {
        const nodeNames = Array.from({ length: 12 }, (_, i) => `Node ${i}`);
        const labelCount = async (label: object) => {
            chart?.destroy();
            chart = deproxy(
                await createEnterpriseChart({
                    data: nodeNames.map((from, i) => ({ from, to: nodeNames[(i + 1) % nodeNames.length], size: 1 })),
                    series: [{ type: 'chord', fromKey: 'from', toKey: 'to', sizeKey: 'size', label }],
                })
            );
            return (chart.series[0] as any).labelSelection.nodes().length;
        };

        expect(await labelCount({})).toBe(nodeNames.length);
        expect(await labelCount({ lineHeight: 200 })).toBeLessThan(nodeNames.length);
    });

    it('reserves room for pyramid stage labels by their lineHeight', async () => {
        const seriesHeight = async (lineHeight?: number) => {
            chart?.destroy();
            chart = deproxy(
                await createEnterpriseChart({
                    data: [
                        { group: 'Qualify', value: 7910 },
                        { group: 'Develop', value: 8170 },
                        { group: 'Propose', value: 7260 },
                        { group: 'Close', value: 4460 },
                    ],
                    series: [
                        {
                            type: 'pyramid',
                            stageKey: 'group',
                            valueKey: 'value',
                            direction: 'horizontal',
                            stageLabel: { enabled: true, fontSize: 12, lineHeight },
                        },
                    ],
                })
            );
            const heights: number[] = [];
            (chart.series[0] as any).datumSelection.each((node: any) => heights.push(node.getBBox().height));
            return Math.max(...heights);
        };

        expect((await seriesHeight()) - (await seriesHeight(60))).toBeGreaterThan(30);
    });
});
