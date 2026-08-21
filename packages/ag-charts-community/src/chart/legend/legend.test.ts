import { afterEach, describe, expect, it, test, vi } from 'vitest';

import type {
    AgCartesianChartOptions,
    AgChartLegendItemOptions,
    AgChartLegendListeners,
    AgChartLegendPosition,
    AgChartOptions,
    AgLineSeriesOptions,
    AgMarkerShapeFnParams,
    AgPath,
} from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import type { Chart } from '../chart';
import { InteractionState } from '../interaction/interactionManager';
import * as examples from '../test/examples';
import { seedRandom } from '../test/random';
import type { AgChartProxy } from '../test/utils';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    clickAction,
    compareImageSnapshot,
    computeLegendBBox,
    createChart,
    deproxy,
    doubleClickAction,
    doubleTapAction,
    getLegendModule,
    getTooltipElement,
    hoverAction,
    isTooltipVisible,
    looserSnapshotDefaults,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationManager,
    tapAction,
    waitForChartStability,
} from '../test/utils';

function buildSeries(data: { x: number; y: number }): AgLineSeriesOptions {
    return {
        type: 'line',
        data: [data],
        xKey: 'x',
        yKey: 'y',
        yName: String(data.x),
    };
}

const SERIES: AgLineSeriesOptions[] = [];
const seriesDataRandom = seedRandom(10763960837);

for (let i = 0; i < 200; i++) {
    SERIES.push(buildSeries({ x: i, y: Math.floor(seriesDataRandom() * 100) }));
}

const OPTIONS: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Browser Usage Statistics',
    },
    subtitle: {
        text: '2009-2019',
    },
    series: SERIES,
};

function agChartsLogo({ path, size, x, y }: AgMarkerShapeFnParams) {
    const pathData = [
        'M0.480769 0.846154V0.692308H0.211538L0.134615 0.769423V0.846154H0.480769Z',
        'M0 0.615385V0.769L0.134615 0.769231L0.288308 0.615385L0 0.614481V0.615385Z',
        'M1 0.384615V0.230769H0.673077L0.596154 0.307692L0.519231 0.384615H1Z',
        'M0.596154 0.307692L0.673077 0.230769V0.153846H0.0961538V0.307692H0.596154Z',
        'M0.711538 0.615385V0.461635H0.442308L0.383074 0.520772L0.365385 0.538462H0.365356L0.288308 0.615385H0.711538Z',
        'M0.192308 0.384615V0.538462H0.365356L0.383074 0.520772L0.519231 0.384615H0.192308Z',
    ].join('');
    updatePath(pathData, path, size, x, y);
}

function npmLogo({ path, size, x, y }: AgMarkerShapeFnParams) {
    const pathData = 'M0.8325 0.8325H0.6993V0.2997H0.4995V0.8325H0.1665V0.1665H0.8325V0.8325Z';
    updatePath(pathData, path, size, x, y);
}

function updatePath(pathData: string, path: AgPath, scale: number, x: number, y: number) {
    path.clear();

    let x0 = 0;
    let y0 = 0;
    for (const { 1: command, 2: coordinateString } of pathData.matchAll(/([a-z])([^a-z]*)/gi)) {
        const coordinates = Array.from(
            coordinateString.matchAll(/([\d.]+)/g),
            (m) => (Number.parseFloat(m[0]) - 0.5) * scale
        );

        const relative = command === command.toLowerCase();
        const dx = relative ? x0 : 0;
        const dy = relative ? y0 : 0;

        switch (command.toLowerCase()) {
            case 'm':
                x0 = x + coordinates[0] + dx;
                y0 = y + coordinates[1] + dy;
                path.moveTo(x0, y0);
                break;
            case 'l':
                x0 = x + coordinates[0] + dx;
                y0 = y + coordinates[1] + dy;
                path.lineTo(x0, y0);
                break;
            case 'v':
                y0 = y + coordinates[0] + dy;
                path.lineTo(x0, y0);
                break;
            case 'h':
                x0 = x + coordinates[0] + dx;
                path.lineTo(x0, y0);
                break;
            case 'z':
                path.closePath();
                break;
        }
    }
}

