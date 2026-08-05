import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance } from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import {
    compareImageSnapshot,
    deproxy,
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
        await compareImageSnapshot(chart, ctx);
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

        it('lets insideStyle.color win over an explicit top-level label.color', async () => {
            await renderAndSnapshot(
                barOptions({
                    placement: 'inside-center',
                    color: '#0000ff',
                    insideStyle: { color: '#ff0000' },
                })
            );
            expect(firstVisibleLabelStyle().color).toBe('#ff0000');
        });

        // The per-placement colour rule, split one chart per placement (the mock canvas only snapshots
        // the first chart created per test). Inside default is the box-readable chartBackgroundColor,
        // outside default is the textColor; a top-level label.color beats either default, and a
        // per-placement colour beats the top-level value only for its own placement.
        const COLOUR_CASES: Array<[string, object, string]> = [
            ['inside default resolves chartBackgroundColor', { placement: 'inside-center' }, 'white'],
            ['outside default resolves textColor', { placement: 'outside-end' }, '#464646'],
            [
                'top-level label.color beats the inside default',
                { placement: 'inside-center', color: '#0000ff' },
                '#0000ff',
            ],
            [
                'top-level label.color beats the outside default',
                { placement: 'outside-end', color: '#0000ff' },
                '#0000ff',
            ],
            [
                'insideStyle.color wins for the inside placement',
                { placement: 'inside-center', color: '#0000ff', insideStyle: { color: '#ff0000' } },
                '#ff0000',
            ],
            [
                'outside falls back to the top-level colour when only insideStyle.color is set',
                { placement: 'outside-end', color: '#0000ff', insideStyle: { color: '#ff0000' } },
                '#0000ff',
            ],
        ];
        it.each(COLOUR_CASES)('resolves label colour: %s', async (_name, labelOptions, expected) => {
            await renderAndSnapshot(barOptions(labelOptions));
            expect(firstVisibleLabelStyle().color).toBe(expected);
        });

        // A colour reaching `label.color` via `theme.overrides` must beat the per-placement default just
        // as a series-level `label.color` does — the default applies only when no colour was supplied.
        it.each(['inside-center', 'outside-end'])(
            'applies a theme-override label colour for a %s placement',
            async (placement) => {
                const options = {
                    ...barOptions({ placement }),
                    theme: { overrides: { bar: { series: { label: { color: 'rgb(190, 55, 55)' } } } } },
                };
                prepareTestOptions(options as any);
                chart = AgCharts.create(options as any);
                await waitForChartStability(chart);
                expect(firstVisibleLabelStyle().color).toBe('rgb(190, 55, 55)');
            }
        );

        // The repro: a rotated (vertical) khaki-boxed label must float clear of the bar AND stay centred
        // on it, whatever the per-side padding. Each variant renders its own baseline for eyeballing.
        const ROTATED_PADDINGS: Record<string, object> = {
            symmetric: { top: 0, bottom: 0, left: 10, right: 10 },
            'wide left': { top: 0, bottom: 0, left: 50, right: 10 },
            'wide right': { top: 0, bottom: 0, left: 10, right: 50 },
            'tall + asymmetric': { top: 40, bottom: 4, left: 50, right: 10 },
        };
        it.each(Object.entries(ROTATED_PADDINGS))(
            'floats a rotated vertical outside-end label clear of and centred on the bar (%s padding)',
            async (_name, padding) => {
                await renderAndSnapshot(
                    barOptions({ placement: 'outside-end', orientation: 'vertical', fill: 'khaki', padding })
                );
            }
        );

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

        it('lets insideStyle.cornerRadius win over an explicit top-level label.cornerRadius', async () => {
            await renderAndSnapshot(
                barOptions({
                    placement: 'inside-center',
                    cornerRadius: 5,
                    insideStyle: { fill: '#ff0000', cornerRadius: 12 },
                })
            );
            expect(firstVisibleLabelStyle().cornerRadius).toBe(12);
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

        it('lets outsideStyle.color win over an explicit top-level label.color', async () => {
            await renderAndSnapshot(
                bubbleOptions({
                    placement: 'top',
                    color: '#0000ff',
                    outsideStyle: { color: '#00ff00' },
                })
            );
            expect(firstVisibleLabelStyle().color).toBe('#00ff00');
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

    type CapturedLabelParams = { placement?: string; orientation?: string; fill?: unknown; datum?: unknown };

    // Renders with a spy itemStyler on every series and returns the params it received per label.
    const captureLabelParams = async (options: any) => {
        const captured: CapturedLabelParams[] = [];
        for (const series of options.series) {
            series.label = { ...series.label, itemStyler: (params: any) => (captured.push(params), {}) };
        }
        prepareTestOptions(options);
        chart = AgCharts.create(options);
        await waitForChartStability(chart);
        expect(captured.length).toBeGreaterThan(0);
        return captured;
    };

    /**
     * The granular placement each bar label was finally drawn at, as the placement engine wrote it back.
     * The styler's params cannot answer this on their own: it is invoked once per candidate the cascade
     * probes, and the render pass reuses the cached result rather than calling it again for the winner.
     */
    const drawnBarPlacements = () => {
        const series = deproxy(chart as any).series[0] as unknown as {
            contextNodeData?: { labelData: { label?: { placement?: string; hidden?: boolean } }[] };
        };
        return (series.contextNodeData?.labelData ?? [])
            .map((node) => node.label)
            .filter((label) => label != null && label.hidden !== true)
            .map((label) => label!.placement);
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

    it('reports the resolved (not first) placement when a bar placement array cascades', async () => {
        // Bars far too short to hold a label at any width force the cascade off the first candidate
        // (inside-center) onto the fallback (outside-end), which floats free of the bar rect.
        const flatBars = {
            ...barChart({ placement: ['inside-center', 'outside-end'] }),
            data: [
                { cat: 'A', value: 2 },
                { cat: 'B', value: 1 },
                { cat: 'C', value: 2 },
            ],
            axes: { x: { type: 'category', position: 'bottom' }, y: { type: 'number', position: 'left', max: 100 } },
        };
        const params = await captureLabelParams(flatBars);
        expect(drawnBarPlacements()).toEqual(['outside-end', 'outside-end', 'outside-end']);
        // The fallback was resolved through the styler, which also saw the inside candidate it rejected.
        expect(params.some((p) => p.placement === 'outside-end')).toBe(true);
        expect(params.every((p) => p.orientation === 'horizontal')).toBe(true);
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
