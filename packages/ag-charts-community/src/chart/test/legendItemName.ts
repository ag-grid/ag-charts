import { deepClone } from 'ag-charts-core';
import { Caster } from 'ag-charts-test';
import { type AgChartInstance, type AgChartOptions } from 'ag-charts-types';

import { expectWarningMessages, resetMockConsole, waitForChartStability } from './utils';

type TSeries = {
    legendItemName?: string;
};
type TestLegendItemNameOptions = {
    create: (opts: AgChartOptions) => AgChartInstance;
    compare: () => Promise<void>;
    chartOptions: AgChartOptions & { series: TSeries[] };
};

function castButton(a: unknown): HTMLButtonElement {
    return new Caster(a).cast(HTMLButtonElement).value;
}

export function testLegendItemName(testOptions: TestLegendItemNameOptions) {
    beforeEach(() => {
        expect(testOptions.chartOptions.series.length).toBe(3);
    });

    describe('alfa-bravo-charlie', () => {
        let chart: AgChartInstance;
        let chartOptions: typeof testOptions.chartOptions;

        beforeEach(async () => {
            chartOptions = deepClone(testOptions.chartOptions);
            chartOptions.series[0].legendItemName = 'Alfa';
            chartOptions.series[1].legendItemName = 'Bravo';
            chartOptions.series[2].legendItemName = 'Charlie';

            chart = testOptions.create(chartOptions);
            await waitForChartStability(chart);
        });

        test('a11y text', () => {
            const a11yButtons = Array.from(document.querySelectorAll('.ag-charts-proxy-legend-toolbar button'));
            expect(a11yButtons.at(0)?.textContent).toBe('Alfa, Legend item 1 of 3');
            expect(a11yButtons.at(1)?.textContent).toBe('Bravo, Legend item 2 of 3');
            expect(a11yButtons.at(2)?.textContent).toBe('Charlie, Legend item 3 of 3');
            expect(a11yButtons.length).toBe(3);
        });

        test('compare', async () => {
            await testOptions.compare();
        });
    });

    describe('duplicates', () => {
        let chart: AgChartInstance;
        let b0: HTMLButtonElement;
        let b1: HTMLButtonElement;
        let b2: HTMLButtonElement;

        beforeEach(async () => {
            const chartOptions = deepClone(testOptions.chartOptions);
            chartOptions.series[0].legendItemName = '1';
            chartOptions.series[1].legendItemName = '1';

            resetMockConsole();
            chart = testOptions.create(chartOptions);
            await waitForChartStability(chart);

            expectWarningMessages([
                `AG Charts - legend item '1' has multiple fill colors, this may cause unexpected behaviour.`,
            ]);

            const a11yButtons = Array.from(document.querySelectorAll('.ag-charts-proxy-legend-toolbar button'));
            b0 = castButton(a11yButtons[0]);
            b1 = castButton(a11yButtons[1]);
            b2 = castButton(a11yButtons[2]);
            expect(a11yButtons.length).toBe(3);
        });

        test('a11y aria-checked', async () => {
            expect(b0.getAttribute('aria-checked')).toBe('true');
            expect(b1.getAttribute('aria-checked')).toBe('true');
            expect(b2.getAttribute('aria-checked')).toBe('true');

            b0.click();
            await waitForChartStability(chart);

            expect(b0.getAttribute('aria-checked')).toBe('false');
            expect(b1.getAttribute('aria-checked')).toBe('false');
            expect(b2.getAttribute('aria-checked')).toBe('true');
        });

        test('compare', async () => {
            b0.click();
            await waitForChartStability(chart);

            await testOptions.compare();
        });
    });
}
