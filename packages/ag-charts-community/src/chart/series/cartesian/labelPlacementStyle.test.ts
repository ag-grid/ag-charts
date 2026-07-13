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
                nodes(): { visible: boolean; fill?: string; getBoxingProperties(): { fill?: string } }[];
            };
        };
        const label = series.labelSelection.nodes().find((node) => node.visible);
        expect(label).toBeDefined();
        return { color: label!.fill, boxFill: label!.getBoxingProperties().fill };
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
