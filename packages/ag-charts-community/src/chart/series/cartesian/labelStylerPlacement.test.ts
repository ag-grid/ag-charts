import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance, AgChartOptions } from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import {
    compareImageSnapshot,
    deproxy,
    getVisibleLabelNodes,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../../test/utils';

/**
 * The label `itemStyler` participates in placement: the collision engine reserves and tests the box the
 * styler resolves at each candidate, so a styler that grows the label pushes it clear of what it was
 * placed against and cascades to the next candidate when the styled box no longer fits.
 */
describe('label itemStyler participates in placement', () => {
    setupMockConsole();
    const canvasCtx = setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        chart?.destroy();
    });

    const visibleLabels = (seriesIndex = 0) => getVisibleLabelNodes(chart, seriesIndex);

    /** What the series hands the placement engine: the labels that reserve space and act as obstacles. */
    const placementLabelData = (seriesIndex = 0) => {
        const series = deproxy(chart as any).series[seriesIndex] as unknown as {
            getLabelData(): unknown[];
        };
        return series.getLabelData();
    };

    const render = async (options: object) => {
        prepareTestOptions(options as AgChartOptions);
        chart = AgCharts.create(options as AgChartOptions);
        await waitForChartStability(chart);
    };

    const lineChart = (label: object, marker: object = {}) => ({
        data: [
            { x: 'A', y: 10 },
            { x: 'B', y: 20 },
        ],
        legend: { enabled: false },
        axes: { x: { type: 'category', position: 'bottom' }, y: { type: 'number', position: 'left' } },
        series: [
            {
                type: 'line',
                xKey: 'x',
                yKey: 'y',
                marker: { enabled: true, size: 10, ...marker },
                label: { enabled: true, placement: 'top', ...label },
            },
        ],
    });

    /** The y each label was drawn at, in datum order. */
    const labelYs = async (options: object) => {
        await render(options);
        const ys = visibleLabels().map((node) => node.y);
        expect(ys.length).toBeGreaterThan(0);
        chart.destroy();
        return ys;
    };

    it('reserves the styled box, so a padded label clears the point by its own box edge', async () => {
        // A `top` label clears its point from the box edge, so 20px of bottom padding must move the
        // text 20px further up; without the styled reservation the box would overlap the marker.
        const plain = await labelYs(lineChart({}));
        const padded = await labelYs(lineChart({ itemStyler: () => ({ fill: '#eeeeee', padding: 20 }) }));

        expect(padded).toHaveLength(plain.length);
        for (const [index, y] of padded.entries()) {
            expect(y).toBeCloseTo(plain[index] - 20, 5);
        }
    });

    it('hides a label its styler disabled', async () => {
        await render(lineChart({ itemStyler: () => ({ enabled: false }) }));
        expect(visibleLabels()).toHaveLength(0);
    });

    it('keeps a label whose styler leaves it enabled', async () => {
        await render(lineChart({ itemStyler: () => ({ enabled: true }) }));
        expect(visibleLabels().length).toBeGreaterThan(0);
    });

    /**
     * Node data is reused across updates, so a marker size the styler resolved on an earlier update must
     * not outlive it — otherwise labels keep clearing a marker that has reverted to its configured size.
     */
    it('drops a styled marker size once the styler stops returning one', async () => {
        await render(lineChart({}, { itemStyler: () => ({ size: 40 }) }));
        const styled = visibleLabels().map((node) => node.y);
        expect(styled.length).toBeGreaterThan(0);

        // Same chart, so the update reuses the node data the first render built.
        await chart.update(prepareTestOptions(lineChart({}, { itemStyler: () => ({}) }) as any) as AgChartOptions);
        await waitForChartStability(chart);
        const reverted = visibleLabels().map((node) => node.y);

        expect(reverted).toHaveLength(styled.length);
        // Back to the configured 10px marker: a 5px radius instead of 20px, so 15px closer to the point.
        for (const [index, y] of reverted.entries()) {
            expect(y).toBeCloseTo(styled[index] + 15, 5);
        }
    });

    it('feeds a marker styler size into the label gap', async () => {
        // The gap from the point to the label is the marker radius, so styling the marker from 10px to
        // 40px across pushes the label 15px further out (20px radius instead of 5px).
        const plain = await labelYs(lineChart({}));
        const bigMarkers = await labelYs(lineChart({}, { itemStyler: () => ({ size: 40 }) }));

        expect(bigMarkers).toHaveLength(plain.length);
        for (const [index, y] of bigMarkers.entries()) {
            expect(y).toBeCloseTo(plain[index] - 15, 5);
        }
    });

    describe('bar placement cascade', () => {
        // Bars ~30px tall: an unstyled label fits inside one, a label padded by 20px a side does not, so
        // the styled box is what decides whether the cascade stays inside or falls through.
        const barChart = (label: object) => ({
            data: [
                { cat: 'A', value: 8 },
                { cat: 'B', value: 6 },
            ],
            legend: { enabled: false },
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left', max: 100 },
            },
            series: [{ type: 'bar', xKey: 'cat', yKey: 'value', label: { enabled: true, ...label } }],
        });

        /**
         * The placement and rotation each bar label was finally drawn at, as the placement engine wrote
         * them back onto the label data. Read from the scene rather than from the styler's params: the
         * render pass reuses the cached styler result for the winning candidate, so the last recorded call
         * is the last candidate the cascade probed, not the one it chose.
         */
        const drawnLabels = async (label: object, styler: (params: any) => object) => {
            await render(barChart({ ...label, itemStyler: styler }));
            const series = deproxy(chart as any).series[0] as unknown as {
                contextNodeData?: {
                    labelData: { label?: { placement?: string; rotation: number; hidden?: boolean } }[];
                };
            };
            const drawn = (series.contextNodeData?.labelData ?? [])
                .map((node) => node.label)
                .filter((nodeLabel) => nodeLabel != null && nodeLabel.hidden !== true);
            expect(drawn.length).toBeGreaterThan(0);
            return drawn;
        };

        it('takes the first placement when the styled box fits the bar', async () => {
            const drawn = await drawnLabels({ placement: ['inside-center', 'outside-end'] }, () => ({}));
            expect(drawn.every((nodeLabel) => nodeLabel!.placement === 'inside-center')).toBe(true);
        });

        it('cascades to the next placement when the styled box no longer fits the bar', async () => {
            const drawn = await drawnLabels({ placement: ['inside-center', 'outside-end'] }, () => ({
                fill: '#eeeeee',
                padding: 20,
            }));
            expect(drawn.every((nodeLabel) => nodeLabel!.placement === 'outside-end')).toBe(true);
        });

        it('hides a bar label its styler disabled', async () => {
            await render(barChart({ itemStyler: () => ({ enabled: false }) }));
            expect(visibleLabels()).toHaveLength(0);
        });

        it('keeps the first orientation when the styled box fits it', async () => {
            const drawn = await drawnLabels(
                { placement: 'inside-center', orientation: ['horizontal', 'vertical'] },
                () => ({})
            );
            expect(drawn.every((nodeLabel) => nodeLabel!.rotation === 0)).toBe(true);
        });

        /**
         * The orientation-only route resolves one box up front instead of letting the engine walk
         * candidates, so nothing downstream would drop a label the styler disabled: it has to be left out
         * of the label data here, or it reserves space and acts as an obstacle while drawing nothing.
         *
         * Reaching that route takes a single placement with several orientations, plus an explicit
         * `alwaysShow` — an orientation array otherwise makes the label hideable, which routes it through
         * the cascade instead, where the engine skips hidden candidates itself.
         */
        const orientationOnlyChart = (styler: (params: any) => object) =>
            barChart({
                placement: 'inside-center',
                orientation: ['horizontal', 'vertical'],
                collision: { alwaysShow: true },
                itemStyler: styler,
            });

        it('reserves no placement for a disabled label on the orientation-only route', async () => {
            await render(orientationOnlyChart(() => ({ enabled: false })));

            expect(visibleLabels()).toHaveLength(0);
            expect(placementLabelData()).toHaveLength(0);
        });

        it('still reserves placement for an enabled label on the orientation-only route', async () => {
            await render(orientationOnlyChart(() => ({})));

            expect(placementLabelData().length).toBeGreaterThan(0);
        });
    });

    describe('bubble', () => {
        const bubbleChart = (label: object) => ({
            data: [{ x: 1, y: 1, size: 4, label: 'one' }],
            legend: { enabled: false },
            axes: { x: { type: 'number', position: 'bottom' }, y: { type: 'number', position: 'left' } },
            series: [
                {
                    type: 'bubble',
                    xKey: 'x',
                    yKey: 'y',
                    sizeKey: 'size',
                    labelKey: 'label',
                    minSize: 20,
                    maxSize: 30,
                    label: { enabled: true, placement: 'top', ...label },
                },
            ],
        });

        it('reserves the styled box for a marker label', async () => {
            const plain = await labelYs(bubbleChart({}));
            const padded = await labelYs(bubbleChart({ itemStyler: () => ({ fill: '#eeeeee', padding: 15 }) }));

            expect(padded).toHaveLength(plain.length);
            for (const [index, y] of padded.entries()) {
                expect(y).toBeCloseTo(plain[index] - 15, 5);
            }
        });

        it('hides a marker label its styler disabled', async () => {
            await render(bubbleChart({ itemStyler: () => ({ enabled: false }) }));
            expect(visibleLabels()).toHaveLength(0);
        });
    });

    /**
     * One baseline per placement family, each packing the whole style matrix into a single chart: an unstyled
     * control, the box variants (fill, border, padding without a box), a styler whose box differs per
     * candidate so the cascade lands somewhere the first candidate's geometry would not have, and a label the
     * styler disabled. Each asserts the resolved placements before snapshotting, so a regression names the
     * label that moved rather than only reporting differing pixels.
     */
    describe('visuals', () => {
        const tagFormatter = ({ datum }: any) => datum.tag;

        type DrawnLabel = { placement?: string; rotation?: number };

        const drawnLabelNodes = (seriesIndex: number) =>
            getVisibleLabelNodes<DrawnLabel & { label?: DrawnLabel }>(chart, seriesIndex);

        /** The text of every label the series drew, sorted, so a label its styler disabled is absent. */
        const drawnLabelTexts = (seriesIndex = 0) =>
            drawnLabelNodes(seriesIndex)
                .map((node) => node.text)
                .sort((a, b) => a.localeCompare(b));

        /** The y each drawn label's text was rendered at, keyed by its text. */
        const drawnLabelYs = (seriesIndex = 0) =>
            Object.fromEntries(drawnLabelNodes(seriesIndex).map((node) => [node.text, node.y]));

        /**
         * The placement — plus the quarter-turn, where the series resolves an orientation too — each drawn label
         * landed at, keyed by its text. Read from the scene rather than the styler's calls: the render pass
         * reuses the cached styler result for the winning candidate, so the last recorded call is the last
         * candidate the cascade probed, not the one it chose.
         */
        const drawnPlacements = (seriesIndex = 0) => {
            const placements: Record<string, string | undefined> = {};
            for (const { text, datum } of drawnLabelNodes(seriesIndex)) {
                // Bar-family labels carry the resolved placement on their nested box, compass ones directly.
                const { placement, rotation } = datum.label?.placement == null ? datum : datum.label;
                placements[text] = rotation ? `${placement}/${Math.round((rotation * 180) / Math.PI)}` : placement;
            }
            return placements;
        };

        it('draws bar labels in the box their styler resolved at the winning candidate', async () => {
            const barStyler = ({ datum, placement, orientation }: any) => {
                switch (datum.tag) {
                    case 'fill':
                        return { color: '#333333', fill: '#ffd9d9', padding: 8 };
                    case 'brdr':
                        return { padding: 8, border: { enabled: true, stroke: '#008800', strokeWidth: 4 } };
                    case 'pad':
                        // Neither fill nor border, so there is no box for the padding to expand.
                        return { padding: 14 };
                    case 'pout':
                        // The same padding as `out` but boxless, so it reserves nothing extra and keeps the
                        // inside placement `out` is pushed off — padding alone must not enlarge the footprint.
                        return { padding: 18 };
                    case 'turn':
                        // Too wide to lie across the bar, so the cascade turns it upright; the fill is the
                        // vertical candidate's, proving the box drawn is the one resolved where it landed.
                        return {
                            color: '#333333',
                            fill: orientation === 'vertical' ? '#d9d9ff' : '#ffd9d9',
                            padding: { top: 2, bottom: 2, left: 40, right: 40 },
                        };
                    case 'out':
                        // Padded past what the short bar holds, and styled per placement, so the box drawn
                        // outside is not the box that failed inside.
                        return placement === 'outside-end'
                            ? { fill: '#d9e9ff', padding: 4 }
                            : { fill: '#ffd9d9', padding: 18 };
                    case 'off':
                        return { enabled: false };
                    default:
                        return {};
                }
            };

            await render({
                data: [
                    { tag: 'none', value: 90 },
                    { tag: 'fill', value: 90 },
                    { tag: 'brdr', value: 90 },
                    { tag: 'pad', value: 90 },
                    { tag: 'turn', value: 90 },
                    { tag: 'out', value: 8 },
                    { tag: 'pout', value: 8 },
                    { tag: 'off', value: 90 },
                ],
                legend: { enabled: false },
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left', max: 100 },
                },
                series: [
                    {
                        type: 'bar',
                        xKey: 'tag',
                        yKey: 'value',
                        label: {
                            enabled: true,
                            placement: ['inside-center', 'outside-end'],
                            orientation: ['horizontal', 'vertical'],
                            formatter: tagFormatter,
                            itemStyler: barStyler,
                        },
                    },
                ],
            });

            expect(drawnLabelTexts()).toEqual(['brdr', 'fill', 'none', 'out', 'pad', 'pout', 'turn']);
            expect(drawnPlacements()).toEqual({
                none: 'inside-center',
                fill: 'inside-center',
                brdr: 'inside-center',
                pad: 'inside-center',
                turn: 'inside-center/-90',
                // Same bar and same padding as `pout`, but boxed, so only this one outgrows the bar.
                out: 'outside-end',
                pout: 'inside-center',
            });
            await compareImageSnapshot(chart, canvasCtx);
        });

        it('draws marker labels in the box their styler resolved at the winning candidate', async () => {
            const lineStyler = ({ datum, placement }: any) => {
                switch (datum.tag) {
                    case 'fill':
                        return { fill: '#ffd9d9', padding: 8 };
                    case 'brdr':
                        return { padding: 8, border: { enabled: true, stroke: '#0066cc', strokeWidth: 4 } };
                    case 'pad':
                        // Padding with neither fill nor border, so there is no box to pad.
                        return { padding: 14 };
                    case 'wide':
                        // Reserves a box far wider than its text, so its neighbour `near` can no longer sit
                        // above its own point and cascades below instead. Styled per placement, so the box the
                        // cascade tested above is not the one drawn below.
                        return placement === 'top'
                            ? { fill: '#ffd9d9', padding: { top: 4, bottom: 4, left: 30, right: 30 } }
                            : { fill: '#d9f2d9', padding: 4 };
                    case 'off':
                        // Disabled but boxed: nothing is drawn, and nothing is reserved either, so the
                        // neighbouring `keep` label stays above its point.
                        return { enabled: false, fill: '#ffd9d9', padding: { top: 4, bottom: 4, left: 30, right: 30 } };
                    default:
                        return {};
                }
            };
            const bubbleStyler = ({ datum }: any) => {
                switch (datum.tag) {
                    case 'in':
                        return { fill: '#ffe9c0', padding: 2 };
                    case 'over':
                        // Wider than the marker can hold, so the label cascades out of it.
                        return { fill: '#ffd9d9', padding: 10 };
                    default:
                        return { enabled: false };
                }
            };

            await render({
                legend: { enabled: false },
                axes: {
                    x: { type: 'number', position: 'bottom', min: -0.5, max: 8.5 },
                    y: { type: 'number', position: 'left', min: 0, max: 100 },
                },
                series: [
                    {
                        type: 'line',
                        data: [
                            { x: 0, y: 60, tag: 'none' },
                            { x: 1, y: 60, tag: 'fill' },
                            { x: 2, y: 60, tag: 'brdr' },
                            { x: 3, y: 60, tag: 'pad' },
                            { x: 4.6, y: 60, tag: 'wide' },
                            { x: 5, y: 60, tag: 'near' },
                            { x: 6.3, y: 60, tag: 'grow' },
                            { x: 7.4, y: 60, tag: 'off' },
                            { x: 7.8, y: 60, tag: 'keep' },
                        ],
                        xKey: 'x',
                        yKey: 'y',
                        // The styled marker size feeds the label gap, so `grow` sits further out than its peers.
                        marker: {
                            enabled: true,
                            size: 10,
                            itemStyler: ({ datum }: any) => (datum.tag === 'grow' ? { size: 40 } : {}),
                        },
                        label: {
                            enabled: true,
                            placement: ['top', 'bottom'],
                            formatter: tagFormatter,
                            itemStyler: lineStyler,
                        },
                    },
                    {
                        type: 'bubble',
                        data: [
                            { x: 1, y: 20, size: 1, tag: 'in' },
                            { x: 4, y: 20, size: 1, tag: 'over' },
                            { x: 7, y: 20, size: 1, tag: 'gone' },
                        ],
                        xKey: 'x',
                        yKey: 'y',
                        sizeKey: 'size',
                        labelKey: 'tag',
                        minSize: 40,
                        maxSize: 40,
                        // The styler's box fills are pale, so the inside default is invisible on them.
                        label: {
                            enabled: true,
                            placement: ['inside', 'top'],
                            insideStyle: { color: { ref: 'textColor' } },
                            itemStyler: bubbleStyler,
                        },
                    },
                ],
            });

            expect(drawnLabelTexts(0)).toEqual(['brdr', 'fill', 'grow', 'keep', 'near', 'none', 'pad', 'wide']);
            expect(drawnPlacements(0)).toEqual({
                none: 'top',
                fill: 'top',
                brdr: 'top',
                pad: 'top',
                wide: 'top',
                near: 'bottom',
                grow: 'top',
                keep: 'top',
            });
            // Padding only counts where there is a box to pad, so boxless `pad` lands on `none` while
            // `fill` clears its point by the 8px its box adds beneath the text.
            const ys = drawnLabelYs(0);
            expect(ys.pad).toBeCloseTo(ys.none, 5);
            expect(ys.fill).toBeCloseTo(ys.none - 8, 5);

            expect(drawnLabelTexts(1)).toEqual(['in', 'over']);
            expect(drawnPlacements(1)).toEqual({ in: 'inside', over: 'top' });
            await compareImageSnapshot(chart, canvasCtx);
        });
    });
});
