import { vi } from 'vitest';

import type { AgChartInstance } from 'ag-charts-types';

import { AgCharts } from '../api/agCharts';
import { LabelCollisionAvoidance } from './label';
import {
    extractImageData,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from './test/utils';

describe('Labels', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();
    let chart: AgChartInstance;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        vi.restoreAllMocks();
    });

    async function compare() {
        await waitForChartStability(chart);
        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot();
    }

    describe('AG-8917', () => {
        test('itemStyler auto-enables border', async () => {
            const options = prepareTestOptions({
                data: [
                    { x: "Q1'18", y: 140 },
                    { x: "Q2'18", y: 124 },
                    { x: "Q3'18", y: 112 },
                    { x: "Q4'18", y: 118 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        label: {
                            itemStyler: () => {
                                return { border: { strokeWidth: 2, stroke: 'black' } };
                            },
                        },
                    },
                ],
            });
            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('collisionAvoidance.placements', () => {
        const DEFAULT = ['top', 'bottom'] as const;

        test('falls back to the legacy placement seed when no strategy is set', () => {
            expect(new LabelCollisionAvoidance().placements(['bottom'])).toEqual(['bottom']);
        });

        test('uses the reposition strategy placements over the fallback', () => {
            const collisionAvoidance = new LabelCollisionAvoidance();
            collisionAvoidance.strategy = [{ type: 'reposition', placements: ['left', 'right'] }];
            expect(collisionAvoidance.placements(['bottom'])).toEqual(['left', 'right']);
        });

        test('falls back when the reposition strategy omits placements', () => {
            const collisionAvoidance = new LabelCollisionAvoidance();
            collisionAvoidance.strategy = [{ type: 'reposition' }];
            expect(collisionAvoidance.placements(DEFAULT)).toEqual(DEFAULT);
        });
    });
});
