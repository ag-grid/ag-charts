import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { type App, createApp, defineComponent, h, nextTick, ref } from 'vue';

import type { AgChartInstance } from 'ag-charts-community';
import {
    setupMockCanvas,
    setupMockConsole,
    syncGroupSize,
    syncedPeakChartOptions,
    syncedYDomain,
    waitForChartStability,
} from 'ag-charts-community-test';

import { AgCharts } from './index';

describe('AgCharts', () => {
    setupMockConsole();
    setupMockCanvas();

    describe('synchronised charts', () => {
        let groupCount = 0;
        let groupId: string;
        let host: HTMLElement;
        let app: App | undefined;
        let components: (InstanceType<typeof AgCharts> | null)[];
        const peaks = ref<number[]>([]);

        beforeEach(() => {
            groupId = `vue-${groupCount++}`;
            host = document.body.appendChild(document.createElement('div'));
            components = [];
        });

        afterEach(() => {
            app?.unmount();
            app = undefined;
            host.remove();
        });

        // Like a typical app, every render passes each chart a freshly built options object.
        const SyncedCharts = defineComponent({
            render() {
                return h(
                    'div',
                    peaks.value.map((peak, i) =>
                        h(AgCharts, {
                            key: i,
                            ref: (component) => {
                                components[i] = component as InstanceType<typeof AgCharts> | null;
                            },
                            options: syncedPeakChartOptions(peak, groupId, `${peaks.value.length} charts`),
                        })
                    )
                );
            },
        });

        // The chart is created in the component's `mounted` hook, after its template ref is set.
        const mountedCharts = () =>
            components.map((component) => component?.chart).filter((chart): chart is AgChartInstance => chart != null);

        const waitForAllChartStability = async () => {
            for (const chart of mountedCharts()) {
                await waitForChartStability(chart);
            }
        };

        const render = async (initialPeaks: number[]) => {
            peaks.value = initialPeaks;
            app = createApp(SyncedCharts);
            app.mount(host);
            await waitForAllChartStability();
        };

        const changePeaks = async (nextPeaks: number[]) => {
            peaks.value = nextPeaks;
            await nextTick();
            components.length = nextPeaks.length;
            await waitForAllChartStability();
        };

        it('should widen every chart to the domain of a chart added to the group', async () => {
            await render([10, 20, 50]);
            expect(mountedCharts().map(syncedYDomain)).toEqual([
                [0, 50],
                [0, 50],
                [0, 50],
            ]);

            await changePeaks([10, 20, 50, 100]);

            expect(mountedCharts().map(syncedYDomain)).toEqual([
                [0, 100],
                [0, 100],
                [0, 100],
                [0, 100],
            ]);
            expect(mountedCharts().map((chart) => syncGroupSize(chart, groupId))).toEqual([4, 4, 4, 4]);
        });

        it('should shrink the remaining charts to their own domain when a chart is removed from the group', async () => {
            await render([10, 20, 50]);

            await changePeaks([10, 20]);

            expect(mountedCharts().map(syncedYDomain)).toEqual([
                [0, 20],
                [0, 20],
            ]);
            expect(mountedCharts().map((chart) => syncGroupSize(chart, groupId))).toEqual([2, 2]);
        });
    });
});
