import { createElement, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

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

declare global {
    var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

describe('AgCharts', () => {
    setupMockConsole();
    setupMockCanvas();

    describe('synchronised charts', () => {
        let groupCount = 0;
        let groupId: string;
        let host: HTMLElement;
        let root: ReturnType<typeof createRoot>;
        let charts: (AgChartInstance | null)[];
        let setPeaks: (peaks: number[]) => void;

        beforeEach(() => {
            globalThis.IS_REACT_ACT_ENVIRONMENT = true;
            groupId = `react-${groupCount++}`;
            host = document.body.appendChild(document.createElement('div'));
            root = createRoot(host);
            charts = [];
        });

        afterEach(() => {
            act(() => root.unmount());
            host.remove();
            globalThis.IS_REACT_ACT_ENVIRONMENT = undefined;
        });

        // Like a typical app, every render passes each chart a freshly built options object.
        function SyncedCharts({ initialPeaks }: { initialPeaks: number[] }) {
            const [peaks, setState] = useState(initialPeaks);
            setPeaks = setState;
            return createElement(
                'div',
                null,
                peaks.map((peak, i) =>
                    createElement(AgCharts, {
                        key: i,
                        ref: (chart: AgChartInstance | null) => {
                            charts[i] = chart;
                        },
                        options: syncedPeakChartOptions(peak, groupId, `${peaks.length} charts`),
                    })
                )
            );
        }

        const mountedCharts = () => charts.filter((chart): chart is AgChartInstance => chart != null);

        const waitForAllChartStability = async () => {
            for (const chart of mountedCharts()) {
                await waitForChartStability(chart);
            }
        };

        const render = async (initialPeaks: number[]) => {
            act(() => root.render(createElement(SyncedCharts, { initialPeaks })));
            await waitForAllChartStability();
        };

        const changePeaks = async (peaks: number[]) => {
            act(() => setPeaks(peaks));
            charts.length = peaks.length;
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
