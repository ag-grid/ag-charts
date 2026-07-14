import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance } from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import { expectPixelIdenticalAcrossUpdate } from '../../test/bigintExamples';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    createChart,
    deproxy,
    extractImageData,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../../test/utils';

// Bar represents the authored (`inside-*`/`outside-*`) placement family, bubble the resolved
// (`inside` vs directional) marker family, so between them they cover both ways placement is decided.
describe('label placement style (insideStyle/outsideStyle)', () => {
    setupMockConsole();

    let chart: AgChartInstance;
    const ctx = setupMockCanvas();

    afterEach(() => {
        chart?.destroy();
    });

    const renderAndSnapshot = async (options: object) => {
        prepareTestOptions(options as any);
        chart = AgCharts.create(options as any);
        await waitForChartStability(chart);
        expect(extractImageData(ctx)).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    // Reads the first visible label's text colour and background (boxing) fill off the live scene
    // graph, so assertions check what was actually rendered rather than re-deriving the resolved style.
    const firstVisibleLabelStyle = (seriesIndex = 0) => {
        const series = deproxy(chart as any).series[seriesIndex] as unknown as {
            labelSelection: {
                nodes(): {
                    visible: boolean;
                    fill?: string;
                    // `boxing` is the label's box Rect; `Rect.cornerRadius` is write-only, so read the
                    // resolved value back off `topLeftCornerRadius`.
                    boxing?: { topLeftCornerRadius: number };
                    getBoxingProperties(): {
                        fill?: string;
                        padding?: number;
                        border: { stroke?: string; strokeWidth?: number };
                    };
                }[];
            };
        };
        const label = series.labelSelection.nodes().find((node) => node.visible);
        expect(label).toBeDefined();
        const boxing = label!.getBoxingProperties();
        return {
            color: label!.fill,
            boxFill: boxing.fill,
            cornerRadius: label!.boxing?.topLeftCornerRadius,
            padding: boxing.padding,
            boxStroke: boxing.border.stroke,
        };
    };

    describe('bar-family (column)', () => {
        const barData = [
            { cat: 'A', value: 80 },
            { cat: 'B', value: 60 },
            { cat: 'C', value: 90 },
        ];
        const barOptions = (labelOptions: object) => ({
            data: barData,
            legend: { enabled: false },
            axes: { x: { type: 'category', position: 'bottom' }, y: { type: 'number', position: 'left' } },
            series: [{ type: 'bar', xKey: 'cat', yKey: 'value', label: { enabled: true, ...labelOptions } }],
        });

        it('applies insideStyle.color for an inside-center placement', async () => {
            await renderAndSnapshot(
                barOptions({
                    placement: 'inside-center',
                    insideStyle: { color: '#ff0000' },
                    outsideStyle: { color: '#00ff00' },
                })
            );
            expect(firstVisibleLabelStyle().color).toBe('#ff0000');
        });

        it('applies outsideStyle.color for an outside-end placement', async () => {
            await renderAndSnapshot(
                barOptions({
                    placement: 'outside-end',
                    insideStyle: { color: '#ff0000' },
                    outsideStyle: { color: '#00ff00' },
                })
            );
            expect(firstVisibleLabelStyle().color).toBe('#00ff00');
        });

        it('lets an explicit top-level label.color win over insideStyle.color', async () => {
            await renderAndSnapshot(
                barOptions({
                    placement: 'inside-center',
                    color: '#0000ff',
                    insideStyle: { color: '#ff0000' },
                })
            );
            expect(firstVisibleLabelStyle().color).toBe('#0000ff');
        });

        // With the top-level colour pinned, the render must be pixel-identical whether or not an
        // insideStyle colour is supplied — proving the override is inert, not matching by coincidence.
        it('renders identically whether insideStyle.color is set or absent once label.color is pinned', async () => {
            await expectPixelIdenticalAcrossUpdate(
                ctx,
                createChart,
                barOptions({ placement: 'inside-center', color: '#0000ff' }) as any,
                barOptions({ placement: 'inside-center', color: '#0000ff', insideStyle: { color: '#ff0000' } }) as any
            );
        });

        it('resolves fill independently per placement while label.color stays pinned', async () => {
            await renderAndSnapshot(
                barOptions({
                    placement: 'inside-center',
                    color: '#ffffff',
                    insideStyle: { fill: '#ff0000' },
                    outsideStyle: { fill: '#0000ff' },
                })
            );
            const style = firstVisibleLabelStyle();
            expect(style.color).toBe('#ffffff');
            expect(style.boxFill).toBe('#ff0000');
        });

        it('resolves fill independently per placement (outside) while label.color stays pinned', async () => {
            await renderAndSnapshot(
                barOptions({
                    placement: 'outside-end',
                    color: '#ffffff',
                    insideStyle: { fill: '#ff0000' },
                    outsideStyle: { fill: '#0000ff' },
                })
            );
            const style = firstVisibleLabelStyle();
            expect(style.color).toBe('#ffffff');
            expect(style.boxFill).toBe('#0000ff');
        });

        it('resolves cornerRadius and padding independently per placement', async () => {
            await renderAndSnapshot(
                barOptions({
                    placement: 'inside-center',
                    insideStyle: { fill: '#ff0000', cornerRadius: 12, padding: 20 },
                    outsideStyle: { fill: '#0000ff', cornerRadius: 3, padding: 4 },
                })
            );
            const style = firstVisibleLabelStyle();
            expect(style.cornerRadius).toBe(12);
            expect(style.padding).toBe(20);
        });

        it('lets an explicit top-level label.cornerRadius win over insideStyle.cornerRadius', async () => {
            await renderAndSnapshot(
                barOptions({
                    placement: 'inside-center',
                    cornerRadius: 5,
                    insideStyle: { fill: '#ff0000', cornerRadius: 12 },
                })
            );
            expect(firstVisibleLabelStyle().cornerRadius).toBe(5);
        });

        it('resolves the border stroke per placement while the top-level border governs enablement', async () => {
            await renderAndSnapshot(
                barOptions({
                    placement: 'inside-center',
                    border: { enabled: true },
                    insideStyle: { border: { stroke: '#ff0000' } },
                    outsideStyle: { border: { stroke: '#0000ff' } },
                })
            );
            expect(firstVisibleLabelStyle().boxStroke).toBe('#ff0000');
        });
    });

    // Marker-family series resolve placement rather than authoring it directly: `'inside'` centres the
    // label in the marker (inside), any directional placement (e.g. `'top'`) sits beside it (outside).
    describe('marker-family (bubble)', () => {
        const bubbleData = [
            { x: 0, y: 50, size: 80, label: 'A' },
            { x: 1, y: 55, size: 70, label: 'B' },
            { x: 2, y: 45, size: 75, label: 'C' },
        ];
        const bubbleOptions = (labelOptions: object) => ({
            data: bubbleData,
            legend: { enabled: false },
            axes: {
                x: { type: 'number', position: 'bottom', min: -1, max: 3 },
                y: { type: 'number', position: 'left', min: 0, max: 100 },
            },
            series: [
                {
                    type: 'bubble',
                    xKey: 'x',
                    yKey: 'y',
                    sizeKey: 'size',
                    labelKey: 'label',
                    minSize: 60,
                    maxSize: 90,
                    label: { enabled: true, ...labelOptions },
                },
            ],
        });

        it('applies insideStyle.color for an inside placement', async () => {
            await renderAndSnapshot(
                bubbleOptions({
                    placement: 'inside',
                    insideStyle: { color: '#ff0000' },
                    outsideStyle: { color: '#00ff00' },
                })
            );
            expect(firstVisibleLabelStyle().color).toBe('#ff0000');
        });

        it('applies outsideStyle.color for a directional (top) placement', async () => {
            await renderAndSnapshot(
                bubbleOptions({
                    placement: 'top',
                    insideStyle: { color: '#ff0000' },
                    outsideStyle: { color: '#00ff00' },
                })
            );
            expect(firstVisibleLabelStyle().color).toBe('#00ff00');
        });

        it('lets an explicit top-level label.color win over outsideStyle.color', async () => {
            await renderAndSnapshot(
                bubbleOptions({
                    placement: 'top',
                    color: '#0000ff',
                    outsideStyle: { color: '#00ff00' },
                })
            );
            expect(firstVisibleLabelStyle().color).toBe('#0000ff');
        });

        it('renders identically whether outsideStyle.color is set or absent once label.color is pinned', async () => {
            await expectPixelIdenticalAcrossUpdate(
                ctx,
                createChart,
                bubbleOptions({ placement: 'top', color: '#0000ff' }) as any,
                bubbleOptions({ placement: 'top', color: '#0000ff', outsideStyle: { color: '#00ff00' } }) as any
            );
        });

        it('resolves fill independently per placement (inside) while label.color stays pinned', async () => {
            await renderAndSnapshot(
                bubbleOptions({
                    placement: 'inside',
                    color: '#ffffff',
                    insideStyle: { fill: '#ff0000' },
                    outsideStyle: { fill: '#0000ff' },
                })
            );
            const style = firstVisibleLabelStyle();
            expect(style.color).toBe('#ffffff');
            expect(style.boxFill).toBe('#ff0000');
        });

        it('resolves fill independently per placement (top) while label.color stays pinned', async () => {
            await renderAndSnapshot(
                bubbleOptions({
                    placement: 'top',
                    color: '#ffffff',
                    insideStyle: { fill: '#ff0000' },
                    outsideStyle: { fill: '#0000ff' },
                })
            );
            const style = firstVisibleLabelStyle();
            expect(style.color).toBe('#ffffff');
            expect(style.boxFill).toBe('#0000ff');
        });
    });
});

// The itemStyler receives the placement/orientation actually chosen for each label (the resolved
// value, not the raw candidate array), mirroring how `fill` reflects the colour actually applied.
describe('resolved placement/orientation in itemStyler params', () => {
    setupMockConsole();

    let chart: AgChartInstance;
    setupMockCanvas();

    afterEach(() => {
        chart?.destroy();
    });

    // Renders with a spy itemStyler on every series and returns the params it received per label.
    const captureLabelParams = async (options: any) => {
        const captured: Array<{ placement?: string; orientation?: string; fill?: unknown }> = [];
        for (const series of options.series) {
            series.label = { ...series.label, itemStyler: (params: any) => (captured.push(params), {}) };
        }
        prepareTestOptions(options);
        chart = AgCharts.create(options);
        await waitForChartStability(chart);
        expect(captured.length).toBeGreaterThan(0);
        return captured;
    };

    const barChart = (labelOptions: object) => ({
        data: [
            { cat: 'A', value: 80 },
            { cat: 'B', value: 60 },
            { cat: 'C', value: 90 },
        ],
        legend: { enabled: false },
        axes: { x: { type: 'category', position: 'bottom' }, y: { type: 'number', position: 'left' } },
        series: [{ type: 'bar', xKey: 'cat', yKey: 'value', label: { enabled: true, ...labelOptions } }],
    });

    // Bubble takes a size channel and a label key; scatter takes the label key; line/area derive
    // label text from yKey and accept neither.
    const pointExtraProps: Record<string, object> = {
        bubble: { sizeKey: 'size', minSize: 60, maxSize: 90, labelKey: 'label' },
        scatter: { labelKey: 'label' },
    };

    const pointChart = (type: string, labelOptions: object) => {
        const extraProps = pointExtraProps[type] ?? {};
        return {
            data: [
                { x: 0, y: 50, size: 80, label: 'A' },
                { x: 1, y: 55, size: 70, label: 'B' },
                { x: 2, y: 45, size: 75, label: 'C' },
            ],
            legend: { enabled: false },
            axes: {
                x: { type: 'number', position: 'bottom', min: -1, max: 3 },
                y: { type: 'number', position: 'left', min: 0, max: 100 },
            },
            series: [{ type, xKey: 'x', yKey: 'y', ...extraProps, label: { enabled: true, ...labelOptions } }],
        };
    };

    it('reflects the bar default placement (inside-center) and orientation (horizontal)', async () => {
        const params = await captureLabelParams(barChart({}));
        expect(params.every((p) => p.placement === 'inside-center')).toBe(true);
        expect(params.every((p) => p.orientation === 'horizontal')).toBe(true);
    });

    it('reflects a single bar placement and orientation', async () => {
        const params = await captureLabelParams(barChart({ placement: 'outside-end', orientation: 'vertical' }));
        expect(params.every((p) => p.placement === 'outside-end')).toBe(true);
        expect(params.every((p) => p.orientation === 'vertical')).toBe(true);
    });

    it('resolves a bar orientation candidate array to one of its members per label', async () => {
        const params = await captureLabelParams(barChart({ orientation: ['horizontal', 'vertical'] }));
        expect(params.every((p) => p.orientation === 'horizontal' || p.orientation === 'vertical')).toBe(true);
    });

    it('is present in the same call as the resolved fill (bar)', async () => {
        const params = await captureLabelParams(barChart({ placement: 'inside-center', fill: '#123456' }));
        expect(params.every((p) => p.placement === 'inside-center' && p.fill === '#123456')).toBe(true);
    });

    it.each(['bubble', 'scatter', 'line', 'area'])(
        'reflects a single configured placement for %s series (no orientation)',
        async (type) => {
            const params = await captureLabelParams(pointChart(type, { placement: 'top' }));
            expect(params.every((p) => p.placement === 'top')).toBe(true);
            expect(params.every((p) => p.orientation === undefined)).toBe(true);
        }
    );

    it('resolves a marker placement candidate array to one of its members per label', async () => {
        const params = await captureLabelParams(pointChart('bubble', { placement: ['inside', 'top'] }));
        expect(params.every((p) => p.placement === 'inside' || p.placement === 'top')).toBe(true);
    });
});