describe('Legend', () => {
    setupMockConsole();
    let chart: Chart;

    afterEach(async () => {
        if (chart) {
            await waitForChartStability(chart);
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const compare = async (chartInstance: Chart, customSnapshotIdentifier?: string, useLooserDefaults = false) => {
        const defaults = useLooserDefaults ? looserSnapshotDefaults(0.06, 550) : IMAGE_SNAPSHOT_DEFAULTS;
        await compareImageSnapshot(chartInstance, ctx, { ...defaults, customSnapshotIdentifier });
    };

    const compareSnapshot = async (options: AgChartOptions) => {
        chart = await createChart(options);
        await compareImageSnapshot(chart, ctx, { ...IMAGE_SNAPSHOT_DEFAULTS, failureThreshold: 0 });
    };

    describe('Large series count chart', () => {
        it.each([800, 600, 400, 200])('should render legend correctly at width [%s]', async (width) => {
            const options = {
                ...examples.LINE_GRAPH_WITH_GAPS_EXAMPLE,
            };

            prepareTestOptions(options);
            options.width = width ?? options.width;

            chart = deproxy(AgCharts.create(options) as AgChartProxy);
            await compare(chart);
        });
    });

    describe('Large series count chart legend pagination', () => {
        const positions = ['right' as const, 'bottom' as const];

        it.each(positions)('should render legend correctly at position [%s]', async (position) => {
            const options = {
                ...OPTIONS,
                legend: {
                    position,
                },
            };
            chart = await createChart(options);
            await compare(chart);
        });
    });

    describe('Clicks', () => {
        let x: number, y: number;
        beforeEach(async () => {
            chart = await createChart({ ...examples.GROUPED_COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS });
            const box = computeLegendBBox(chart);
            x = box.x;
            y = box.y;
        });

        describe('Clicking a legend', () => {
            it('should hide the related series', async () => {
                await clickAction(x, y)(chart);
                await compare(chart, 'clicks-1-hidden');
            });

            it('when clicked twice should hide and re-show the related series', async () => {
                await clickAction(x, y)(chart);
                await waitForChartStability(chart);

                await clickAction(x, y)(chart);
                await compare(chart, 'clicks-all-shown');
            });
        });

        describe('Double clicking a legend', () => {
            it('should hide all other series except this one', async () => {
                await doubleClickAction(x, y)(chart);
                await compare(chart, 'clicks-1-shown');
            });

            it('when double clicked twice should show all series', async () => {
                await doubleClickAction(x, y)(chart);
                await waitForChartStability(chart);

                await clickAction(x, y)(chart);
                await waitForChartStability(chart);

                await doubleClickAction(x, y)(chart);
                await compare(chart, 'clicks-all-shown');
            });
        });

        describe('Tapping a legend', () => {
            it('should hide the related series', async () => {
                await tapAction(x, y)(chart);
                await compare(chart, 'clicks-1-hidden');
            });

            it('when clicked twice should hide and re-show the related series', async () => {
                await tapAction(x, y)(chart);
                await waitForChartStability(chart);

                await tapAction(x, y)(chart);
                await compare(chart, 'clicks-all-shown');
            });
        });

        describe('Double tapping a legend', () => {
            it('should hide all other series except this one', async () => {
                await doubleTapAction(x, y)(chart);
                await compare(chart, 'clicks-1-shown');
            });

            it('when double tapped twice should show all series', async () => {
                await doubleTapAction(x, y)(chart);
                await waitForChartStability(chart);

                await clickAction(x, y)(chart);
                await waitForChartStability(chart);

                await doubleTapAction(x, y)(chart);
                await compare(chart, 'clicks-all-shown');
            });
        });
    });

    describe('Hover over legend', () => {
        it('should change the cursor when entering and leaving the legend rect', () => {
            const options = {
                ...examples.GROUPED_COLUMN_NUMBER_X_AXIS_NUMBER_Y_AXIS,
            };

            prepareTestOptions(options);

            chart = deproxy(AgCharts.create(options));

            const legendButtons = document.querySelectorAll('button.ag-charts-proxy-elem[role="switch"]');
            for (const button of Array.from(legendButtons) as HTMLElement[]) {
                expect(button).toBeInstanceOf(HTMLButtonElement);
                expect(button.style.cursor).toBe('pointer');
            }
        });
    });

    describe('Listeners', () => {
        const listeners: AgChartLegendListeners = {};

        beforeEach(async () => {
            listeners.legendItemClick = vi.fn();
            listeners.legendItemDoubleClick = vi.fn();
            const options = prepareTestOptions({
                data: [{ x: 'Q1', y: 200 }],
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                legend: { enabled: true, listeners },
            });
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
        });

        test('mouse', async () => {
            await doubleClickAction(400, 570)(chart);
            expect(listeners.legendItemClick).toHaveBeenCalledTimes(2);
            expect(listeners.legendItemDoubleClick).toHaveBeenCalledTimes(1);
        });

        test('touch', async () => {
            await doubleTapAction(400, 570)(chart);
            expect(listeners.legendItemClick).toHaveBeenCalledTimes(2);
            expect(listeners.legendItemDoubleClick).toHaveBeenCalledTimes(1);
        });
    });

    describe('showSeriesStroke', () => {
        const data = [
            { x: 'Q1', a: 20, b: 10 },
            { x: 'Q2', a: 30, b: 27 },
            { x: 'Q3', a: 35, b: 16 },
            { x: 'Q4', a: 40, b: 20 },
        ];

        test('lines', async () => {
            await compareSnapshot({
                data,
                series: [
                    { type: 'line', xKey: 'x', yKey: 'a', stroke: 'palegreen' },
                    { type: 'line', xKey: 'x', yKey: 'b', stroke: 'blue' },
                ],
                legend: { item: { showSeriesStroke: true } },
            });
        });

        test('areas', async () => {
            await compareSnapshot({
                data,
                series: [
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'a',
                        strokeWidth: 2,
                        stroke: 'palegreen',
                        fill: '#f0e0e0',
                        marker: { enabled: true, fill: 'seagreen' },
                    },
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'b',
                        strokeWidth: 2,
                        stroke: 'blue',
                        fill: '#e1e1ff',
                        marker: { enabled: true, fill: 'fuchsia' },
                    },
                ],
                legend: { item: { showSeriesStroke: true } },
            });
        });

        test('combination', async () => {
            await compareSnapshot({
                data,
                series: [
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'a',
                        strokeWidth: 2,
                        stroke: 'palegreen',
                        fill: '#f0e0e0',
                        marker: { enabled: true },
                    },
                    { type: 'line', xKey: 'x', yKey: 'b', stroke: 'blue' },
                ],
                legend: { item: { showSeriesStroke: true } },
            });
        });

        test('no-markers', async () => {
            await compareSnapshot({
                data,
                series: [
                    { type: 'area', marker: { enabled: false }, xKey: 'x', yKey: 'a' },
                    { type: 'line', marker: { enabled: false }, xKey: 'x', yKey: 'b', stroke: 'blue' },
                ],
                legend: { item: { showSeriesStroke: true } },
            });
        });

        test('lineDash', async () => {
            await compareSnapshot({
                data,
                series: [
                    { type: 'line', xKey: 'x', yKey: 'a', marker: { enabled: false }, lineDash: [5, 5] },
                    { type: 'area', xKey: 'x', yKey: 'b', strokeWidth: 2, lineDash: [2, 2] },
                ],
                legend: { item: { showSeriesStroke: true } },
            });
        });

        test('line strokeWidth override', async () => {
            await compareSnapshot({
                data,
                series: [
                    { type: 'line', xKey: 'x', yKey: 'a', strokeWidth: 1, marker: { enabled: false } },
                    { type: 'area', xKey: 'x', yKey: 'b', strokeWidth: 1 },
                ],
                legend: {
                    item: {
                        showSeriesStroke: true,
                        line: { strokeWidth: 8 },
                    },
                },
            });
        });

        test('line length', async () => {
            await compareSnapshot({
                data,
                series: [
                    { type: 'line', xKey: 'x', yKey: 'a', strokeWidth: 1 },
                    { type: 'area', xKey: 'x', yKey: 'b', strokeWidth: 1 },
                ],
                legend: {
                    item: {
                        showSeriesStroke: true,
                        line: { length: 35 },
                    },
                },
            });
        });
    });

    describe('Large faded symbols', () => {
        test('strokeWidth: 10', async () => {
            await compareSnapshot({
                data: [
                    { x: 'x1', a: 1, b: 2 },
                    { x: 'x2', a: 1, b: 2 },
                ],
                series: [
                    { type: 'line', visible: false, xKey: 'x', yKey: 'a', marker: { shape: 'diamond' } },
                    { type: 'line', visible: false, xKey: 'x', yKey: 'b', marker: { shape: 'triangle' } },
                ],
                legend: { item: { marker: { size: 30, strokeWidth: 10 }, line: { length: 70 } } },
            });
        });
    });

    describe('Item disabledStyle', () => {
        const disabledStyleData = [
            { x: 'x1', a: 1, b: 2 },
            { x: 'x2', a: 3, b: 2 },
        ];

        const withLegendItem = (item: AgChartLegendItemOptions): AgChartOptions => ({
            data: disabledStyleData,
            series: [
                { type: 'line', xKey: 'x', yKey: 'a', visible: false, marker: { enabled: true } },
                { type: 'line', xKey: 'x', yKey: 'b', marker: { enabled: true } },
            ],
            legend: { item: { showSeriesStroke: true, ...item } },
        });

        // The toggled-off item is the first one; the second stays enabled so every case also
        // asserts that the enabled item is left alone.
        const disabledItem = async (item: AgChartLegendItemOptions) => {
            chart = await createChart(withLegendItem(item));
            return getLegendModule(chart).itemSelection.nodes();
        };

        test('marker fill applies to the marker only', async () => {
            await compareSnapshot(withLegendItem({ marker: { disabledStyle: { fill: '#767676' } } }));
        });

        test('label color applies to the label only', async () => {
            await compareSnapshot(withLegendItem({ label: { disabledStyle: { color: '#767676' } } }));
        });

        test('line stroke and lineDash apply to the line only', async () => {
            await compareSnapshot(withLegendItem({ line: { disabledStyle: { stroke: '#767676', lineDash: [3, 3] } } }));
        });

        test('colour-only greying leaves the disabled item at full contrast', async () => {
            await compareSnapshot(
                withLegendItem({
                    marker: { disabledStyle: { fill: '#767676', stroke: '#767676', opacity: 1 } },
                    line: { disabledStyle: { stroke: '#767676', opacity: 1 } },
                    label: { disabledStyle: { color: '#595959', opacity: 1 } },
                })
            );
        });

        it('should dim a toggled-off item as a whole when no disabledStyle is set', async () => {
            const [disabled, enabled] = await disabledItem({});

            // The item group carries the dim and the label keeps its own 0.5 on top.
            expect(disabled.opacity).toBe(0.5);
            expect(disabled.marker?.fillOpacity).toBe(1);
            expect(disabled.line?.strokeOpacity).toBe(1);
            expect(disabled.labelOpacity).toBe(0.5);

            expect(enabled.opacity).toBe(1);
            expect(enabled.marker?.fillOpacity).toBe(1);
            expect(enabled.line?.strokeOpacity).toBe(1);
            expect(enabled.labelOpacity).toBe(1);
        });

        it('should treat opacity as absolute, per sub-element, once any disabledStyle is set', async () => {
            const [disabled] = await disabledItem({ marker: { disabledStyle: { opacity: 1 } } });

            // The group dim is lifted so a sub-element opacity is absolute rather than a multiplier.
            expect(disabled.opacity).toBe(1);
            expect(disabled.marker?.fillOpacity).toBe(1);
            expect(disabled.line?.strokeOpacity).toBe(0.5);
            expect(disabled.labelOpacity).toBe(0.5);
        });

        it('should fall back per property when disabledStyle is partial', async () => {
            const [disabled] = await disabledItem({ marker: { disabledStyle: { fill: '#767676' } } });

            expect(disabled.opacity).toBe(1);
            expect(disabled.marker?.fill).toBe('#767676');
            expect(disabled.marker?.fillOpacity).toBe(0.5);
            expect(disabled.labelOpacity).toBe(0.5);
        });

        it('should restore the enabled appearance when the item is toggled back on', async () => {
            chart = await createChart({
                data: disabledStyleData,
                series: [
                    { type: 'line', xKey: 'x', yKey: 'a', marker: { enabled: true } },
                    { type: 'line', xKey: 'x', yKey: 'b', marker: { enabled: true } },
                ],
                legend: { item: { showSeriesStroke: true, marker: { disabledStyle: { fill: '#767676' } } } },
            });

            const nodes = () => getLegendModule(chart).itemSelection.nodes();
            const enabledFill = nodes()[0].marker?.fill;
            const box = computeLegendBBox(chart);

            await clickAction(box.x, box.y)(chart);
            await waitForChartStability(chart);
            expect(nodes()[0].marker?.fill).toBe('#767676');

            await clickAction(box.x, box.y)(chart);
            await waitForChartStability(chart);
            expect(nodes()[0].marker?.fill).toBe(enabledFill);
            expect(nodes()[0].marker?.fillOpacity).toBe(1);
            expect(nodes()[0].labelOpacity).toBe(1);
        });

        it('should let chart options override a theme override', async () => {
            chart = await createChart({
                ...withLegendItem({ marker: { disabledStyle: { fill: '#111111' } } }),
                theme: {
                    overrides: {
                        common: { legend: { item: { marker: { disabledStyle: { fill: '#eeeeee' } } } } },
                    },
                },
            });

            const [disabled] = getLegendModule(chart).itemSelection.nodes();
            expect(disabled.marker?.fill).toBe('#111111');
        });

        it('should apply a theme override when chart options do not set one', async () => {
            chart = await createChart({
                ...withLegendItem({}),
                theme: {
                    overrides: {
                        common: { legend: { item: { marker: { disabledStyle: { fill: '#eeeeee' } } } } },
                    },
                },
            });

            const [disabled] = getLegendModule(chart).itemSelection.nodes();
            expect(disabled.marker?.fill).toBe('#eeeeee');
        });
    });

    describe('Container', () => {
        it('should render as expected', async () => {
            await compareSnapshot({
                data: [
                    { x: 'x1', a: 1, b: 2 },
                    { x: 'x2', a: 1, b: 2 },
                ],
                series: [
                    { type: 'line', xKey: 'x', yKey: 'a' },
                    { type: 'area', xKey: 'x', yKey: 'b' },
                ],
                legend: {
                    border: {
                        stroke: 'red',
                        strokeWidth: 8,
                    },
                    cornerRadius: 16,
                    fill: 'green',
                    fillOpacity: 0.2,
                    padding: 8,
                },
            });
        });
    });

    describe('AG-12614', () => {
        test('updateDelta line to bar', async () => {
            const options: AgChartOptions = prepareTestOptions({
                title: { text: 'Chinese Olympic medals' },
                data: [
                    { year: '2016', gold: 26, silver: 18, bronze: 26 },
                    { year: '2020', gold: 38, silver: 32, bronze: 19 },
                    { year: '2024', gold: 40, silver: 27, bronze: 24 },
                ],
                series: [
                    { type: 'line', xKey: 'year', yKey: 'gold' },
                    { type: 'line', xKey: 'year', yKey: 'silver' },
                    { type: 'line', xKey: 'year', yKey: 'bronze' },
                ],
            });

            const chartInstance = AgCharts.create(options);
            chart = deproxy(chartInstance);
            await compare(chart);

            await chartInstance.updateDelta({
                ...options,
                series: [
                    { type: 'bar', xKey: 'year', yKey: 'gold' },
                    { type: 'bar', xKey: 'year', yKey: 'silver' },
                    { type: 'bar', xKey: 'year', yKey: 'bronze' },
                ],
            });
            await compare(chart);
        });
    });

    describe('AG-12693', () => {
        test('custom marker shapes', async () => {
            const options = prepareTestOptions({
                data: [
                    { x: 0, ag: 2, npm: 3 },
                    { x: 1, ag: 6, npm: 7 },
                    { x: 2, ag: 5, npm: 1 },
                ],
                series: [
                    { type: 'scatter', xKey: 'x', yKey: 'ag', shape: agChartsLogo, size: 20 },
                    { type: 'scatter', xKey: 'x', yKey: 'npm', shape: npmLogo, size: 20 },
                ],
            });
            chart = deproxy(AgCharts.create(options));
            // Looser threshold for scene-graph churn.
            await compare(chart, 'ag-12693-both-visible', true);

            const [x_ag, x_npm, y] = [357, 428, 575];

            await clickAction(x_ag, y)(chart);
            await compare(chart, 'ag-12693-one-visible');

            await clickAction(x_npm, y)(chart);
            await compare(chart, 'ag-12693-none-visible');

            await clickAction(x_ag, y)(chart);
            await clickAction(x_npm, y)(chart);
            // Looser threshold for scene-graph churn.
            await compare(chart, 'ag-12693-both-visible', true);
        });
    });

    describe('AG-13753', () => {
        test('single item legend', async () => {
            const legendItemClick = vi.fn();
            const options = prepareTestOptions({
                data: [{ x: 'Q1', y: 200 }],
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                legend: { enabled: true, listeners: { legendItemClick } },
            });

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            await clickAction(400, 570)(chart);
            expect(legendItemClick).toHaveBeenCalledTimes(1);
        });
    });

    describe('AG-13342', () => {
        test('legend click parameters', async () => {
            const legendItemClick = vi.fn();
            const options = prepareTestOptions({
                data: [{ x: 'Q1', y: 200 }],
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                legend: { enabled: true, listeners: { legendItemClick } },
            });

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            await clickAction(400, 570)(chart);

            expect(legendItemClick.mock.lastCall![0]).toMatchInlineSnapshot(`
              {
                "defaultPrevented": false,
                "event": MouseEvent {
                  "isTrusted": false,
                  "offsetX": 20,
                  "offsetY": -2,
                  "pageX": 400,
                  "pageY": 570,
                },
                "itemId": "y",
                "preventDefault": [Function],
                "seriesId": "LineSeries-1",
                "text": "y",
                "type": "click",
                "visible": true,
              }
            `);
        });

        test('legend double click parameters', async () => {
            const legendItemDoubleClick = vi.fn();
            const options = prepareTestOptions({
                data: [{ x: 'Q1', y: 200 }],
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                legend: { enabled: true, listeners: { legendItemDoubleClick } },
            });

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            await doubleClickAction(400, 570)(chart);

            expect(legendItemDoubleClick.mock.lastCall![0]).toMatchInlineSnapshot(`
              {
                "defaultPrevented": false,
                "event": MouseEvent {
                  "isTrusted": false,
                  "offsetX": 20,
                  "offsetY": -2,
                  "pageX": 400,
                  "pageY": 570,
                },
                "itemId": "y",
                "preventDefault": [Function],
                "seriesId": "LineSeries-1",
                "text": "y",
                "type": "dblclick",
                "visible": false,
              }
            `);
        });
    });

    describe('AG-14022', () => {
        test('updateDelta update data should not clear/reset legend data', async () => {
            const options: AgChartOptions = prepareTestOptions({
                title: { text: 'Chinese Olympic medals' },
                data: [
                    { year: '2016', gold: 26, silver: 18, bronze: 26 },
                    { year: '2020', gold: 38, silver: 32, bronze: 19 },
                    { year: '2024', gold: 40, silver: 27, bronze: 24 },
                ],
                series: [
                    { type: 'line', xKey: 'year', yKey: 'gold' },
                    { type: 'line', xKey: 'year', yKey: 'silver' },
                    { type: 'line', xKey: 'year', yKey: 'bronze' },
                ],
            });

            const chartInstance = AgCharts.create(options);
            chart = deproxy(chartInstance);
            await waitForChartStability(chart);

            const { x, y } = computeLegendBBox(chart);
            await clickAction(x, y)(chart);
            await waitForChartStability(chart);

            await chartInstance.updateDelta({
                ...options,
                data: [
                    { year: '2016', gold: 55, silver: 87, bronze: 57 },
                    { year: '2020', gold: 38, silver: 32, bronze: 88 },
                    { year: '2024', gold: 86, silver: 61, bronze: 54 },
                ],
            });
            await compare(chart);
        });
    });

    describe('CRT-637', () => {
        test('updateDelta disabling/removing legend should reset legend data and refresh series visibility', async () => {
            const options: AgChartOptions = prepareTestOptions({
                title: { text: 'Chinese Olympic medals' },
                data: [
                    { year: '2016', gold: 26, silver: 18, bronze: 26 },
                    { year: '2020', gold: 38, silver: 32, bronze: 19 },
                    { year: '2024', gold: 40, silver: 27, bronze: 24 },
                ],
                series: [
                    { type: 'line', xKey: 'year', yKey: 'gold' },
                    { type: 'line', xKey: 'year', yKey: 'silver' },
                    { type: 'line', xKey: 'year', yKey: 'bronze' },
                ],
            });

            const chartInstance = AgCharts.create(options);
            chart = deproxy(chartInstance);
            await waitForChartStability(chart);

            const { x, y } = computeLegendBBox(chart);
            await clickAction(x, y)(chart);
            await waitForChartStability(chart);

            await chartInstance.updateDelta({
                ...options,
                legend: { enabled: false },
            });

            await compare(chart);
        });
    });

    describe('CRT-636', () => {
        test('updateDelta disabling/removing legend should redraw series correctly', async () => {
            const options: AgChartOptions = prepareTestOptions({
                title: { text: 'Chinese Olympic medals' },
                data: [
                    { year: '2016', gold: 26, silver: 18, bronze: 26 },
                    { year: '2020', gold: 38, silver: 32, bronze: 19 },
                    { year: '2024', gold: 40, silver: 27, bronze: 24 },
                ],
                series: [
                    { type: 'bar', xKey: 'year', yKey: 'gold' },
                    { type: 'bar', xKey: 'year', yKey: 'silver' },
                    { type: 'bar', xKey: 'year', yKey: 'bronze' },
                ],
            });

            const chartInstance = AgCharts.create(options);
            chart = deproxy(chartInstance);
            await waitForChartStability(chart);

            const { x, y } = computeLegendBBox(chart);
            await clickAction(x, y)(chart);
            await clickAction(x + 75, y)(chart);
            await waitForChartStability(chart);

            await compare(chart); // Two series should be hidden.

            await chartInstance.updateDelta({
                ...options,
                legend: {
                    enabled: false,
                },
            });

            await compare(chart);
        });
    });

    describe('CRT-638', () => {
        test('updateDelta changing legend options should NOT reset legend data NOR refresh series visibility', async () => {
            const options: AgChartOptions = prepareTestOptions({
                title: { text: 'Chinese Olympic medals' },
                data: [
                    { year: '2016', gold: 26, silver: 18, bronze: 26 },
                    { year: '2020', gold: 38, silver: 32, bronze: 19 },
                    { year: '2024', gold: 40, silver: 27, bronze: 24 },
                ],
                series: [
                    { type: 'line', xKey: 'year', yKey: 'gold' },
                    { type: 'line', xKey: 'year', yKey: 'silver' },
                    { type: 'line', xKey: 'year', yKey: 'bronze' },
                ],
            });

            const chartInstance = AgCharts.create(options);
            chart = deproxy(chartInstance);
            await waitForChartStability(chart);

            const { x, y } = computeLegendBBox(chart);
            await clickAction(x, y)(chart);
            await waitForChartStability(chart);

            await chartInstance.updateDelta({
                ...options,
                legend: { item: { showSeriesStroke: true } },
            });

            await compare(chart);
        });
    });

    describe('AG-7868 legend.position', () => {
        const data = [
            { quarter: 'Q1', coal: -666, manufacturedFuels: -14, primaryOil: -261, petroleum: -124, naturalGas: -1197 },
            { quarter: 'Q2', coal: 208, manufacturedFuels: 71, primaryOil: 950, petroleum: -318, naturalGas: 906 },
            { quarter: 'Q3', coal: 426, manufacturedFuels: 19, primaryOil: -845, petroleum: 166, naturalGas: 276 },
            { quarter: 'Q4', coal: 158, manufacturedFuels: -29, primaryOil: -156, petroleum: -19, naturalGas: 672 },
        ];
        async function testPosition(position: AgChartLegendPosition) {
            const options: AgChartOptions = {
                data,
                series: [
                    { type: 'bar', xKey: 'quarter', yKey: 'naturalGas' },
                    { type: 'bar', xKey: 'quarter', yKey: 'coal' },
                    { type: 'bar', xKey: 'quarter', yKey: 'primaryOil' },
                    { type: 'bar', xKey: 'quarter', yKey: 'petroleum' },
                    { type: 'bar', xKey: 'quarter', yKey: 'manufacturedFuels' },
                ],
                legend: { position },
            };
            prepareTestOptions(options as any);
            chart = deproxy(AgCharts.create(options));
            await compare(chart);
        }

        test('top', async () => {
            await testPosition('top');
        });
        test('top-right', async () => {
            await testPosition('top-right');
        });
        test('top-left', async () => {
            await testPosition('top-left');
        });
        test('bottom', async () => {
            await testPosition('bottom');
        });
        test('bottom-right', async () => {
            await testPosition('bottom-right');
        });
        test('bottom-left', async () => {
            await testPosition('bottom-left');
        });
        test('right', async () => {
            await testPosition('right');
        });
        test('right-top', async () => {
            await testPosition('right-top');
        });
        test('right-bottom', async () => {
            await testPosition('right-bottom');
        });
        test('left', async () => {
            await testPosition('left');
        });
        test('left-top', async () => {
            await testPosition('left-top');
        });
        test('left-bottom', async () => {
            await testPosition('left-bottom');
        });
    });

    describe('AG-15363 legend.floating', () => {
        test('right-top', async () => {
            const options = prepareTestOptions({
                data: [
                    { ticker: 'AAPL', 2020: 0.7, 2021: 0.6, 2022: 0.5 },
                    { ticker: 'KO', 2020: 3, 2021: 2.9, 2022: 2.8 },
                    { ticker: 'JNJ', 2020: 2.6, 2021: 2.5, 2022: 2.4 },
                    { ticker: 'T', 2020: 6.5, 2021: 7, 2022: 6 },
                    { ticker: 'PG', 2020: 2.3, 2021: 2.2, 2022: 2.1 },
                ],
                series: [
                    { type: 'bar', xKey: 'ticker', yKey: '2020' },
                    { type: 'bar', xKey: 'ticker', yKey: '2021' },
                    { type: 'bar', xKey: 'ticker', yKey: '2022' },
                ],
                legend: {
                    position: {
                        placement: 'right-top',
                        floating: true,
                        xOffset: -50,
                        yOffset: 120,
                    },
                },
            });
            chart = deproxy(AgCharts.create(options));
            await compare(chart);
        });
    });

    describe('CRT-1130', () => {
        const animate = spyOnAnimationManager();

        test('keyboard legend focus change interrupts in-progress highlight animation', async () => {
            const options: AgChartOptions = prepareTestOptions({
                data: [
                    { year: '2016', gold: 26, silver: 18, bronze: 26 },
                    { year: '2020', gold: 38, silver: 32, bronze: 19 },
                    { year: '2024', gold: 40, silver: 27, bronze: 24 },
                ],
                series: [
                    { type: 'bar', xKey: 'year', yKey: 'gold' },
                    { type: 'bar', xKey: 'year', yKey: 'silver' },
                    { type: 'bar', xKey: 'year', yKey: 'bronze' },
                ],
            });

            animate(1200, 1);
            chart = await createChart(options);
            await waitForChartStability(chart);

            const legend = getLegendModule(chart);
            const items = legend.itemSelection.nodes();

            // spyOnAnimationManager completes animations instantly via forceTimeJump, so Animation state is pushed
            // directly to reach the legend's highlight-interruption path.
            chart.ctx.interactionManager.pushState(InteractionState.Animation);

            // Keyboard navigation: blur the current item then focus a different one.
            legend.onLeave(true);
            legend.onHover(new FocusEvent('focus'), items[1], true);

            // Focus applies the new highlight immediately, before the animation completes.
            expect(chart.ctx.highlightManager.getActiveHighlight()?.series.id).toBe(items[1].datum?.id);

            chart.ctx.interactionManager.popState(InteractionState.Animation);
            await waitForChartStability(chart);

            // And the deferred clear from the blur does not clobber it once the batch stops.
            expect(chart.ctx.highlightManager.getActiveHighlight()?.series.id).toBe(items[1].datum?.id);
        });

        test('keyboard focus is not clobbered by a deferred pointer-hover update on batch stop', async () => {
            const options: AgChartOptions = prepareTestOptions({
                data: [
                    { year: '2016', gold: 26, silver: 18, bronze: 26 },
                    { year: '2020', gold: 38, silver: 32, bronze: 19 },
                ],
                series: [
                    { type: 'bar', xKey: 'year', yKey: 'gold' },
                    { type: 'bar', xKey: 'year', yKey: 'silver' },
                    { type: 'bar', xKey: 'year', yKey: 'bronze' },
                ],
            });

            animate(1200, 1);
            chart = await createChart(options);
            await waitForChartStability(chart);

            const legend = getLegendModule(chart);
            const items = legend.itemSelection.nodes();

            chart.ctx.interactionManager.pushState(InteractionState.Animation);

            // Pointer hover queues a deferred highlight update for batch stop.
            legend.onHover(new MouseEvent('mouseenter'), items[0]);
            // Keyboard focus then applies a different highlight immediately, superseding the queued update.
            legend.onLeave(true);
            legend.onHover(new FocusEvent('focus'), items[1], true);

            expect(chart.ctx.highlightManager.getActiveHighlight()?.series.id).toBe(items[1].datum?.id);

            chart.ctx.interactionManager.popState(InteractionState.Animation);
            await waitForChartStability(chart);

            // The superseded pointer-hover update must not run on batch stop and overwrite the focus.
            expect(chart.ctx.highlightManager.getActiveHighlight()?.series.id).toBe(items[1].datum?.id);
        });
    });

    describe('CRT-1034', () => {
        const animate = spyOnAnimationManager();

        test('legend hover should not interrupt show animation', async () => {
            const options: AgChartOptions = prepareTestOptions({
                data: [
                    { year: '2016', gold: 26, silver: 18, bronze: 26 },
                    { year: '2020', gold: 38, silver: 32, bronze: 19 },
                    { year: '2024', gold: 40, silver: 27, bronze: 24 },
                ],
                series: [
                    { type: 'bar', xKey: 'year', yKey: 'gold' },
                    { type: 'bar', xKey: 'year', yKey: 'silver' },
                    { type: 'bar', xKey: 'year', yKey: 'bronze' },
                ],
            });

            animate(1200, 1);
            chart = await createChart(options);

            const { x, y } = computeLegendBBox(chart);
            await clickAction(x, y)(chart);
            await waitForChartStability(chart);
            await clickAction(x, y)(chart);
            await waitForChartStability(chart);

            // spyOnAnimationManager completes animations instantly via forceTimeJump, so Animation state is pushed
            // directly to reach the legend's highlight-deferral path.
            chart.ctx.interactionManager.pushState(InteractionState.Animation);

            const startBatchSpy = vi.spyOn(chart.ctx.animationManager, 'startBatch');

            // Hover a different legend item while animation is in progress.
            await hoverAction(x + 75, y)(chart);

            // startBatch should NOT have been called — animation must not be interrupted.
            expect(startBatchSpy).not.toHaveBeenCalled();

            startBatchSpy.mockRestore();
            chart.ctx.interactionManager.popState(InteractionState.Animation);

            await waitForChartStability(chart);
            await compare(chart);
        });
    });

    describe('CRT-1193', () => {
        test('legend hover highlight is suppressed while an interaction holds ZoomDrag', async () => {
            const options: AgChartOptions = prepareTestOptions({
                data: [
                    { year: '2016', gold: 26, silver: 18, bronze: 26 },
                    { year: '2020', gold: 38, silver: 32, bronze: 19 },
                ],
                series: [
                    { type: 'bar', xKey: 'year', yKey: 'gold' },
                    { type: 'bar', xKey: 'year', yKey: 'silver' },
                    { type: 'bar', xKey: 'year', yKey: 'bronze' },
                ],
            });

            chart = await createChart(options);
            await waitForChartStability(chart);

            const { highlightManager, interactionManager, tooltipManager } = chart.ctx;
            const legend = getLegendModule(chart);
            const items = legend.itemSelection.nodes();

            const updateTooltip = vi.spyOn(tooltipManager, 'updateTooltip');
            const removeTooltip = vi.spyOn(tooltipManager, 'removeTooltip');

            // Positive control: the same hover on the same chart does highlight, and does reach the
            // tooltip manager, when nothing is dragging.
            legend.onHover(new MouseEvent('mouseenter'), items[0]);
            expect(highlightManager.getActiveHighlight()?.series.id).toBe(items[0].datum?.id);
            expect(updateTooltip.mock.calls.length + removeTooltip.mock.calls.length).toBeGreaterThan(0);

            // Legend highlight clears are deferred to batch stop, so the baseline has to be allowed
            // to land before the suppression case is measured against it.
            legend.onLeave();
            await waitForChartStability(chart);
            expect(highlightManager.getActiveHighlight()).toBeUndefined();
            updateTooltip.mockClear();
            removeTooltip.mockClear();

            // ZoomDrag is written directly to pin the guard without a zoom module: isState() compares only the
            // lowest set bit, so the guard is observable only while no higher-priority state is queued.
            interactionManager.pushState(InteractionState.ZoomDrag);
            expect(interactionManager.isState(InteractionState.ZoomDrag)).toBe(true);

            legend.onHover(new MouseEvent('mouseenter'), items[1]);

            // Highlight application is separately gated on the state queue, so the tooltip calls are what
            // distinguish the guard returning early from a highlight that merely never lands.
            expect(updateTooltip).not.toHaveBeenCalled();
            expect(removeTooltip).not.toHaveBeenCalled();
            expect(highlightManager.getActiveHighlight()).toBeUndefined();

            interactionManager.popState(InteractionState.ZoomDrag);
            updateTooltip.mockRestore();
            removeTooltip.mockRestore();
        });
    });

    describe('AG-10316 legend item tooltip', () => {
        const TOOLTIP_OPTIONS: AgCartesianChartOptions = {
            data: [
                { x: 'Q1', y: 10, z: 20 },
                { x: 'Q2', y: 20, z: 30 },
            ],
            series: [
                { type: 'bar', xKey: 'x', yKey: 'y', yName: 'Series Y' },
                { type: 'bar', xKey: 'x', yKey: 'z', yName: 'Series Z' },
            ],
            legend: { enabled: true },
        };

        let legendX: number;
        let legendY: number;

        function getTooltipText() {
            return getTooltipElement(chart)?.textContent ?? '';
        }

        function getTooltipHTML() {
            return getTooltipElement(chart)?.innerHTML ?? '';
        }

        async function setupChart(legendOverrides: AgCartesianChartOptions['legend'] = {}) {
            const options: AgCartesianChartOptions = prepareTestOptions({
                ...TOOLTIP_OPTIONS,
                legend: { ...TOOLTIP_OPTIONS.legend, ...legendOverrides },
            });
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
            const box = computeLegendBBox(chart);
            legendX = box.x;
            legendY = box.y;
        }

        async function hoverLegendItem() {
            await hoverAction(legendX, legendY)(chart);
            await waitForChartStability(chart);
        }

        test('no tooltip config — non-truncated items do not show tooltip', async () => {
            await setupChart();

            await hoverLegendItem();

            expect(isTooltipVisible(chart)).toBe(false);
        });

        test('visible: always — tooltip shown on every hover', async () => {
            await setupChart({ item: { tooltip: { visible: 'always' } } });

            await hoverLegendItem();

            expect(isTooltipVisible(chart)).toBe(true);
            expect(getTooltipText()).toContain('Series Y');
        });

        test('visible: never — tooltip never shown', async () => {
            await setupChart({
                item: {
                    label: { maxLength: 3 }, // force truncation
                    tooltip: { visible: 'never' },
                },
            });

            await hoverLegendItem();

            expect(isTooltipVisible(chart)).toBe(false);
        });

        test('text — static text shown on every hover', async () => {
            await setupChart({ item: { tooltip: { text: 'Click to toggle' } } });

            await hoverLegendItem();

            expect(isTooltipVisible(chart)).toBe(true);
            expect(getTooltipText()).toContain('Click to toggle');
        });

        test('renderer — dynamic content on every hover', async () => {
            await setupChart({
                item: {
                    tooltip: {
                        renderer: (p) => `${p.text} (${p.seriesId})`,
                    },
                },
            });

            await hoverLegendItem();

            expect(isTooltipVisible(chart)).toBe(true);
            expect(getTooltipHTML()).toContain('Series Y');
        });

        test('visible: auto with renderer — tooltip only when truncated', async () => {
            await setupChart({
                item: {
                    tooltip: {
                        visible: 'auto',
                        renderer: (p) => `${p.text} — details`,
                    },
                },
            });

            await hoverLegendItem();
            expect(isTooltipVisible(chart)).toBe(false);
        });

        test('renderer returns empty string — no tooltip', async () => {
            await setupChart({
                item: {
                    tooltip: {
                        renderer: () => '',
                    },
                },
            });

            await hoverLegendItem();

            expect(isTooltipVisible(chart)).toBe(false);
        });

        test('both text and renderer — renderer takes precedence', async () => {
            await setupChart({
                item: {
                    tooltip: {
                        text: 'Static text',
                        renderer: (p) => `Custom: ${p.text}`,
                    },
                },
            });

            await hoverLegendItem();

            expect(isTooltipVisible(chart)).toBe(true);
            expect(getTooltipHTML()).toContain('Custom: Series Y');
        });

        test('text defaults visible to always', async () => {
            await setupChart({ item: { tooltip: { text: 'Info' } } });

            await hoverLegendItem();

            // Text provided without explicit visible — should default to 'always'
            expect(isTooltipVisible(chart)).toBe(true);
            expect(getTooltipText()).toContain('Info');
        });

        test('renderer params contain expected fields', async () => {
            const rendererFn = vi.fn((_p: any) => 'tooltip');
            await setupChart({
                item: { tooltip: { renderer: rendererFn } },
            });

            await hoverLegendItem();

            expect(rendererFn).toHaveBeenCalledTimes(1);
            const params = rendererFn.mock.calls[0][0];
            expect(params).toMatchObject({
                seriesId: expect.any(String),
                itemId: 'y',
                text: 'Series Y',
                visible: true,
            });
        });

        test('renderer returns undefined — falls back to text', async () => {
            await setupChart({
                item: {
                    tooltip: {
                        text: 'Fallback text',
                        renderer: () => undefined,
                    },
                },
            });

            await hoverLegendItem();

            expect(isTooltipVisible(chart)).toBe(true);
            expect(getTooltipText()).toContain('Fallback text');
        });

        test('renderer returns undefined — falls back to default label when no text', async () => {
            await setupChart({
                item: {
                    tooltip: {
                        visible: 'always',
                        renderer: () => undefined,
                    },
                },
            });

            await hoverLegendItem();

            expect(isTooltipVisible(chart)).toBe(true);
            expect(getTooltipText()).toContain('Series Y');
        });

        test('renderer returns a number — coerced to string content', async () => {
            await setupChart({
                item: {
                    tooltip: {
                        renderer: () => 42,
                    },
                },
            });

            await hoverLegendItem();

            expect(isTooltipVisible(chart)).toBe(true);
            expect(getTooltipText()).toContain('42');
        });

        test('renderer returns a Date — coerced to string content', async () => {
            // Mid-year noon UTC so the Date stringifies to the same calendar day in every timezone.
            await setupChart({
                item: {
                    tooltip: {
                        renderer: () => new Date('2026-06-15T12:00:00Z'),
                    },
                },
            });

            await hoverLegendItem();

            expect(isTooltipVisible(chart)).toBe(true);
            expect(getTooltipText()).toContain('2026');
            expect(getTooltipText()).toContain('Jun');
        });

        test('toggleSeries: false — tooltip still works', async () => {
            await setupChart({
                toggleSeries: false,
                item: { tooltip: { visible: 'always' } },
            });

            await hoverLegendItem();

            expect(isTooltipVisible(chart)).toBe(true);
        });
    });

    describe('AG-17126 aria-describedby', () => {
        type NullableString = string | null;
        type NullableStringTrouple = [NullableString, NullableString, NullableString];

        const options: AgChartOptions = {
            data: [
                { year: '2016', gold: 26, silver: 18, bronze: 26 },
                { year: '2020', gold: 38, silver: 32, bronze: 19 },
                { year: '2024', gold: 40, silver: 27, bronze: 24 },
            ],
            series: [
                { type: 'bar', xKey: 'year', yKey: 'gold' },
                { type: 'bar', xKey: 'year', yKey: 'silver' },
                { type: 'bar', xKey: 'year', yKey: 'bronze' },
            ],
        };

        function findAriaDescribedByIds(): NullableStringTrouple {
            const elems = document.querySelectorAll('.ag-charts-proxy-legend-toolbar button');
            expect(elems.length).toBe(3);
            return [
                elems.item(0).getAttribute('aria-describedby'),
                elems.item(1).getAttribute('aria-describedby'),
                elems.item(2).getAttribute('aria-describedby'),
            ];
        }

        function findAriaDescribedByTextContent([id0, id1, id2]: NullableStringTrouple): NullableStringTrouple {
            function readTextContent(id: NullableString): NullableString {
                if (id === null) return null;
                const elem = document.getElementById(id);
                expect(elem).not.toBeNull();
                return elem!.textContent;
            }
            return [readTextContent(id0), readTextContent(id1), readTextContent(id2)];
        }

        test('interactions enabled', async () => {
            chart = await createChart({ ...options });
            await waitForChartStability(chart);

            const EXPECTED_ID = 'ag-charts-3';
            const ids = findAriaDescribedByIds();
            const [ariaDescribedById0, ariaDescribedById1, ariaDescribedById2] = ids;
            expect(ariaDescribedById0).toBe(EXPECTED_ID);
            expect(ariaDescribedById1).toBe(EXPECTED_ID);
            expect(ariaDescribedById2).toBe(EXPECTED_ID);

            const EXPECTED_TEXT = 'Press Space or Enter to toggle visibility';
            const [ariaDescribedBy0, ariaDescribedBy1, ariaDescribedBy2] = findAriaDescribedByTextContent(ids);
            expect(ariaDescribedBy0).toBe(EXPECTED_TEXT);
            expect(ariaDescribedBy1).toBe(EXPECTED_TEXT);
            expect(ariaDescribedBy2).toBe(EXPECTED_TEXT);
        });

        test('interactions disabled', async () => {
            chart = await createChart({ ...options, legend: { toggleSeries: false } });
            await waitForChartStability(chart);

            const [ariaDescribedById0, ariaDescribedById1, ariaDescribedById2] = findAriaDescribedByIds();
            expect(ariaDescribedById0).toBeNull();
            expect(ariaDescribedById1).toBeNull();
            expect(ariaDescribedById2).toBeNull();
        });
    });
});
