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

    describe('collisionAvoidance.avoid', () => {
        test('is false when enabled is unset (opt-in default off)', () => {
            expect(new LabelCollisionAvoidance().avoid).toBe(false);
        });

        test('is false when enabled is false', () => {
            const collisionAvoidance = new LabelCollisionAvoidance();
            collisionAvoidance.enabled = false;
            expect(collisionAvoidance.avoid).toBe(false);
        });

        test('is true only when enabled is true', () => {
            const collisionAvoidance = new LabelCollisionAvoidance();
            collisionAvoidance.enabled = true;
            expect(collisionAvoidance.avoid).toBe(true);
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
