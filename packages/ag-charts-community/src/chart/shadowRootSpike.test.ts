import { writeFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions, AgDropShadowOptions } from 'ag-charts-types';

import {
    createChart,
    deproxy,
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from './test/utils';

const QUARTERS = [
    { quarter: 'Q1', software: 6, hardware: 4 },
    { quarter: 'Q2', software: 8, hardware: 5 },
    { quarter: 'Q3', software: 5, hardware: 7 },
    { quarter: 'Q4', software: 9, hardware: 6 },
    { quarter: 'Q5', software: 7, hardware: 3 },
];

const BLUE = '#4a90e2';
const ORANGE = '#ff9f3a';
const FILLS = { software: BLUE, hardware: ORANGE };

const SHADOW: AgDropShadowOptions = { enabled: true, color: 'rgba(0, 0, 0, 0.55)', xOffset: 5, yOffset: 5, blur: 6 };
const HIGHLIGHT_SHADOW: AgDropShadowOptions = {
    enabled: true,
    color: 'rgba(220, 20, 60, 0.8)',
    xOffset: 0,
    yOffset: 0,
    blur: 10,
    spread: 4,
};

const PLACEMENT_FLAG = '__agHighlightShadowPlacement';
const OUT_DIR = process.env.SHADOW_SPIKE_OUT;

// Smoke tests for the shared shadow pass. With SHADOW_SPIKE_OUT set they also write the repro renders as PNGs.
describe('shared shadow root (spike)', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: any;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
        Reflect.deleteProperty(globalThis, PLACEMENT_FLAG);
    });

    const save = (name: string) => {
        if (OUT_DIR == null) return;
        writeFileSync(`${OUT_DIR}/${name}.png`, extractImageData(ctx));
    };

    const render = async (options: AgCartesianChartOptions, name: string, hoverSeries?: number, hoverIndex = 2) => {
        chart = deproxy(await createChart({ animation: { enabled: false }, legend: { enabled: false }, ...options }));
        if (hoverSeries != null) {
            const datum = chart.series[hoverSeries].contextNodeData.nodeData[hoverIndex];
            chart.ctx.highlightManager.updateHighlight(chart.id, datum);
            await waitForChartStability(chart);
        }
        save(name);
    };

    const bars = (spread: number): AgCartesianChartOptions => ({
        title: { text: `bar spread ${spread}` },
        data: QUARTERS,
        series: [
            { type: 'bar', xKey: 'quarter', yKey: 'software', fill: BLUE, shadow: { ...SHADOW, spread } },
            { type: 'bar', xKey: 'quarter', yKey: 'hardware', fill: ORANGE, shadow: { ...SHADOW, spread } },
        ],
    });

    const areas = (fill: boolean): AgCartesianChartOptions => ({
        title: { text: fill ? 'area both' : 'area marker only' },
        data: QUARTERS,
        series: (['software', 'hardware'] as const).map((yKey) => ({
            type: 'area' as const,
            xKey: 'quarter',
            yKey,
            fill: FILLS[yKey],
            stroke: FILLS[yKey],
            marker: { enabled: true, size: 14, shadow: SHADOW, fill: FILLS[yKey] },
            ...(fill && { shadow: SHADOW }),
        })),
    });

    const hover = (): AgCartesianChartOptions => ({
        title: { text: 'C larger' },
        data: QUARTERS,
        series: (['software', 'hardware'] as const).map((yKey) => ({
            type: 'bar' as const,
            xKey: 'quarter',
            yKey,
            fill: FILLS[yKey],
            shadow: SHADOW,
            highlight: { highlightedItem: { shadow: HIGHLIGHT_SHADOW } },
        })),
    });

    it.each([
        [0, 'tc1-bar-c1'],
        [14, 'tc1-bar-c3'],
    ])('TC1: grouped bars with spread %s cast every shadow beneath every bar', async (spread, name) => {
        await render(bars(spread), name);
        expect(chart.series).toHaveLength(2);
    });

    it.each([
        [false, 'tc2-area-c1'],
        [true, 'tc2-area-c3'],
    ])('TC2 area: fill shadow %s goes beneath both areas', async (fill, name) => {
        await render(areas(fill), name);
        expect(chart.series).toHaveLength(2);
    });

    it.each(['above', 'beneath', 'beneath-knockout'])('TC2 highlight: %s', async (placement) => {
        Reflect.set(globalThis, PLACEMENT_FLAG, placement);
        await render(hover(), `tc2-highlight-c3-hover-${placement}`, 1);
        expect(chart.series).toHaveLength(2);
    });
});
