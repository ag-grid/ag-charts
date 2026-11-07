import { describe, expect, it } from 'vitest';

import {
    GLOW_ROUTES,
    GLOW_SCENE_SIZE,
    TRANSLUCENT_BLUE,
    redGlow,
    setupMockCanvas,
    useGlowScenes,
} from 'ag-charts-community-test';

import { BoxPlotNode } from './boxPlotNode';

const CLEAR = [0, 0, 0, 0];
const BLUE = [0, 0, 255];

// A box from x 120 to 280 and y 80 to 140, with whiskers 4px thick along y 110 out to x 40 and x 360, which are paths of their own.
const WHISKER_Y = 110;
const WHISKER_X = 80;

describe('glow gap of a box plot', () => {
    setupMockCanvas(GLOW_SCENE_SIZE);
    const draw = useGlowScenes();

    const boxPlot = (gap?: number) =>
        Object.assign(new BoxPlotNode(), {
            horizontal: true,
            center: WHISKER_Y,
            thickness: 60,
            min: 40,
            q1: 120,
            median: 200,
            q3: 280,
            max: 360,
            fill: TRANSLUCENT_BLUE,
            stroke: TRANSLUCENT_BLUE,
            strokeWidth: 1,
            wickStroke: 'rgba(0, 0, 255, 0.5)',
            wickStrokeWidth: 4,
            crisp: false,
            fillGlow: redGlow(gap),
        });

    describe.each(GLOW_ROUTES)('cast by the %s', (route) => {
        it('should show the glow through the whisker with no gap', () => {
            const { pixelAt } = draw(route, boxPlot());

            expect(pixelAt(WHISKER_X, WHISKER_Y)[0]).toBeGreaterThan(0);
            expect(pixelAt(WHISKER_X, WHISKER_Y - 6)[3]).toBeGreaterThan(0);
        });

        it('should cut the whisker out of the glow with a gap of 0, as it cuts the box', () => {
            const { pixelAt } = draw(route, boxPlot(0));

            expect(pixelAt(WHISKER_X, WHISKER_Y).slice(0, 3)).toEqual(BLUE);
            expect(pixelAt(200, WHISKER_Y - 10).slice(0, 3)).toEqual(BLUE);
            expect(pixelAt(WHISKER_X, WHISKER_Y - 6)[3]).toBeGreaterThan(0);
        });

        it('should start the glow a gap past the whisker', () => {
            const { pixelAt } = draw(route, boxPlot(5));

            expect(pixelAt(WHISKER_X, WHISKER_Y).slice(0, 3)).toEqual(BLUE);
            // The whisker ends 2px from its centre, so the glow starts at 7 and ends at 17.
            expect(pixelAt(WHISKER_X, WHISKER_Y - 4)).toEqual(CLEAR);
            expect(pixelAt(WHISKER_X, WHISKER_Y - 12)[3]).toBeGreaterThan(0);
            expect(pixelAt(WHISKER_X, WHISKER_Y - 20)).toEqual(CLEAR);
        });
    });
});
