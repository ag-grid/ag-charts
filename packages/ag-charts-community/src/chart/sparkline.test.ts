import { afterEach, describe, expect, it } from '@jest/globals';
import type { MatchImageSnapshotOptions } from 'jest-image-snapshot';

import { AgCharts } from '../api/agCharts';
import type { Chart } from './chart';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    deproxy,
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from './test/utils';

describe('Sparkline', () => {
    setupMockConsole();

    let chart: Chart | undefined;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas({ width: 200, height: 100 });

    const compare = async (chartInstance: Chart, options?: MatchImageSnapshotOptions) => {
        await waitForChartStability(chartInstance);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot({ ...IMAGE_SNAPSHOT_DEFAULTS, ...options });
    };

    describe('unhighlightDelay', () => {
        it('should have unhighlightDelay set to 0 for sparklines (CRT-1012)', async () => {
            const instance = AgCharts.__createSparkline({
                type: 'line',
                data: [2, 3, 4, 1, 2],
                width: 200,
                height: 100,
            });
            chart = deproxy(instance);
            await waitForChartStability(chart);

            // Sparklines should have immediate unhighlight (no delay) to avoid laggy tooltips
            expect(chart.ctx.highlightManager.unhighlightDelay).toBe(0);
        });
    });

    describe('itemStyler', () => {
        it('Handles bar series', async () => {
            const instance = AgCharts.__createSparkline({
                type: 'bar',
                data: [2, 3, 4, 1, 2],
                width: 200,
                height: 100,
                itemStyler({ first, last, min, max }) {
                    if (first) {
                        return { fill: 'red' };
                    } else if (last) {
                        return { fill: 'blue' };
                    } else if (min) {
                        return { fill: 'green' };
                    } else if (max) {
                        return { fill: 'yellow' };
                    }
                    return { fill: 'gray' };
                },
            });
            chart = deproxy(instance);

            await compare(chart);
        });

        it('Handles line series', async () => {
            const instance = AgCharts.__createSparkline({
                type: 'line',
                data: [2, 3, 4, 1, 2],
                width: 200,
                height: 100,
                marker: {
                    enabled: true,
                    size: 6,
                    itemStyler({ first, last, min, max }) {
                        if (first) {
                            return { fill: 'red' };
                        } else if (last) {
                            return { fill: 'blue' };
                        } else if (min) {
                            return { fill: 'green' };
                        } else if (max) {
                            return { fill: 'yellow' };
                        }
                        return { fill: 'gray' };
                    },
                },
            });
            chart = deproxy(instance);

            await compare(chart);
        });

        it('Handles area series', async () => {
            const instance = AgCharts.__createSparkline({
                type: 'area',
                data: [2, 3, 4, 1, 2],
                width: 200,
                height: 100,
                marker: {
                    enabled: true,
                    size: 6,
                    itemStyler({ first, last, min, max }) {
                        if (first) {
                            return { fill: 'red' };
                        } else if (last) {
                            return { fill: 'blue' };
                        } else if (min) {
                            return { fill: 'green' };
                        } else if (max) {
                            return { fill: 'yellow' };
                        }
                        return { fill: 'gray' };
                    },
                },
            });
            chart = deproxy(instance);

            await compare(chart);
        });
    });
});
