import { afterEach, describe, expect, it, vi } from 'vitest';

import { AgCharts } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    compareImageSnapshot,
    deproxy,
    prepareFinancialTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { testLogger } from 'ag-charts-test';
import type {
    AgAnnotationsToolbarButton,
    AgChartInstance,
    AgFinancialChartOptions,
    AgThemeOverrides,
} from 'ag-charts-types';

import { setupEnterpriseModules } from '../setup';
import { priceVolume } from './priceVolumePreset';
import { getStockData } from './test/stockData';

const EXAMPLES: Record<string, AgFinancialChartOptions> = {
    minimal: { data: getStockData() },
    // 'with-navigator': { data: getStockData(), navigator: true },
    candlestick: { chartType: 'candlestick', data: getStockData().slice(0, 40) },
    'hollow-candlestick': { chartType: 'hollow-candlestick', data: getStockData().slice(0, 40) },
    ohlc: { chartType: 'ohlc', data: getStockData().slice(0, 40) },
    line: { chartType: 'line', data: getStockData().slice(0, 40) },
    'step-line': { chartType: 'step-line', data: getStockData().slice(0, 40) },
    hlc: { chartType: 'hlc', data: getStockData().slice(0, 40) },
    'high-low': { chartType: 'high-low', data: getStockData().slice(0, 40) },
    'with-formatter': {
        chartType: 'candlestick',
        data: getStockData().slice(0, 40),
        formatter: (params: { value: unknown }) =>
            typeof params.value === 'number' ? `$${params.value.toFixed(0)}` : undefined,
    },
};

setupEnterpriseModules();

describe('priceVolumePreset', () => {
    setupMockConsole();

    let chart: AgChartInstance<AgFinancialChartOptions>;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        vi.restoreAllMocks();
    });

    const ctx = setupMockCanvas();

    const compare = async () => {
        await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
    };

    const snapshot = async () => {
        await waitForChartStability(chart);

        return ctx.snapshot();
    };

    const compareImageDataUrl = async () => {
        await waitForChartStability(chart);
        const reference = await snapshot();

        const canvasCount = ctx.getActiveCanvasInstances().length;

        const imageURL = await chart.getImageDataURL();
        const imagePNGData = Buffer.from(imageURL.split(',')[1], 'base64');
        expect(imagePNGData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);

        const imageRaw = ctx.getActiveCanvasInstances()[canvasCount];
        expect(imageRaw.getContext('2d').getImageData(0, 0, imageRaw.width, imageRaw.height)).toMatchImage(reference);
    };

    // Minimal view of the (private) StatusBar label structure read by the status-bar text accessor.
    interface StatusBarLabels {
        labels: Array<{ title?: { text?: string }; value: { text?: string } }>;
    }

    const statusBarLabelText = (instance: AgChartInstance<AgFinancialChartOptions>, title: string) => {
        const statusBar = deproxy(instance).modulesManager.getModule<StatusBarLabels>('statusBar');
        return statusBar?.labels.find((label) => label.title?.text === title)?.value.text;
    };

    it('renders a bigint volume in the status bar with full precision (AG-16608)', async () => {
        // A bigint volume must produce a Vol readout formatted identically to its number equivalent;
        // Intl.NumberFormat accepts bigint directly.
        const numberData = getStockData()
            .slice(0, 40)
            .map((d) => ({ ...d, volume: Math.round(d.volume) }));
        const bigintData = numberData.map((d) => ({ ...d, volume: BigInt(d.volume) }));

        const volumeText = async (data: unknown[]) => {
            const instance = AgCharts.createFinancialChart(
                prepareFinancialTestOptions({ chartType: 'candlestick', data } as AgFinancialChartOptions)
            );
            try {
                await waitForChartStability(instance);
                return statusBarLabelText(instance, 'Vol');
            } finally {
                instance.destroy();
            }
        };

        const bigintVolume = await volumeText(bigintData);
        const numberVolume = await volumeText(numberData);

        expect(bigintVolume).toBeTruthy();
        expect(bigintVolume).toBe(numberVolume);
    });

    describe('#createFinancialChart', () => {
        it.each(Object.entries(EXAMPLES))(
            'for %s it should create chart instance as expected',
            async (_exampleName, example) => {
                const options: AgFinancialChartOptions = { ...example };
                prepareFinancialTestOptions(options);

                chart = AgCharts.createFinancialChart(options);
                await waitForChartStability(chart);
            }
        );

        it.each(Object.entries(EXAMPLES))(
            'for %s it should render to canvas as expected',
            async (_exampleName, example) => {
                const options: AgFinancialChartOptions = { ...example };
                prepareFinancialTestOptions(options);

                chart = AgCharts.createFinancialChart(options);
                await compare();
            }
        );

        it.each(Object.entries(EXAMPLES))(
            'for %s it should export image data url as expected (AG-12985)',
            async (_exampleName, example) => {
                const options: AgFinancialChartOptions = { ...example };
                prepareFinancialTestOptions(options);

                chart = AgCharts.createFinancialChart(options);
                await compareImageDataUrl();
            }
        );
    });

    describe('toolbar button theme override (AG-17364)', () => {
        const userButtons: AgAnnotationsToolbarButton[] = [
            { icon: 'trend-line-drawing', tooltip: 'toolbarAnnotationsLineAnnotations', value: 'line-menu' },
            { icon: 'text-annotation', tooltip: 'toolbarAnnotationsTextAnnotations', value: 'text-menu' },
            { icon: 'delete', tooltip: 'toolbarAnnotationsClearAll', value: 'clear' },
        ];

        const presetButtons = (overrides?: AgThemeOverrides) =>
            priceVolume({ data: getStockData() }, undefined, () => ({}) as any, overrides, testLogger).annotations
                ?.toolbar?.buttons;

        it('prefers the user-specified buttons from the theme overrides', () => {
            const buttons = presetButtons({
                common: { annotations: { toolbar: { buttons: userButtons } } },
            });
            expect(buttons).toEqual(userButtons);
        });

        it('falls back to the six default buttons without an override', () => {
            expect(presetButtons()).toHaveLength(6);
            expect(presetButtons({ common: {} })).toHaveLength(6);
        });
    });
});
