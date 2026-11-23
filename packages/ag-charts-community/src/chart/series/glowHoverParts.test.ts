import { afterEach, describe, expect, it, vi } from 'vitest';

import { shadowPass } from 'ag-charts-core';
import type { Shape } from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import { Marker } from '../marker/marker';
import { differingBytes } from '../test/expectSamePixels';
import { canvasImage, endHover, hoverDatum } from '../test/glowRender';
import { getSeriesAt } from '../test/seriesAccessors';
import { SERIES_GLOW, glowShadow, shapesOf } from '../test/shadowFixtures';
import {
    SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
    createChart,
    deproxy,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';

const POINTS = 200;
const SERIES = 3;
/** Past the 512 casters that the glows of the overlay are cast in parts of one strength each. */
const DATA = Array.from({ length: POINTS }, (_, i) => ({
    x: i + 1,
    y0: (i * 7) % 50,
    y1: (i * 11) % 50,
    y2: (i * 13) % 50,
}));

interface Config {
    name: string;
    glow: object;
    highlight?: object;
}

const CONFIGS: Config[] = [
    { name: 'the default theme', glow: SERIES_GLOW },
    { name: 'unhighlightedSeries.opacity: 1', glow: SERIES_GLOW, highlight: { unhighlightedSeries: { opacity: 1 } } },
    { name: 'a glow with a gap', glow: { ...SERIES_GLOW, gap: 5 } },
];

/** A hover leaves the glows of most casters as they were, so it draws them from the parts that the casts before it kept. */
describe.each(CONFIGS)('the glows of a hover with many casters, with $name', ({ glow, highlight }) => {
    setupMockConsole();
    setupMockCanvas();

    let chart: ReturnType<typeof deproxy>;
    afterEach(() => {
        chart?.destroy();
        vi.restoreAllMocks();
    });

    const create = async () => {
        chart?.destroy();
        chart = deproxy(
            await createChart({
                data: DATA,
                animation: { enabled: false },
                legend: { enabled: false },
                ...SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
                series: Array.from({ length: SERIES }, (_, i) => ({
                    type: 'scatter',
                    xKey: 'x',
                    yKey: `y${i}`,
                    size: 6,
                    glow,
                    highlight,
                })),
            } as AgChartOptions)
        );
        await waitForChartStability(chart);
    };

    const markersOf = (seriesIndex: number): Shape[] => shapesOf(getSeriesAt(chart, seriesIndex).contentGroup, Marker);

    /** The markers whose masks the cast of the overlay draws during `action`, as against those of footprints it erases. */
    const maskedDuring = async (action: () => Promise<void>) => {
        const masked = new Set<unknown>();
        const render = Marker.prototype.isolatedRender;
        vi.spyOn(Marker.prototype, 'isolatedRender').mockImplementation(function (this: Marker, ...args) {
            if (shadowPass.state === 'mask' && shadowPass.erase == null) masked.add(this);
            return render.apply(this, args);
        });
        await action();
        vi.mocked(Marker.prototype.isolatedRender).mockRestore();
        return masked;
    };

    it('should not cast the glow of the series that a move between items of another leaves as it was', async () => {
        await create();
        await hoverDatum(chart, 0, 0);
        await hoverDatum(chart, 0, 5);

        const masked = await maskedDuring(() => hoverDatum(chart, 0, 9));

        for (const marker of [...markersOf(1), ...markersOf(2)]) expect(masked.has(marker)).toBe(false);
        expect(masked.size).toBeGreaterThan(0);
    });

    it('should draw the glows of a hover that moves as a chart hovered there draws them', async () => {
        await create();
        await hoverDatum(chart, 0, 0);
        await hoverDatum(chart, 0, 5);
        await hoverDatum(chart, 0, 9);
        const moved = canvasImage(chart);
        expect(Array.from(moved.data).some((value) => value !== 0)).toBe(true);

        await create();
        await hoverDatum(chart, 0, 9);

        expect(differingBytes(moved, canvasImage(chart))).toBe(0);
    });

    it('should draw the glows of a hover that ends, and that enters another series, as a chart in that state draws them', async () => {
        await create();
        const rest = canvasImage(chart);
        await hoverDatum(chart, 0, 0);
        await hoverDatum(chart, 1, 5);
        const switched = canvasImage(chart);
        await endHover(chart);
        expect(differingBytes(canvasImage(chart), rest)).toBe(0);

        await create();
        await hoverDatum(chart, 1, 5);
        expect(differingBytes(switched, canvasImage(chart))).toBe(0);
    });

    it('should keep one glow object on the series that a hover enters and leaves, whose glow the state leaves as it was', async () => {
        await create();
        const [first] = markersOf(1);
        const before = first.fillGlow;
        expect(before).toMatchObject(glowShadow(glow));

        await hoverDatum(chart, 0, 0);
        const entered = markersOf(1).map((marker) => marker.fillGlow);
        await endHover(chart);
        const left = markersOf(1).map((marker) => marker.fillGlow);

        for (const shape of [...entered, ...left]) expect(shape).toBe(before);
    });
});
