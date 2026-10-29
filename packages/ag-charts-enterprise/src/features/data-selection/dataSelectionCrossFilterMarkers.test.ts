import { afterEach, describe, expect, it } from 'vitest';

import { type AgChartInstance, type AgChartOptions, _ModuleSupport } from 'ag-charts-community';
import {
    deproxy,
    getSeriesSelectionNodes,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
    withUndocumentedOptions,
} from 'ag-charts-community-test';

import { createEnterpriseChart } from '../../test/utils';

describe('AG-19127 cross-filter markers with selection.enabled', () => {
    setupMockConsole();
    setupMockCanvas();

    const data = [
        { x: 'Jan', y: 10, selected: true },
        { x: 'Feb', y: 20, selected: false },
        { x: 'Mar', y: 15, selected: false },
    ];

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const markerNodes = () => getSeriesSelectionNodes<_ModuleSupport.Marker>(chart!, 'datumSelection', 0);

    async function create(type: 'line' | 'area') {
        const series = withUndocumentedOptions(
            { type, xKey: 'x', yKey: 'y', marker: { enabled: false }, selection: { enabled: true } },
            { selectedKey: 'selected' }
        );
        chart = await createEnterpriseChart({
            data,
            selection: { enabled: true },
            series: [series],
        } as AgChartOptions);
    }

    async function select(index: number) {
        const { series } = deproxy(chart!);
        chart!.setSelection([{ seriesId: series[0].id, itemId: series[0].data!.getItemIdFromIndex(index) }]);
        await waitForChartStability(chart!);
    }

    describe.each(['line', 'area'] as const)('%s', (type) => {
        it('draws the cross-filter-selected marker solid and hides the rest', async () => {
            await create(type);

            const [jan, feb, mar] = markerNodes();
            expect(jan.visible).toBe(true);
            expect(jan.size).toBeGreaterThan(0);
            expect(jan.fillOpacity).toBe(1);
            expect(feb.size).toBe(0);
            expect(mar.size).toBe(0);
        });

        it('keeps the cross-filter-selected marker solid when another datum is selected', async () => {
            await create(type);
            await select(1);

            const [jan, feb, mar] = markerNodes();
            expect(jan.size).toBeGreaterThan(0);
            // The selected datum is not hidden, though cross-filtering has unselected it.
            expect(feb.size).toBeGreaterThan(0);
            expect(feb.fillOpacity).toBeLessThan(1);
            expect(mar.size).toBe(0);
        });
    });
});
