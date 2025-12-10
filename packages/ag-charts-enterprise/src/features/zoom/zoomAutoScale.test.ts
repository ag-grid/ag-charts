import { afterEach, describe } from '@jest/globals';

import { AgChartInstance, AgChartState, AgCharts } from 'ag-charts-community';
import type { AgCartesianChartOptions } from 'ag-charts-community';
import {
    MockZoomListener,
    newFreezableMockInferred,
    scrollAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

describe('ZoomAutoScale', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    async function createChart<D>(options: AgCartesianChartOptions<D>): Promise<void> {
        chart = AgCharts.create(prepareEnterpriseTestOptions(options));
        await waitForChartStability(chart);
    }

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    async function wheelZoomIn(): Promise<void> {
        await scrollAction(400, 300, -200)(chart);
        await waitForChartStability(chart);
    }

    test('AgZoomEvent.autoScaleAxes - disabled', async () => {
        type D = { x: number; y: number };
        let state: AgChartState;
        const zoomListener = newFreezableMockInferred<MockZoomListener<D, unknown>>();
        await createChart<D>({
            data: [
                { x: 0, y: -20 },
                { x: 1, y: 50 },
                { x: 2, y: 25 },
                { x: 3, y: 60 },
                { x: 4, y: 50 },
                { x: 5, y: 22 },
                { x: 6, y: 50 },
                { x: 7, y: 175 },
            ],
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            zoom: {
                enabled: true,
                autoScaling: {
                    enabled: false,
                },
            },
            listeners: {
                zoom: zoomListener.frozen,
            },
        });

        state = chart.getState();
        expect(state.zoom?.autoScaledAxes).toBeUndefined();

        await wheelZoomIn();
        state = chart.getState();
        expect(state.zoom?.autoScaledAxes).toBeUndefined();

        expect(zoomListener.mock).toBeCalledTimes(1);
        expect(zoomListener.mock.mock.calls[0][0]).toMatchObject({ autoScaledAxes: undefined });
    });

    test('AgZoomEvent.autoScaleAxes - 1 axis', async () => {
        type D = { x: number; y: number };
        let state: AgChartState;
        const zoomListener = newFreezableMockInferred<MockZoomListener<D, unknown>>();
        await createChart<D>({
            data: [
                { x: 0, y: -20 },
                { x: 1, y: 50 },
                { x: 2, y: 25 },
                { x: 3, y: 60 },
                { x: 4, y: 50 },
                { x: 5, y: 22 },
                { x: 6, y: 50 },
                { x: 7, y: 175 },
            ],
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            zoom: {
                enabled: true,
                autoScaling: {
                    enabled: true,
                },
            },
            listeners: {
                zoom: zoomListener.frozen,
            },
        });

        state = chart.getState();
        expect(state.zoom?.autoScaledAxes).toMatchObject(['y']);

        await wheelZoomIn();
        state = chart.getState();
        expect(state.zoom?.autoScaledAxes).toMatchObject(['y']);

        expect(zoomListener.mock).toBeCalledTimes(1);
        expect(zoomListener.mock.mock.calls[0][0]).toMatchObject({ autoScaledAxes: ['y'] });
    });

    test('AgZoomEvent.autoScaleAxes - 2 axes', async () => {
        type D = { time: number; temp: number; humidity: number };
        let state: AgChartState;
        const zoomListener = newFreezableMockInferred<MockZoomListener<D, unknown>>();

        await createChart<D>({
            data: [
                { time: 0, temp: -9, humidity: 10 },
                { time: 1, temp: 50, humidity: 40 },
                { time: 2, temp: 25, humidity: 30 },
                { time: 3, temp: 60, humidity: 55 },
                { time: 4, temp: 50, humidity: 45 },
                { time: 5, temp: 22, humidity: 35 },
                { time: 6, temp: 50, humidity: 97 },
                { time: 7, temp: 90, humidity: 88 },
            ],
            axes: {
                x: { type: 'number', position: 'bottom' },
                y1: { type: 'number', position: 'left' },
                y2: { type: 'number', position: 'right' },
            },
            series: [
                { type: 'line', xKey: 'time', yKeyAxis: 'y1', yKey: 'temp' },
                { type: 'line', xKey: 'time', yKeyAxis: 'y2', yKey: 'humidity' },
            ],
            zoom: {
                enabled: true,
                autoScaling: { enabled: true },
            },
            listeners: {
                zoom: zoomListener.frozen,
            },
        });

        state = chart.getState();
        expect(state.zoom?.autoScaledAxes).toMatchObject(['y1', 'y2']);

        await wheelZoomIn();
        state = chart.getState();
        expect(state.zoom?.autoScaledAxes).toMatchObject(['y1', 'y2']);

        expect(zoomListener.mock).toBeCalledTimes(1);
        expect(zoomListener.mock.mock.calls[0][0]).toMatchObject({
            autoScaledAxes: ['y1', 'y2'],
        });
    });

    test('updateDelta should respond to autoScaling changes', async () => {
        type D = { time: number; temp: number; humidity: number };
        let state: AgChartState;
        const zoomListener = newFreezableMockInferred<MockZoomListener<D, unknown>>();
        const options: AgCartesianChartOptions<D> = {
            data: [
                { time: 0, temp: -9, humidity: 10 },
                { time: 1, temp: 50, humidity: 40 },
                { time: 2, temp: 25, humidity: 30 },
                { time: 3, temp: 60, humidity: 55 },
                { time: 4, temp: 50, humidity: 45 },
                { time: 5, temp: 22, humidity: 35 },
                { time: 6, temp: 50, humidity: 97 },
                { time: 7, temp: 90, humidity: 88 },
            ],
            axes: {
                x: { type: 'number', position: 'bottom' },
                y1: { type: 'number', position: 'left' },
                y2: { type: 'number', position: 'right' },
            },
            series: [
                { type: 'line', xKey: 'time', yKeyAxis: 'y1', yKey: 'temp' },
                { type: 'line', xKey: 'time', yKeyAxis: 'y2', yKey: 'humidity' },
            ],
            zoom: {
                enabled: true,
                autoScaling: { enabled: false },
            },
        };

        // Init chart; Expect no zoom at all.
        await createChart<D>(options);
        state = chart.getState();
        expect(state.zoom?.autoScaledAxes).toBeUndefined();
        expect(state.zoom?.ratioX).toMatchObject({ start: 0, end: 1 });
        expect(state.zoom?.ratioY).toMatchObject({ start: 0, end: 1 });
        zoomListener.mock.mockClear();

        // Zoom In; Expect zoom on X-axis only (no autoScaling).
        await wheelZoomIn();
        state = chart.getState();
        expect(state.zoom?.autoScaledAxes).toBeUndefined();
        expect(state.zoom?.ratioX).not.toMatchObject({ start: 0, end: 1 });
        expect(state.zoom?.ratioY).toMatchObject({ start: 0, end: 1 });
        expect(zoomListener.mock).toBeCalledTimes(1);
        expect(zoomListener.mock.mock.calls[0][0]).not.toMatchObject({ ratioX: { start: 0, end: 1 } });
        expect(zoomListener.mock.mock.calls[0][0]).toMatchObject({ ratioY: { start: 0, end: 1 } });
        expect(zoomListener.mock.mock.calls[0][0]?.autoScaledAxes).toBeUndefined();
        zoomListener.mock.mockClear();

        // Enable autoScaling; Expect zoom on both X and Y axes.
        await chart.updateDelta({ zoom: { autoScaling: { enabled: true } } });
        state = chart.getState();
        expect(state.zoom?.autoScaledAxes).toMatchObject(['y']);
        expect(state.zoom?.ratioX).not.toMatchObject({ start: 0, end: 1 });
        expect(state.zoom?.ratioY).not.toMatchObject({ start: 0, end: 1 });
        expect(zoomListener.mock).toBeCalledTimes(1);
        expect(zoomListener.mock.mock.calls[0][0]).not.toMatchObject({ ratioX: { start: 0, end: 1 } });
        expect(zoomListener.mock.mock.calls[0][0]).not.toMatchObject({ ratioY: { start: 0, end: 1 } });
        expect(zoomListener.mock.mock.calls[0][0].autoScaledAxes).toMatchObject(['y']);
    });
});
