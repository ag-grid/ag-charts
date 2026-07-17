import { vi } from 'vitest';

import type { AgChartInstance } from 'ag-charts-types';

import { AgCharts } from '../api/agCharts';
import { Label, LabelCollision, LabelPlacementStyle, resolvePlacementLabelPadding } from './label';
import { adjustLabelPlacement } from './labelUtil';
import {
    extractImageData,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from './test/utils';

describe('Labels', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();
    let chart: AgChartInstance;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        vi.restoreAllMocks();
    });

    async function compare() {
        await waitForChartStability(chart);
        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot();
    }

    describe('AG-8917', () => {
        test('itemStyler auto-enables border', async () => {
            const options = prepareTestOptions({
                data: [
                    { x: "Q1'18", y: 140 },
                    { x: "Q2'18", y: 124 },
                    { x: "Q3'18", y: 112 },
                    { x: "Q4'18", y: 118 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        label: {
                            itemStyler: () => {
                                return { border: { strokeWidth: 2, stroke: 'black' } };
                            },
                        },
                    },
                ],
            });
            chart = AgCharts.create(options);
            await compare();
        });
    });

    describe('collision.suppressHide', () => {
        test('defaults to true (keep the label rather than hide it)', () => {
            expect(new LabelCollision().suppressHide).toBe(true);
        });
    });

    describe('collision.resolveCollideWith', () => {
        test('defaults markers/labels on and seriesItems off', () => {
            expect(new LabelCollision().resolveCollideWith()).toEqual({
                marker: { enabled: true, minSpacing: undefined },
                label: { enabled: true, minSpacing: undefined },
                seriesItem: { enabled: false, minSpacing: undefined },
            });
        });

        test('opts seriesItems in only when explicitly enabled', () => {
            const collision = new LabelCollision();
            collision.collideWith.seriesItems.enabled = true;
            expect(collision.resolveCollideWith().seriesItem?.enabled).toBe(true);
        });
    });

    describe('resolvePlacementLabelPadding', () => {
        function boxedLabel(padding: Label['padding']) {
            const label = new Label();
            label.fill = 'red';
            label.padding = padding;
            return label;
        }

        test('expands uniform box padding to every side', () => {
            expect(resolvePlacementLabelPadding(boxedLabel(8), undefined)).toEqual({
                top: 8,
                right: 8,
                bottom: 8,
                left: 8,
            });
        });

        test('preserves per-side box padding', () => {
            expect(
                resolvePlacementLabelPadding(boxedLabel({ top: 20, bottom: 4, left: 2, right: 6 }), undefined)
            ).toEqual({ top: 20, right: 6, bottom: 4, left: 2 });
        });

        test('is all-zero for a boxless label so the gap comes from spacing alone', () => {
            const label = new Label();
            label.padding = { top: 20, bottom: 4, left: 2, right: 6 };
            expect(resolvePlacementLabelPadding(label, undefined)).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
        });

        test('resolves the box from the placement style when the label itself is boxless', () => {
            const placementStyle = new LabelPlacementStyle();
            placementStyle.fill = 'red';
            placementStyle.padding = { top: 12, bottom: 4, left: 2, right: 6 };
            expect(resolvePlacementLabelPadding(new Label(), placementStyle)).toEqual({
                top: 12,
                right: 6,
                bottom: 4,
                left: 2,
            });
        });
    });

    describe('adjustLabelPlacement box padding', () => {
        const boxPadding = { top: 20, right: 6, bottom: 4, left: 2 };
        const rect = { x: 100, y: 100, width: 40, height: 60 };

        test('folds the facing side into the anchor offset for an upward outside-end label', () => {
            const withPadding = adjustLabelPlacement({
                isUpward: true,
                isVertical: true,
                placement: 'outside-end',
                spacing: 5,
                boxPadding,
                rect,
            });
            const withoutPadding = adjustLabelPlacement({
                isUpward: true,
                isVertical: true,
                placement: 'outside-end',
                spacing: 5,
                rect,
            });
            // Outside-end on an upward bar sits above the bar; its box bottom edge faces the bar.
            expect(withPadding.textBaseline).toBe('bottom');
            expect(withoutPadding.y - withPadding.y).toBe(boxPadding.bottom);
        });

        test('folds the opposite side when the bar flips downward', () => {
            const upward = adjustLabelPlacement({
                isUpward: true,
                isVertical: true,
                placement: 'inside-end',
                spacing: 5,
                boxPadding,
                rect,
            });
            const downward = adjustLabelPlacement({
                isUpward: false,
                isVertical: true,
                placement: 'inside-end',
                spacing: 5,
                boxPadding,
                rect,
            });
            expect(upward.textBaseline).toBe('top');
            expect(downward.textBaseline).toBe('bottom');
        });

        test('ignores box padding for inside-center', () => {
            const withPadding = adjustLabelPlacement({
                isUpward: true,
                isVertical: true,
                placement: 'inside-center',
                spacing: 5,
                boxPadding,
                rect,
            });
            expect(withPadding.y).toBe(rect.y + rect.height / 2);
        });
    });
});
