import { describe, expect, it } from 'vitest';

import {
    GLOW_CENTRE,
    GLOW_ROUTES,
    GLOW_SCENE_SIZE,
    TRANSLUCENT_BLUE,
    redGlow,
    setupMockCanvas,
    useGlowScenes,
} from 'ag-charts-community-test';

import { CandlestickNode } from './candlestick/candlestickNode';
import { SankeyLink } from './sankey/sankeyLink';

const { x: CENTRE_X, y: CENTRE_Y } = GLOW_CENTRE;
const CLEAR = [0, 0, 0, 0];
const BLUE = [0, 0, 255];

// A glow with a spread of 10 and no blur: a pixel is in it or out of it.
describe('glow gap of items that are not a simple path', () => {
    setupMockCanvas(GLOW_SCENE_SIZE);
    const draw = useGlowScenes();

    describe.each(GLOW_ROUTES)('cast by the %s', (route) => {
        describe('sankey link', () => {
            // A link of 40 across, from y 90 to y 130, whose extent is the whole layer, as its arcs are not bounded.
            const link = (gap?: number) =>
                Object.assign(new SankeyLink(), {
                    x1: 60,
                    x2: 340,
                    y1: 90,
                    y2: 90,
                    height: 40,
                    fill: TRANSLUCENT_BLUE,
                    strokeWidth: 0,
                    fillGlow: redGlow(gap),
                });

            it('should show the glow through the link with no gap', () => {
                const { pixelAt } = draw(route, link());

                expect(pixelAt(CENTRE_X, 85)[3]).toBeGreaterThan(0);
                expect(pixelAt(CENTRE_X, CENTRE_Y)[0]).toBeGreaterThan(0);
            });

            it('should cut the link out of the glow with a gap of 0', () => {
                const { pixelAt } = draw(route, link(0));

                expect(pixelAt(CENTRE_X, 85)[3]).toBeGreaterThan(0);
                expect(pixelAt(CENTRE_X, CENTRE_Y).slice(0, 3)).toEqual(BLUE);
            });

            it('should start the glow further out with a larger gap', () => {
                const { pixelAt } = draw(route, link(5));

                expect(pixelAt(CENTRE_X, CENTRE_Y).slice(0, 3)).toEqual(BLUE);
                expect(pixelAt(CENTRE_X, 87)).toEqual(CLEAR);
                expect(pixelAt(CENTRE_X, 80)[3]).toBeGreaterThan(0);
                expect(pixelAt(CENTRE_X, 70)).toEqual(CLEAR);
            });
        });

        describe('candlestick wicks', () => {
            // The body is 30 across from y 80 to 140, with a wick of 4 above it from y 40, which is a path of its own.
            const candle = (gap?: number) => {
                const node = new CandlestickNode();
                node.setStaticProperties(CENTRE_X, 30, 40, 140, 80, 140, false, undefined, redGlow(gap));
                node.fill = TRANSLUCENT_BLUE;
                node.stroke = TRANSLUCENT_BLUE;
                node.strokeWidth = 1;
                node.setWickProperties('rgba(0, 0, 255, 0.5)', 4, undefined, undefined, undefined);
                node.fillGlow = redGlow(gap);
                return node;
            };

            it('should show the glow through the wick with no gap', () => {
                const { pixelAt } = draw(route, candle());

                expect(pixelAt(CENTRE_X, 60)[0]).toBeGreaterThan(0);
                expect(pixelAt(CENTRE_X + 7, 60)[3]).toBeGreaterThan(0);
            });

            it('should cut the wick out of the glow with a gap of 0, as it cuts the body', () => {
                const { pixelAt } = draw(route, candle(0));

                expect(pixelAt(CENTRE_X, 60).slice(0, 3)).toEqual(BLUE);
                expect(pixelAt(CENTRE_X + 7, 60)[3]).toBeGreaterThan(0);
            });

            it('should start the glow a gap past the wick', () => {
                const { pixelAt } = draw(route, candle(5));

                expect(pixelAt(CENTRE_X, 60).slice(0, 3)).toEqual(BLUE);
                // The wick ends 2px from its centre, so the glow starts at 7 and ends at 17.
                expect(pixelAt(CENTRE_X + 4, 60)).toEqual(CLEAR);
                expect(pixelAt(CENTRE_X + 12, 60)[3]).toBeGreaterThan(0);
                expect(pixelAt(CENTRE_X + 20, 60)).toEqual(CLEAR);
            });
        });
    });
});
