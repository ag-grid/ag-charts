import { describe, expect, it, vi } from 'vitest';

import { _Scene } from 'ag-charts-community';
import { setupMockCanvas } from 'ag-charts-community-test';

import { RED_SHADOW, blackColumns, leftEdgeIsWhite, pixelAt, renderNode } from '../test/utils';

type ShadowMode = _Scene.Shape['shadowMode'];

const RED = [255, 0, 0, 255];
const WHITE = [255, 255, 255, 255];
const BLACK = [0, 0, 0, 255];

const WIDTH = 400;
const HEIGHT = 220;

/** A 100 x 100 square from (150, 60), drawn with `RED_SHADOW` so the shadow is exactly the (dilated) shape. */
const square = (mixin: Partial<_Scene.Path> & { spread?: number }, left = 150) => {
    const { spread, ...rest } = mixin;
    const node = new _Scene.Path();
    Object.assign(node, {
        fill: 'black',
        stroke: undefined,
        strokeWidth: 0,
        fillShadow: { ...RED_SHADOW, spread },
        ...rest,
    });
    node.path.rect(left, 60, 100, 100);
    return node;
};

describe.each([1, 2, 3])('shadow spread at a device pixel ratio of %i', (pixelRatio) => {
    const canvasCtx = setupMockCanvas({ width: WIDTH * pixelRatio, height: HEIGHT * pixelRatio });

    /** The colour of the device pixel at (`x`, `y`) in CSS pixels. */
    const at = (x: number, y: number) => pixelAt(canvasCtx, Math.round(x * pixelRatio), Math.round(y * pixelRatio));

    const render = (node: _Scene.Shape) => renderNode(canvasCtx, node, pixelRatio);

    describe('fill mode', () => {
        it('should grow only the shadow of a filled shape by the spread', () => {
            render(square({ spread: 12, shadowMode: 'fill' }));

            // The shape is still 150 to 250 wide and 60 to 160 high.
            expect(at(200, 110)).toEqual(BLACK);
            expect(at(149, 110)).toEqual(RED);
            // The shadow reaches 12px past each side.
            for (const [x, y] of [
                [144, 110],
                [256, 110],
                [200, 54],
                [200, 166],
            ]) {
                expect(at(x, y)).toEqual(RED);
            }
            for (const [x, y] of [
                [134, 110],
                [266, 110],
                [200, 44],
                [200, 176],
            ]) {
                expect(at(x, y)).toEqual(WHITE);
            }
            const columns = blackColumns(canvasCtx);
            expect(columns[0]).toBe(150 * pixelRatio);
            expect(columns.at(-1)).toBe(250 * pixelRatio - 1);
        });

        it('should not grow the shadow of a shape without a spread', () => {
            render(square({ shadowMode: 'fill' }));

            expect(at(144, 110)).toEqual(WHITE);
            expect(at(256, 110)).toEqual(WHITE);
        });

        it('should not grow the shadow for a spread of zero', () => {
            render(square({ spread: 0, shadowMode: 'fill' }));

            expect(at(144, 110)).toEqual(WHITE);
        });

        it('should offset the grown shadow by xOffset and yOffset', () => {
            render(square({ shadowMode: 'fill', fillShadow: { ...RED_SHADOW, spread: 10, xOffset: 30 } }));

            // The shape covers 150 to 250. Its shadow is 30px to the right and 10px bigger: 170 to 290 across.
            expect(at(145, 110)).toEqual(WHITE);
            expect(at(255, 110)).toEqual(RED);
            expect(at(285, 110)).toEqual(RED);
            expect(at(295, 110)).toEqual(WHITE);
            // Vertically it spans 50 to 170.
            expect(at(260, 55)).toEqual(RED);
            expect(at(260, 45)).toEqual(WHITE);
        });

        it('should grow the shadow of a stroked path by the spread from its fill, past the stroke', () => {
            render(square({ spread: 10, stroke: 'black', strokeWidth: 4, shadowMode: 'fill' }));

            // The fill is 150 to 250, so its shadow is 140 to 260: it grows by `spread - strokeWidth / 2` past the stroke.
            expect(at(139, 110)).toEqual(WHITE);
            expect(at(140, 110)).toEqual(RED);
            expect(at(259, 110)).toEqual(RED);
            expect(at(260, 110)).toEqual(WHITE);
        });

        it('should blit the dilated silhouette from the scratch canvas, only when there is a spread', () => {
            const blits = (spread: number | undefined) => {
                const ctx = canvasCtx.getRenderContext2D();
                const spy = vi.spyOn(ctx, 'drawImage');
                render(square({ spread, shadowMode: 'fill' }));
                const { calls } = spy.mock;
                spy.mockRestore();
                return calls.length;
            };

            expect(blits(undefined)).toBe(0);
            expect(blits(9)).toBe(1);
        });
    });

    describe('stroke mode', () => {
        const outline = (mixin: Partial<_Scene.Path> & { spread?: number }) =>
            square({ fill: undefined, stroke: 'black', strokeWidth: 4, shadowMode: 'stroke', ...mixin });

        it('should grow the stroke shadow by the spread on both sides of the stroke', () => {
            render(outline({ spread: 10 }));

            // The stroke covers 148 to 152 across the left side. Its shadow covers 138 to 162.
            expect(at(150, 110)).toEqual(BLACK);
            expect(at(143, 110)).toEqual(RED);
            expect(at(157, 110)).toEqual(RED);
            expect(at(130, 110)).toEqual(WHITE);
            expect(at(175, 110)).toEqual(WHITE);
            // Nothing in the middle of the square, where the fill would be.
            expect(at(200, 110)).toEqual(WHITE);
        });

        it('should hide the stroke shadow behind the stroke without a spread', () => {
            render(outline({}));

            expect(at(143, 110)).toEqual(WHITE);
            expect(at(157, 110)).toEqual(WHITE);
        });

        it('should spread the shadow past the ends of an open stroke with butt caps', () => {
            const node = outline({ spread: 10, lineCap: 'butt' });
            node.path.clear();
            node.path.moveTo(200, 60);
            node.path.lineTo(200, 160);
            render(node);

            for (const y of [51, 55, 59, 160, 164, 168]) {
                expect(at(200, y)).toEqual(RED);
            }
            for (const y of [44, 176]) {
                expect(at(200, y)).toEqual(WHITE);
            }
        });

        it('should not shadow the fill', () => {
            render(outline({ spread: 10, fill: 'gold' }));

            // The fill covers the inner half of the grown shadow.
            expect(at(143, 110)).toEqual(RED);
            expect(at(157, 110)).not.toEqual(RED);
        });
    });

    describe('silhouette mode', () => {
        it('should grow the shadow of the fill and stroke by the spread', () => {
            render(square({ spread: 10, stroke: 'black', strokeWidth: 4, shadowMode: 'silhouette' }));

            // The silhouette is 148 to 252 across, so its shadow is 138 to 262.
            expect(at(143, 110)).toEqual(RED);
            expect(at(257, 110)).toEqual(RED);
            expect(at(130, 110)).toEqual(WHITE);
            expect(at(270, 110)).toEqual(WHITE);
            expect(at(200, 110)).toEqual(BLACK);
            expect(at(200, 54)).toEqual(RED);
            expect(at(200, 44)).toEqual(WHITE);
        });

        it('should grow the shadow of a shape without a stroke by the spread', () => {
            render(square({ spread: 10, shadowMode: 'silhouette' }));

            expect(at(143, 110)).toEqual(RED);
            expect(at(130, 110)).toEqual(WHITE);
        });

        it('should grow the shadow of a stroke without a fill', () => {
            render(square({ spread: 10, fill: undefined, stroke: 'black', strokeWidth: 4, shadowMode: 'silhouette' }));

            expect(at(143, 110)).toEqual(RED);
            expect(at(157, 110)).toEqual(RED);
            expect(at(130, 110)).toEqual(WHITE);
        });

        it('should cast a solid shadow ring around a dashed stroke', () => {
            render(
                square({
                    spread: 10,
                    stroke: 'black',
                    strokeWidth: 4,
                    lineDash: [6, 10],
                    shadowMode: 'silhouette',
                })
            );

            // The ring does not take the stroke's dashes: every pixel along each side's shadow is covered.
            for (let y = 60; y < 160; y++) {
                expect(at(143, y)).toEqual(RED);
                expect(at(257, y)).toEqual(RED);
            }
            for (let x = 150; x < 250; x++) {
                expect(at(x, 54)).toEqual(RED);
                expect(at(x, 166)).toEqual(RED);
            }
        });

        it('should cast the shadow ring at the strength of the fill, not of a translucent stroke', () => {
            render(
                square({ spread: 10, stroke: 'black', strokeWidth: 4, strokeOpacity: 0.2, shadowMode: 'silhouette' })
            );

            // The fill is opaque, so the whole shadow is, including the 10px ring around the faint stroke.
            expect(at(143, 110)).toEqual(RED);
            expect(at(257, 110)).toEqual(RED);
            expect(at(200, 54)).toEqual(RED);
        });

        it('should spread the shadow past the ends of an open stroke with butt caps', () => {
            const line = (spread: number | undefined) => {
                const node = square({
                    spread,
                    fill: undefined,
                    stroke: 'black',
                    strokeWidth: 4,
                    lineCap: 'butt',
                    shadowMode: 'silhouette',
                });
                node.path.clear();
                node.path.moveTo(200, 60);
                node.path.lineTo(200, 160);
                return node;
            };

            render(line(undefined));
            expect(at(200, 55)).toEqual(WHITE);
            expect(at(200, 165)).toEqual(WHITE);

            render(line(10));
            // The line ends at 60 and 160, and the shadow reaches at least `spread` past each end and no further than
            // the stroke's own half-width beyond that.
            for (const y of [51, 55, 59, 160, 164, 168]) {
                expect(at(200, y)).toEqual(RED);
            }
            for (const y of [44, 176]) {
                expect(at(200, y)).toEqual(WHITE);
            }
        });

        it('should not grow the shape itself', () => {
            render(square({ spread: 10, stroke: 'black', strokeWidth: 4, shadowMode: 'silhouette' }));

            const columns = blackColumns(canvasCtx);
            expect(columns[0]).toBe(148 * pixelRatio);
            expect(columns.at(-1)).toBe(252 * pixelRatio - 1);
        });
    });

    describe('translucent shadows', () => {
        const TRANSLUCENT_RED = { enabled: true, color: 'rgba(255, 0, 0, 0.5)', xOffset: 4, yOffset: 0, blur: 0 };

        /** The colours of the shadow pixels to the left and right of the shape, at one row, in CSS pixels. */
        const shadowRow = (from: number, to: number) => {
            const colours: number[][] = [];
            for (let x = from; x < to; x++) colours.push(at(x, 110));
            return colours;
        };

        it.each<ShadowMode>(['fill', 'silhouette'])('should cast one uniform shadow in %s mode', (shadowMode) => {
            render(square({ shadowMode, fillShadow: { ...TRANSLUCENT_RED, spread: 8 } }));

            // The square covers 150 to 250 and its shadow is 4px to the right and 8px bigger: 146 to 262.
            const [r, g, b, a] = at(256, 110);
            expect([r, a]).toEqual([255, 255]);
            // A half-strength red over white, rather than the darker two-layer one.
            expect(g).toBeGreaterThanOrEqual(126);
            expect(g).toBeLessThanOrEqual(129);
            expect(b).toBe(g);

            const covered = [...shadowRow(250, 262), ...shadowRow(146, 150)];
            expect(covered).toHaveLength(16);
            for (const colour of covered) {
                expect(colour).toEqual([r, g, b, a]);
            }
            expect(at(145, 110)).toEqual(WHITE);
            expect(at(262, 110)).toEqual(WHITE);
        });

        it.each<[string, Partial<_Scene.Path>]>([
            ['a translucent fill colour', { fill: 'rgba(0, 0, 0, 0.4)' }],
            ['a translucent fill opacity', { fillOpacity: 0.4 }],
        ])('should cast the spread shadow at the strength of %s, as without a spread', (_name, fillMixin) => {
            const shadow = { ...RED_SHADOW, xOffset: 40 };

            // The shadow without a spread, beside the shape: 250 to 290.
            render(square({ shadowMode: 'fill', fillShadow: shadow, ...fillMixin }));
            const unspread = at(270, 110);
            expect(unspread).not.toEqual(WHITE);
            expect(unspread).not.toEqual(RED);

            render(square({ shadowMode: 'fill', fillShadow: { ...shadow, spread: 6 }, ...fillMixin }));
            // The shadow is 190 to 290 without a spread and 184 to 296 with one: the same strength where the two
            // overlap, and across the 6px that only the spread reaches.
            expect(at(270, 110)).toEqual(unspread);
            expect(at(293, 110)).toEqual(unspread);
            expect(at(297, 110)).toEqual(WHITE);
        });
    });

    describe('rects', () => {
        const rect = (spread?: number, mixin: Partial<_Scene.Rect> = {}) => {
            const node = new _Scene.Rect();
            Object.assign(node, {
                x: 150,
                y: 60,
                width: 100,
                height: 100,
                fill: 'black',
                strokeWidth: 0,
                fillShadow: { ...RED_SHADOW, spread },
                ...mixin,
            });
            return node;
        };

        it('should grow the shadow of a rect by the spread', () => {
            render(rect(12));

            expect(at(200, 110)).toEqual(BLACK);
            expect(at(144, 110)).toEqual(RED);
            expect(at(256, 110)).toEqual(RED);
            expect(at(200, 54)).toEqual(RED);
            expect(at(200, 166)).toEqual(RED);
            expect(at(134, 110)).toEqual(WHITE);
            expect(at(200, 176)).toEqual(WHITE);
            // Only the shadow grows.
            const columns = blackColumns(canvasCtx);
            expect(columns[0]).toBe(150 * pixelRatio);
            expect(columns.at(-1)).toBe(250 * pixelRatio - 1);
        });

        it('should not grow the shadow of a rect without a spread', () => {
            render(rect());

            expect(at(144, 110)).toEqual(WHITE);
        });

        it('should grow the shadow of a stroked rect from its inset fill', () => {
            render(rect(10, { stroke: 'black', strokeWidth: 4 }));

            // A rect insets its fill by half the stroke, to 152 to 248, so the fill-mode shadow reaches 142 to 258.
            expect(at(141, 110)).toEqual(WHITE);
            expect(at(142, 110)).toEqual(RED);
            expect(at(257, 110)).toEqual(RED);
            expect(at(258, 110)).toEqual(WHITE);
            expect(at(200, 51)).toEqual(WHITE);
            expect(at(200, 52)).toEqual(RED);
        });

        it('should keep the grown shadow off the left edge for a rect at the right edge', () => {
            render(rect(30, { x: 300, width: 100 }));

            expect(at(395, 110)).toEqual(BLACK);
            expect(leftEdgeIsWhite(canvasCtx, 200 * pixelRatio)).toBe(true);
        });
    });

    describe('markers', () => {
        const marker = (shape: string, spread?: number) => {
            const node = new _Scene.Marker();
            Object.assign(node, {
                shape,
                size: 40,
                x: 200,
                y: 110,
                fill: 'black',
                strokeWidth: 0,
                fillShadow: { ...RED_SHADOW, spread },
            });
            return node;
        };

        it.each(['square', 'circle', 'diamond'])('should grow the shadow of a %s marker', (shape) => {
            render(marker(shape, 8));

            // Every shape here reaches 20px to the left of its centre, and the dilation 8px more.
            expect(at(200, 110)).toEqual(BLACK);
            expect(at(200 - 20 - 4, 110)).toEqual(RED);
            expect(at(200 - 20 - 14, 110)).toEqual(WHITE);
        });

        it('should not grow the shadow of a marker without a spread', () => {
            render(marker('square'));

            expect(at(200 - 20 - 4, 110)).toEqual(WHITE);
        });
    });

    describe.each<ShadowMode>(['fill', 'stroke', 'silhouette'])('%s mode reach', (shadowMode) => {
        const styled = (mixin: Partial<_Scene.Path> & { spread?: number }, left?: number) =>
            square({ stroke: 'black', strokeWidth: 4, shadowMode, ...mixin }, left);

        it('should not leave the off-canvas copy of a shape that reaches the right edge on the left edge', () => {
            // The grown shape reaches past the right edge of the canvas, so the copy has to be shifted further left.
            render(styled({ spread: 30 }, 280));

            expect(leftEdgeIsWhite(canvasCtx, 150 * pixelRatio)).toBe(true);
            expect(at(395, 110)).toEqual(RED);
        });

        it('should not leave the off-canvas copy of a sharp-cornered shape on the left edge', () => {
            // A narrow arrow, whose tip is sharp enough for a miter join to reach almost twice the spread past it.
            const arrow = styled({ spread: 24, lineJoin: 'miter' });
            const { path } = arrow;
            path.clear();
            path.moveTo(240, 50);
            path.lineTo(340, 110);
            path.lineTo(240, 170);
            path.closePath();
            render(arrow);

            expect(leftEdgeIsWhite(canvasCtx, 150 * pixelRatio)).toBe(true);
        });

        it('should still draw the shadow of a shape just off the right edge that the spread reaches back from', () => {
            render(styled({ spread: 20 }, 410));

            // The square spans 410 to 510, and its shadow reaches 20px back, to 390.
            expect(at(395, 110)).toEqual(RED);
            expect(at(385, 110)).toEqual(WHITE);
            expect(leftEdgeIsWhite(canvasCtx, 150 * pixelRatio)).toBe(true);
        });

        it('should still draw the shadow of a shape just off the left edge that the spread reaches on from', () => {
            render(styled({ spread: 30 }, -110));

            // The square spans -110 to -10, and its shadow reaches 30px on, to 20.
            expect(at(10, 110)).toEqual(RED);
            expect(at(30, 110)).toEqual(WHITE);
        });

        it('should skip a shape that even its spread does not bring on to the canvas', () => {
            render(styled({ spread: 20 }, 440));

            expect(leftEdgeIsWhite(canvasCtx, WIDTH * pixelRatio)).toBe(true);
        });
    });

    describe.each<ShadowMode>(['fill', 'silhouette'])('%s mode with a shape larger than the canvas', (shadowMode) => {
        const SHADOW = { ...RED_SHADOW, xOffset: 30, yOffset: 30, blur: 8 };

        /** An L of two 40px bars: one from -200 to 600 across and one from -100 to 400 down, so both overshoot the canvas. */
        const bars = (spread?: number) => {
            const node = new _Scene.Path();
            Object.assign(node, { fill: 'black', stroke: undefined, strokeWidth: 0, shadowMode });
            node.fillShadow = { ...SHADOW, spread };
            node.path.rect(-200, 60, 800, 40);
            node.path.rect(60, -100, 40, 500);
            return node;
        };

        /** The row of shadow below the horizontal bar and the column of shadow beside the vertical bar. */
        const rowPixels = () => [200, 300, 380, 390, 395, WIDTH - 1].map((x) => at(x, 115));
        const columnPixels = () => [120, 150, 190, 205, 214, HEIGHT - 1].map((y) => at(115, y));

        it('should cast a shadow that is as uniform out to the right and bottom edges as without a spread', () => {
            render(bars());
            const unspreadRow = rowPixels();
            const unspreadColumn = columnPixels();
            // The shadow is there at all, and the reference is a flat colour.
            expect(unspreadRow[0]).toEqual(RED);
            expect(unspreadColumn[0]).toEqual(RED);
            expect(new Set(unspreadRow.map(String)).size).toBe(1);
            expect(new Set(unspreadColumn.map(String)).size).toBe(1);

            render(bars(4));
            expect(rowPixels()).toEqual(unspreadRow);
            expect(columnPixels()).toEqual(unspreadColumn);
        });
    });
});

describe('shadow spread without a spread', () => {
    const canvasCtx = setupMockCanvas({ width: WIDTH, height: HEIGHT });

    const render = (node: _Scene.Shape) => {
        renderNode(canvasCtx, node);
        const { width, height } = canvasCtx.nodeCanvas;
        return Array.from(canvasCtx.getRenderContext2D().getImageData(0, 0, width, height).data);
    };

    it.each<ShadowMode>(['fill', 'stroke', 'silhouette'])('should leave %s mode as it was', (shadowMode) => {
        const shadow = { enabled: true, color: 'rgba(0, 0, 0, 0.7)', xOffset: 6, yOffset: 6, blur: 4 };
        const draw = (spread: number | undefined) =>
            render(
                square({
                    stroke: 'navy',
                    strokeWidth: 4,
                    shadowMode,
                    fillShadow: { ...shadow, spread },
                })
            );

        const unset = draw(undefined);
        expect(draw(0)).toEqual(unset);
        expect(draw(8)).not.toEqual(unset);
    });
});
