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

        function enabled(strategy?: LabelCollisionAvoidance['strategy']) {
            const collisionAvoidance = new LabelCollisionAvoidance();
            collisionAvoidance.enabled = true;
            collisionAvoidance.strategy = strategy;
            return collisionAvoidance;
        }

        test('falls back to the legacy placement seed when no strategy is set', () => {
            expect(enabled().placements(['bottom'])).toEqual(['bottom']);
        });

        test('uses the reposition strategy placements over the fallback', () => {
            const collisionAvoidance = enabled([{ type: 'reposition', placements: ['left', 'right'] }]);
            expect(collisionAvoidance.placements(['bottom'])).toEqual(['left', 'right']);
        });

        test('falls back when the reposition strategy omits placements', () => {
            expect(enabled([{ type: 'reposition' }]).placements(DEFAULT)).toEqual(DEFAULT);
        });

        test('ignores the reposition strategy when avoidance is disabled', () => {
            const collisionAvoidance = new LabelCollisionAvoidance();
            collisionAvoidance.strategy = [{ type: 'reposition', placements: ['left', 'right'] }];
            expect(collisionAvoidance.placements(['top'])).toEqual(['top']);
        });
    });

    describe('collisionAvoidance.resolveCollideWith', () => {
        test('returns undefined when avoidance is disabled', () => {
            expect(new LabelCollisionAvoidance().resolveCollideWith()).toBeUndefined();
        });

        test('defaults markers/labels on and seriesItems off', () => {
            const collisionAvoidance = new LabelCollisionAvoidance();
            collisionAvoidance.enabled = true;
            expect(collisionAvoidance.resolveCollideWith()).toEqual({
                marker: { enabled: true, minSpacing: undefined },
                label: { enabled: true, minSpacing: undefined },
                seriesItem: { enabled: false, minSpacing: undefined },
            });
        });

        test('opts seriesItems in only when explicitly enabled', () => {
            const collisionAvoidance = new LabelCollisionAvoidance();
            collisionAvoidance.enabled = true;
            collisionAvoidance.collideWith.seriesItems.enabled = true;
            expect(collisionAvoidance.resolveCollideWith()?.seriesItem?.enabled).toBe(true);
        });
    });
});
