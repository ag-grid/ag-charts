import { afterEach, describe, expect, it, vi } from 'vitest';

import { AgCharts } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    compareImageSnapshot,
    deproxy,
    hoverAction,
    isTooltipVisible,
    prepareFinancialTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { testLogger } from 'ag-charts-test';
import type {
    AgAnnotationsToolbarButton,
    AgChartInstance,
    AgChartTheme,
    AgFinancialChartOptions,
    AgThemeOverrides,
} from 'ag-charts-types';

import { setupEnterpriseModules } from '../../setup';
import { getStockData } from '../test/stockData';
import { totalSegmentBlocks, totalSegmentLabels } from '../test/totalSegment';
import { getIrregularVolumeProfile, getRegularVolumeProfile } from '../test/volumeProfileData';
import { priceVolume } from './priceVolumePreset';

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

const byName = (a: string, b: string) => a.localeCompare(b);

describe('priceVolumePreset', () => {
    setupMockConsole();

    let chart: AgChartInstance<AgFinancialChartOptions>;

    afterEach(() => {
        if (chart != null) {
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

    it.each([
        ['candlestick', 'candlestick'],
        ['hollow-candlestick', 'candlestick'],
        ['ohlc', 'ohlc'],
        ['line', 'line'],
        ['step-line', 'line'],
        ['hlc', 'hlc'],
        ['high-low', 'range-bar'],
    ] as const)(
        'gives the %s price series the fixed id `price` and the volume bars `volume`',
        async (chartType, priceType) => {
            chart = AgCharts.createFinancialChart(
                prepareFinancialTestOptions({
                    chartType,
                    data: getStockData().slice(0, 40),
                } as AgFinancialChartOptions)
            );
            await waitForChartStability(chart);

            const series = deproxy(chart).ctx.chartService.series;
            expect(series.map((s) => s.id).sort(byName)).toEqual(['price', 'volume']);
            expect(series.find((s) => s.id === 'volume')?.type).toBe('bar');
            expect(series.find((s) => s.id === 'price')?.type).toBe(priceType);
        }
    );

    it('keeps the fixed ids when the chart type is switched', async () => {
        chart = AgCharts.createFinancialChart(
            prepareFinancialTestOptions({
                chartType: 'candlestick',
                data: getStockData().slice(0, 40),
            } as AgFinancialChartOptions)
        );
        await waitForChartStability(chart);
        const ids = () =>
            deproxy(chart)
                .ctx.chartService.series.map((s) => s.id)
                .sort(byName);
        expect(ids()).toEqual(['price', 'volume']);

        await chart.updateDelta({ chartType: 'ohlc' });
        await waitForChartStability(chart);

        expect(ids()).toEqual(['price', 'volume']);
    });

    it('gives the price, volume and volume profile series four distinct fixed ids', async () => {
        chart = AgCharts.createFinancialChart(
            prepareFinancialTestOptions({
                data: getStockData(),
                volumeProfile: { data: getRegularVolumeProfile(), upKey: 'upVolume', downKey: 'downVolume' },
            } as AgFinancialChartOptions)
        );
        await waitForChartStability(chart);

        const ids = deproxy(chart).ctx.chartService.series.map((s) => s.id);
        ids.sort(byName);
        expect(ids).toEqual(['price', 'volume', 'volumeProfileDown', 'volumeProfileUp']);
    });

    it('keeps the preset base theme under a user theme naming no base of its own', async () => {
        const options = prepareFinancialTestOptions({
            chartType: 'candlestick',
            data: getStockData().slice(0, 40),
        } as AgFinancialChartOptions);
        const theme = options.theme as AgChartTheme;
        expect(theme.baseTheme).toBeUndefined();

        chart = AgCharts.createFinancialChart(options);
        await waitForChartStability(chart);

        // `ag-financial`'s positive colour; the default theme would resolve a green of its own.
        const { statusBar } = deproxy(chart).chartOptions.processedOptions as {
            statusBar?: { positive?: { color?: string } };
        };
        expect(statusBar?.positive?.color).toBe('#089981');
    });

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

    describe('volumeProfile', () => {
        const volumeProfile = { data: getRegularVolumeProfile(), upKey: 'upVolume', downKey: 'downVolume' };

        const VOLUME_PROFILE_EXAMPLES: Record<string, AgFinancialChartOptions> = {
            default: { data: getStockData(), volumeProfile },
            'placement right': { data: getStockData(), volumeProfile: { ...volumeProfile, placement: 'right' } },
            'width ratio': { data: getStockData(), volumeProfile: { ...volumeProfile, widthRatio: 0.25 } },
            'smaller tick size': { data: getStockData(), volumeProfile, tickSize: 1 },
            'matching tick size': { data: getStockData(), volumeProfile, tickSize: 2.5 },
            'larger tick size': { data: getStockData(), volumeProfile, tickSize: 5 },
            'total segment placement left': {
                data: getStockData(),
                volumeProfile: { ...volumeProfile, placement: 'left', totalSegment: { enabled: true } },
            },
            'total segment placement right': {
                data: getStockData(),
                volumeProfile: { ...volumeProfile, placement: 'right', totalSegment: { enabled: true } },
            },
            'irregular data': {
                data: getStockData(),
                volumeProfile: { ...volumeProfile, data: getIrregularVolumeProfile() },
            },
        };

        it.each(Object.entries(VOLUME_PROFILE_EXAMPLES))(
            'for %s it should render to canvas as expected',
            async (_exampleName, example) => {
                chart = AgCharts.createFinancialChart(prepareFinancialTestOptions({ ...example }));
                await compare();
            }
        );

        describe('total segment', () => {
            it.each(['left', 'right'] as const)(
                'should reserve a fixed-width strip for placement %s',
                async (placement) => {
                    chart = AgCharts.createFinancialChart(
                        prepareFinancialTestOptions({
                            data: getStockData(),
                            volumeProfile: { ...volumeProfile, placement },
                        })
                    );
                    await waitForChartStability(chart);
                    const widthWithout = deproxy(chart).seriesRect!.width;
                    expect(totalSegmentBlocks(chart)).toHaveLength(0);

                    await chart.updateDelta({ volumeProfile: { totalSegment: { enabled: true, width: 50 } } });
                    await waitForChartStability(chart);

                    const blocks = totalSegmentBlocks(chart);
                    expect(blocks.length).toBeGreaterThan(0);
                    expect(new Set(blocks.map((block) => block.width))).toEqual(new Set([50]));
                    expect(totalSegmentLabels(chart).length).toBeGreaterThan(0);
                    expect(widthWithout - deproxy(chart).seriesRect!.width).toBe(50);

                    await chart.updateDelta({ volumeProfile: { totalSegment: { enabled: false } } });
                    await waitForChartStability(chart);
                    expect(totalSegmentBlocks(chart)).toHaveLength(0);
                    expect(deproxy(chart).seriesRect!.width).toBe(widthWithout);
                }
            );

            it('should only draw blocks for the levels in a zoomed range', async () => {
                const create = async (initialState?: AgFinancialChartOptions['initialState']) => {
                    chart = AgCharts.createFinancialChart(
                        prepareFinancialTestOptions({
                            data: getStockData(),
                            volumeProfile: { ...volumeProfile, totalSegment: { enabled: true } },
                            initialState,
                        })
                    );
                    await waitForChartStability(chart);
                    const count = totalSegmentBlocks(chart).length;
                    chart.destroy();
                    return count;
                };

                const all = await create();
                const zoomed = await create({ zoom: { ratioY: { start: 0.5, end: 1 } } });
                expect(zoomed).toBeGreaterThan(0);
                expect(zoomed).toBeLessThan(all);
            });
        });

        it('should render no volume profile when enabled is false', async () => {
            chart = AgCharts.createFinancialChart(
                prepareFinancialTestOptions({
                    data: getStockData(),
                    volumeProfile: { ...volumeProfile, enabled: false },
                })
            );
            await compare();
        });

        it('should read the price, up and down values from the given keys', async () => {
            const data = getRegularVolumeProfile().map(({ price, upVolume, downVolume }) => ({
                level: price,
                buys: upVolume,
                sells: downVolume,
            }));
            chart = AgCharts.createFinancialChart(
                prepareFinancialTestOptions({
                    data: getStockData(),
                    volumeProfile: { data, priceKey: 'level', upKey: 'buys', downKey: 'sells' },
                })
            );
            await compare();
        });
    });

    describe('volume profile status bar', () => {
        interface NodeDatum {
            datumIndex: number;
            x: number;
            y: number;
            width: number;
            height: number;
            centerX?: number;
        }

        const volumeProfile = { data: getRegularVolumeProfile(), upKey: 'upVolume', downKey: 'downVolume' };

        // Levels run highest price first, so index 2 is 200 and index 21 is 152.5, which has no volume.
        const LEVEL_200 = 2;
        const EMPTY_LEVEL = 21;
        const BLOCK_LAYOUT = {
            overrides: { common: { statusBar: { layoutStyle: 'block' } } },
        } as AgFinancialChartOptions['theme'];

        const create = async (options: Partial<AgFinancialChartOptions>, width?: number) => {
            const prepared = prepareFinancialTestOptions({
                data: getStockData(),
                ...options,
            } as AgFinancialChartOptions);
            chart = AgCharts.createFinancialChart({ ...prepared, width: width ?? prepared.width });
            await waitForChartStability(chart);
        };

        const nodeCentre = (type: string, yKey: string | undefined, datumIndex: number) => {
            const series = deproxy(chart).ctx.chartService.series.find(
                (s) => s.type === type && (yKey == null || s.options.yKey === yKey)
            );
            expect(series).toBeDefined();
            const { nodeData } = (series as unknown as { contextNodeData: { nodeData: NodeDatum[] } }).contextNodeData;
            const node = nodeData.find((n) => n.datumIndex === datumIndex);
            expect(node).toBeDefined();
            const { x, y } = deproxy(chart).ctx.chartService.seriesRect!;
            return {
                x: x + (node!.centerX ?? node!.x + node!.width / 2),
                y: y + node!.y + node!.height / 2,
            };
        };

        // The pointer sits over a candle's column, at the height of a level's bar.
        const hoverCandleAtLevel = async (candleIndex: number, levelIndex: number) => {
            const { x } = nodeCentre('candlestick', undefined, candleIndex);
            const { y } = nodeCentre('bar', 'upVolume', levelIndex);
            await hoverAction(x, y)(deproxy(chart));
            await waitForChartStability(chart);
        };

        const expectProfileNotHovered = () => {
            const highlight = deproxy(chart).ctx.highlightManager.getActiveHighlight();
            expect(['upVolume', 'downVolume']).not.toContain(highlight?.yKey);
            expect(isTooltipVisible(deproxy(chart))).toBe(false);
        };

        it('should render the hovered level in the status bar', async () => {
            await create({ volumeProfile });
            await hoverCandleAtLevel(50, LEVEL_200);

            expectProfileNotHovered();
            await compare();
        });

        it('should size each field for the widest level, not the largest value', async () => {
            // The 200 level totals 999.00K, which is wider than the 1.00M of the largest level.
            const volumes: Record<number, [number, number]> = { 197.5: [500_000, 500_000], 200: [600_000, 399_000] };
            const data = getRegularVolumeProfile().map(({ price }) => {
                const [upVolume, downVolume] = volumes[price] ?? [50_000, 50_000];
                return { price, upVolume, downVolume };
            });
            data.push({ price: 95, upVolume: 1_000, downVolume: 1_000 });
            await create({ volumeProfile: { data, upKey: 'upVolume', downKey: 'downVolume' } });
            await hoverCandleAtLevel(50, LEVEL_200);

            await compare();
        });

        it('should render only the hovered candle over a level without volume', async () => {
            await create({ volumeProfile });
            await hoverCandleAtLevel(50, EMPTY_LEVEL);

            await compare();
        });

        it('should render the level on a second line on a narrow chart', async () => {
            await create({ volumeProfile }, 450);
            await hoverCandleAtLevel(50, LEVEL_200);

            await compare();
        });

        it('should render the level on no more than two lines, reserved in a block layout, on a very narrow chart', async () => {
            await create({ volumeProfile, theme: BLOCK_LAYOUT }, 300);
            await hoverCandleAtLevel(50, LEVEL_200);

            await compare();
        });

        it('should render no level when the status bar is off', async () => {
            await create({ volumeProfile, statusBar: false });
            const { x, y } = nodeCentre('bar', 'upVolume', LEVEL_200);
            await hoverAction(x, y)(deproxy(chart));
            await waitForChartStability(chart);

            expectProfileNotHovered();
            await compare();
        });

        it('should render no level when the volume profile is disabled', async () => {
            await create({ volumeProfile: { ...volumeProfile, enabled: false } });
            const { x, y } = nodeCentre('candlestick', undefined, 50);
            await hoverAction(x, y)(deproxy(chart));
            await waitForChartStability(chart);

            await compare();
        });
    });

    describe('hlc chart type', () => {
        const volumeProfile = { data: getRegularVolumeProfile(), upKey: 'upVolume', downKey: 'downVolume' };

        const HLC_EXAMPLES: Record<string, AgFinancialChartOptions> = {
            'volume and volume profile': { volume: true, volumeProfile },
            'volume only': { volume: true },
            'volume profile only': { volume: false, volumeProfile },
            'neither volume nor volume profile': { volume: false },
        };

        it.each(Object.entries(HLC_EXAMPLES))(
            'with %s it should render a single hlc series',
            async (_exampleName, example) => {
                chart = AgCharts.createFinancialChart(
                    prepareFinancialTestOptions({ chartType: 'hlc', data: getStockData(), ...example })
                );
                await compare();

                const { series } = deproxy(chart).chartOptions.processedOptions as {
                    series: Array<{
                        type: string;
                        xKey?: string;
                        highKey?: string;
                        lowKey?: string;
                        closeKey?: string;
                    }>;
                };
                const hlcSeries = series.filter((s) => s.type === 'hlc');
                expect(hlcSeries).toHaveLength(1);
                expect(hlcSeries[0]).toMatchObject({
                    xKey: 'date',
                    highKey: 'high',
                    lowKey: 'low',
                    closeKey: 'close',
                });
                expect(series.filter((s) => s.type === 'range-area' || s.type === 'line')).toHaveLength(0);
            }
        );
    });

    describe('price crosshair', () => {
        const TICK_SIZE = 2.5;
        const HOVER_YS = [180, 223, 266, 311];

        const crosshairLabel = (axisId: string) =>
            document.querySelector<HTMLElement>(
                `.ag-charts-crosshair-label[data-axis-id="${axisId}"]:not(.ag-charts-crosshair-label--hidden)`
            );

        const hoverLabels = async (options: AgFinancialChartOptions) => {
            chart = AgCharts.createFinancialChart(prepareFinancialTestOptions({ data: getStockData(), ...options }));
            await waitForChartStability(chart);
            const labels: Array<{ price?: string; priceTop?: string; date?: string }> = [];
            for (const y of HOVER_YS) {
                await hoverAction(300, y)(deproxy(chart));
                await waitForChartStability(chart);
                const priceLabel = crosshairLabel('y');
                labels.push({
                    price: priceLabel?.textContent?.trim(),
                    priceTop: priceLabel?.style.top,
                    date: crosshairLabel('x')?.textContent?.trim(),
                });
            }
            return labels;
        };

        const isTickMultiple = (text: string | undefined) => {
            const ticks = Number(text) / TICK_SIZE;
            return Math.abs(ticks - Math.round(ticks)) < 1e-9;
        };

        it.each<[string, AgFinancialChartOptions]>([
            ['with volume', {}],
            ['candlestick without volume', { volume: false, chartType: 'candlestick' }],
            ['ohlc without volume', { volume: false, chartType: 'ohlc' }],
            ['hlc without volume', { volume: false, chartType: 'hlc' }],
            ['line without volume', { volume: false, chartType: 'line' }],
            ['high-low without volume', { volume: false, chartType: 'high-low' }],
        ])('snaps the price label to multiples of tickSize %s', async (_name, options) => {
            const labels = await hoverLabels({ ...options, tickSize: TICK_SIZE });
            const prices = labels.map((l) => l.price);
            expect(prices.every(isTickMultiple)).toBe(true);
            expect(new Set(prices).size).toBeGreaterThan(1);
            expect(labels.map((l) => l.priceTop)).not.toEqual(HOVER_YS.map((y) => `${y}px`));
        });

        it.each<[string, AgFinancialChartOptions]>([
            ['without tickSize', {}],
            [
                'when theme overrides turn snap off',
                {
                    tickSize: TICK_SIZE,
                    theme: { overrides: { common: { axes: { number: { crosshair: { snap: false } } } } } },
                },
            ],
        ])('follows the pointer continuously %s', async (_name, options) => {
            const labels = await hoverLabels(options);
            expect(labels.every((l) => l.price != null)).toBe(true);
            expect(labels.map((l) => l.price).every(isTickMultiple)).toBe(false);
            expect(labels.map((l) => l.priceTop)).toEqual(HOVER_YS.map((y) => `${y}px`));
        });

        it('snaps within a zoomed range', async () => {
            const labels = await hoverLabels({
                tickSize: TICK_SIZE,
                initialState: { zoom: { ratioX: { start: 0.6, end: 0.8 }, ratioY: { start: 0.4, end: 0.6 } } },
            });
            expect(labels.map((l) => l.price).every(isTickMultiple)).toBe(true);
        });

        it.each<[string, AgFinancialChartOptions, boolean]>([
            ['snapped with tickSize', { tickSize: TICK_SIZE }, true],
            [
                'continuous when theme overrides turn snap off',
                {
                    tickSize: TICK_SIZE,
                    theme: { overrides: { common: { axes: { number: { crosshair: { snap: false } } } } } },
                },
                false,
            ],
        ])('adds a horizontal line from the price axis button %s', async (_name, options, snapped) => {
            const labels = await hoverLabels(options);
            const button = document.querySelector<HTMLElement>(
                '.ag-charts-annotations__axis-button:not(.ag-charts-annotations__axis-button--hidden)'
            );
            expect(button).not.toBeNull();
            button!.click();
            await waitForChartStability(chart);

            const { annotations } = chart.getState();
            expect(annotations).toMatchObject([{ type: 'horizontal-line' }]);
            const value = annotations![0].type === 'horizontal-line' ? annotations![0].value : undefined;
            expect(Number(value).toFixed(2)).toBe(labels.at(-1)?.price);
            expect(isTickMultiple(String(value))).toBe(snapped);
        });

        it('leaves the date label unchanged', async () => {
            const snapped = await hoverLabels({ tickSize: TICK_SIZE });
            chart.destroy();
            const continuous = await hoverLabels({});
            expect(snapped.map((l) => l.date)).toEqual(continuous.map((l) => l.date));
            expect(snapped.every((l) => l.date != null)).toBe(true);
        });
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
