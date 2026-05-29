import { type Image, loadImage } from 'skia-canvas';
import { beforeAll, describe, expect, it } from 'vitest';

import { cachedTextMeasurer, wrapText } from 'ag-charts-core';
import type { TextWrap } from 'ag-charts-types';

import { extractImageData, setupMockCanvas } from '../../util/test/mockCanvas';
import { setupMockConsole } from '../../util/test/mockConsole';
import type { IScene } from '../node';
import { Text } from './text';

function setUpMockScene(canvasCtx: any): IScene {
    return {
        imageLoader: null!,
        layersManager: {
            debug: {} as any,
            canvas: canvasCtx.nodeCanvas,
            markDirty: () => {},
            addLayer: () => undefined,
            moveLayer: () => {},
            removeLayer: () => {},
        } as any,
        isRtl: false,
    };
}

const BASE_OPTIONS = {
    textAlign: 'start' as CanvasTextAlign,
    fontSize: 15,
    lineHeight: 15,
    fontFamily: 'Verdana',
    textBaseline: 'top' as CanvasTextBaseline,
};

// Returns the inner per-segment Text nodes for direct assertion of y / textBaseline.
function segmentNodesOf(text: Text): Text[] {
    text.getBBox(); // force generateTextMap
    const richText = (text as unknown as { richText: { children(): Iterable<Text> } }).richText;
    return Array.from(richText.children());
}

describe('Text', () => {
    setupMockConsole();

    const canvasCtx = setupMockCanvas();

    describe('rendering', () => {
        const mockScene = setUpMockScene(canvasCtx);

        const GAP = 20;

        const TEST_CASES: (Partial<Text> | undefined)[][] = [
            [
                {
                    ...BASE_OPTIONS,
                    text: 'Testing testing',
                },
                {
                    ...BASE_OPTIONS,
                    text: 'Testing a longer string',
                },
                {
                    ...BASE_OPTIONS,
                    text: 'Testing a multi-line string \n with two lines',
                },
            ],
        ];

        const WRAPPING_TEST_CASES: {
            textOptions: (Partial<Text> | undefined)[];
            maxWidth: number;
            maxHeight: number;
            truncate: boolean;
            breakWord: boolean;
            hyphens: boolean;
            x?: number;
            y?: number;
        }[] = [
            {
                maxWidth: 100,
                maxHeight: 100,
                truncate: true,
                breakWord: true,
                hyphens: true,
                textOptions: [
                    {
                        ...BASE_OPTIONS,
                        text: 'Testing wrapping',
                    },
                    {
                        ...BASE_OPTIONS,
                        text: 'Testing wrapping longer string',
                    },
                    {
                        ...BASE_OPTIONS,
                        text: 'Testing wrapping multi-line string \n with two lines',
                    },
                ],
            },
            {
                maxWidth: 50,
                maxHeight: 50,
                truncate: true,
                breakWord: true,
                hyphens: true,
                textOptions: [
                    {
                        ...BASE_OPTIONS,
                        text: 'Testing wrapping',
                    },
                    {
                        ...BASE_OPTIONS,
                        text: 'Testing wrapping longer string',
                    },
                    {
                        ...BASE_OPTIONS,
                        text: 'Testing wrapping multi-line string \n with two lines',
                    },
                ],
            },
            {
                maxWidth: 25,
                maxHeight: 25,
                truncate: true,
                breakWord: true,
                hyphens: true,
                textOptions: [
                    {
                        ...BASE_OPTIONS,
                        text: 'Testing wrapping',
                    },
                    {
                        ...BASE_OPTIONS,
                        text: 'Testing wrapping longer string',
                    },
                    {
                        ...BASE_OPTIONS,
                        text: 'Testing wrapping multi-line string \n with two lines',
                    },
                ],
            },
            {
                maxWidth: 100,
                maxHeight: 50,
                truncate: true,
                breakWord: false,
                hyphens: false,
                textOptions: [
                    {
                        ...BASE_OPTIONS,
                        text: 'Testing Sicherheitskontrolle breaking on space',
                    },
                    {
                        ...BASE_OPTIONS,
                        text: 'Testing Sicherheitskontrolle breaking on space longer string',
                    },
                    {
                        ...BASE_OPTIONS,
                        text: 'Testing Sicherheitskontrolle breaking on space \n multi-line string with two lines',
                    },
                ],
            },
            {
                maxWidth: 100,
                maxHeight: 100,
                truncate: true,
                breakWord: true,
                hyphens: true,
                textOptions: [
                    {
                        ...BASE_OPTIONS,
                        text: 'Testing Sicherheitskontrolle with hyphens',
                    },
                    {
                        ...BASE_OPTIONS,
                        text: 'Testing Sicherheitskontrolle with hyphens longer string',
                    },
                    {
                        ...BASE_OPTIONS,
                        text: 'Testing Sicherheitskontrolle with hyphens \n multi-line string with two lines',
                    },
                ],
            },
            {
                maxWidth: 100,
                maxHeight: 100,
                truncate: true,
                breakWord: true,
                hyphens: false,
                textOptions: [
                    {
                        ...BASE_OPTIONS,
                        text: 'Testing Sicherheitskontrolle without hyphens',
                    },
                    {
                        ...BASE_OPTIONS,
                        text: 'Testing Sicherheitskontrolle without hyphens longer string',
                    },
                    {
                        ...BASE_OPTIONS,
                        text: 'Testing Sicherheitskontrolle without hyphens \n multi-line string with two lines',
                    },
                ],
            },
            {
                maxWidth: 50,
                maxHeight: 50,
                truncate: false,
                breakWord: true,
                hyphens: true,
                x: 400,
                y: 0,
                textOptions: [
                    {
                        ...BASE_OPTIONS,
                        text: 'Testing wrapping without truncation',
                    },
                    {
                        ...BASE_OPTIONS,
                        text: 'Testing wrapping longer string without truncation',
                    },
                    {
                        ...BASE_OPTIONS,
                        text: 'Testing wrapping multi-line string \n with two lines without truncation',
                    },
                ],
            },
        ];

        it('should render as expected', () => {
            const ctx = canvasCtx.getRenderContext2D();
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.fillRect(0, 0, canvasCtx.nodeCanvas.width ?? 800, canvasCtx.nodeCanvas.height ?? 600);

            let currY = 0;
            let rowHeight = 0;
            for (const testCaseRow of TEST_CASES) {
                let currX = GAP;
                currY = currY + rowHeight + GAP;
                rowHeight = 0;

                for (const testCase of testCaseRow) {
                    const textNode = Object.assign(new Text(), testCase);

                    textNode.x = currX;
                    textNode.y = currY;
                    textNode.setScene(mockScene);

                    ctx.save();
                    textNode.render({
                        ctx,
                        direction: 'ltr' as const,
                        width: canvasCtx.nodeCanvas.width,
                        height: canvasCtx.nodeCanvas.height,
                        devicePixelRatio: 1,
                        debugNodes: {},
                    });
                    ctx.restore();

                    const { x, y, width, height } = textNode.getBBox();

                    ctx.strokeRect(x, y, width, height);

                    currX += width + GAP;
                    rowHeight = Math.max(height, rowHeight);
                }
            }

            const imageData = extractImageData(canvasCtx);
            expect(imageData).toMatchImageSnapshot();
        });

        it('should wrap and render as expected', () => {
            const ctx = canvasCtx.getRenderContext2D();
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.fillRect(0, 0, canvasCtx.nodeCanvas.width ?? 800, canvasCtx.nodeCanvas.height ?? 600);

            let currY = 0;
            let rowHeight = 0;
            for (const WRAPPING_CASE in WRAPPING_TEST_CASES) {
                const testCaseRow = WRAPPING_TEST_CASES[WRAPPING_CASE];
                let currX = GAP + (testCaseRow.x ?? 0);
                currY = (testCaseRow.y ?? currY + rowHeight) + GAP;
                rowHeight = 0;

                const { maxWidth, maxHeight, truncate, breakWord, hyphens } = testCaseRow;

                for (const testCase of testCaseRow.textOptions) {
                    const textNode = Object.assign(new Text(), testCase);

                    textNode.x = currX;
                    textNode.y = currY;
                    let wrapping: TextWrap = 'on-space';
                    if (hyphens) {
                        wrapping = 'hyphenate';
                    } else if (breakWord) {
                        wrapping = 'always';
                    }
                    textNode.text = wrapText((textNode.text as string) ?? '', {
                        maxWidth,
                        maxHeight: truncate ? maxHeight : Infinity,
                        font: textNode,
                        textWrap: wrapping,
                    });
                    textNode.setScene(mockScene);

                    ctx.save();
                    textNode.render({
                        ctx,
                        direction: 'ltr' as const,
                        width: canvasCtx.nodeCanvas.width,
                        height: canvasCtx.nodeCanvas.height,
                        devicePixelRatio: 1,
                        debugNodes: {},
                    });
                    ctx.restore();

                    const { x, y } = textNode.getBBox();

                    ctx.strokeRect(x, y, maxWidth, maxHeight);

                    currX += maxWidth + GAP;
                    rowHeight = Math.max(maxHeight, rowHeight);
                }
            }

            const imageData = extractImageData(canvasCtx);
            expect(imageData).toMatchImageSnapshot();
        });
    });

    describe('should return an empty string if text overflows when it is not permitted', () => {
        const exampleString = 'Testing wrapping multi-line string \n with two lines';
        const font = BASE_OPTIONS;

        it('should handle all text wrapping options for a small box', () => {
            expect(
                wrapText(exampleString, {
                    maxWidth: 50,
                    maxHeight: 50,
                    font,
                    textWrap: 'on-space',
                    overflow: 'hide',
                })
            ).toBe('');
            expect(
                wrapText(exampleString, {
                    maxWidth: 50,
                    maxHeight: 50,
                    font,
                    textWrap: 'never',
                    overflow: 'hide',
                })
            ).toBe('');
            expect(
                wrapText(exampleString, {
                    maxWidth: 50,
                    maxHeight: 50,
                    font,
                    textWrap: 'hyphenate',
                    overflow: 'hide',
                })
            ).toBe('');
            expect(
                wrapText(exampleString, {
                    maxWidth: 50,
                    maxHeight: 50,
                    font,
                    textWrap: 'always',
                    overflow: 'hide',
                })
            ).toBe('');
        });

        it('should handle all text wrapping options for a tall box', () => {
            expect(
                wrapText(exampleString, {
                    maxWidth: 50,
                    maxHeight: 1000,
                    font,
                    textWrap: 'on-space',
                    overflow: 'hide',
                })
            ).toBe('');
            expect(
                wrapText(exampleString, {
                    maxWidth: 50,
                    maxHeight: 1000,
                    font,
                    textWrap: 'never',
                    overflow: 'hide',
                })
            ).toBe('');

            // The word is broken here, so does not overflow
            expect(
                wrapText(exampleString, {
                    maxWidth: 50,
                    maxHeight: 1000,
                    font,
                    textWrap: 'hyphenate',
                    overflow: 'hide',
                })
            ).not.toBe('');
            expect(
                wrapText(exampleString, {
                    maxWidth: 50,
                    maxHeight: 1000,
                    font,
                    textWrap: 'always',
                    overflow: 'hide',
                })
            ).not.toBe('');
        });
    });

    // CRT-1041: getBBox() for segmented (rich) text must account for the vertical offset
    // applied by calcSegmentedTopOffset. Before the fix, the accessibility proxy element for
    // multi-line footnote captions was mispositioned because getBBox().y was not adjusted.
    describe('CRT-1041 segmented text getBBox', () => {
        const mockScene = setUpMockScene(canvasCtx);

        const SEGMENTED_TEXT = [
            { text: 'Line 1', fontSize: 15, fontFamily: 'Verdana' },
            { text: '\nLine 2', fontSize: 15, fontFamily: 'Verdana' },
        ];

        it('should return getBBox().y equal to text.y for top baseline', () => {
            const text = new Text();
            Object.assign(text, { ...BASE_OPTIONS, text: SEGMENTED_TEXT, textBaseline: 'top', x: 100, y: 400 });
            text.setScene(mockScene);
            const bbox = text.getBBox();
            expect(bbox.y).toBeCloseTo(400, 0);
        });

        it('should return getBBox().y less than text.y for alphabetic baseline', () => {
            const text = new Text();
            Object.assign(text, { ...BASE_OPTIONS, text: SEGMENTED_TEXT, textBaseline: 'alphabetic', x: 100, y: 400 });
            text.setScene(mockScene);
            const bbox = text.getBBox();
            expect(bbox.y).toBeLessThan(400);
        });

        it('should return getBBox().y less than text.y for middle baseline', () => {
            const text = new Text();
            Object.assign(text, { ...BASE_OPTIONS, text: SEGMENTED_TEXT, textBaseline: 'middle', x: 100, y: 400 });
            text.setScene(mockScene);
            const bbox = text.getBBox();
            expect(bbox.y).toBeLessThan(400);
        });

        it('should return getBBox().y less than text.y for bottom baseline', () => {
            const text = new Text();
            Object.assign(text, { ...BASE_OPTIONS, text: SEGMENTED_TEXT, textBaseline: 'bottom', x: 100, y: 400 });
            text.setScene(mockScene);
            const bbox = text.getBBox();
            expect(bbox.y).toBeLessThan(400);
        });

        it('should not adjust getBBox().y for non-segmented multi-line text', () => {
            const text = new Text();
            Object.assign(text, {
                ...BASE_OPTIONS,
                text: 'Line 1\nLine 2',
                textBaseline: 'alphabetic',
                x: 100,
                y: 400,
            });
            text.setScene(mockScene);
            const bbox = text.getBBox();
            // Non-segmented text uses computeBBox which handles baselines differently
            expect(bbox).toBeDefined();
            expect(bbox.width).toBeGreaterThan(0);
            expect(bbox.height).toBeGreaterThan(0);
        });
    });

    describe('per-segment verticalAlign', () => {
        const mockScene = setUpMockScene(canvasCtx);

        it('defaults segments to alphabetic baseline (no behaviour change)', () => {
            const text = new Text();
            Object.assign(text, {
                ...BASE_OPTIONS,
                text: [
                    { text: 'A', fontSize: 14, fontFamily: 'Verdana' },
                    { text: 'B', fontSize: 14, fontFamily: 'Verdana' },
                ],
                x: 0,
                y: 0,
            });
            text.setScene(mockScene);
            const [first, second] = segmentNodesOf(text);
            expect(first.textBaseline).toBe('alphabetic');
            expect(second.textBaseline).toBe('alphabetic');
            expect(first.y).toBeCloseTo(second.y, 5);
        });

        it("anchors a 'middle' segment at the vertical centre of the line", () => {
            const text = new Text();
            Object.assign(text, {
                ...BASE_OPTIONS,
                text: [
                    { text: 'A', fontSize: 14, fontFamily: 'Verdana' },
                    { text: 'B', fontSize: 14, fontFamily: 'Verdana', verticalAlign: 'middle' },
                ],
                x: 0,
                y: 0,
            });
            text.setScene(mockScene);
            const [first, second] = segmentNodesOf(text);
            expect(first.textBaseline).toBe('alphabetic');
            expect(second.textBaseline).toBe('middle');
            // 'middle' anchors below 'alphabetic' (line middle is below the alphabetic baseline minus ascent)
            expect(second.y).toBeGreaterThan(first.y - 14);
            expect(second.y).toBeLessThan(first.y + 14);
        });

        it("anchors a 'top' segment at the line top", () => {
            const text = new Text();
            Object.assign(text, {
                ...BASE_OPTIONS,
                text: [
                    { text: 'A', fontSize: 14, fontFamily: 'Verdana' },
                    { text: 'B', fontSize: 14, fontFamily: 'Verdana', verticalAlign: 'top' },
                ],
                x: 0,
                y: 0,
            });
            text.setScene(mockScene);
            const [first, second] = segmentNodesOf(text);
            expect(second.textBaseline).toBe('top');
            // 'top' anchor sits above alphabetic anchor by roughly one ascent
            expect(second.y).toBeLessThan(first.y);
        });

        it("anchors a 'bottom' segment at the line bottom", () => {
            const text = new Text();
            Object.assign(text, {
                ...BASE_OPTIONS,
                text: [
                    { text: 'A', fontSize: 14, fontFamily: 'Verdana' },
                    { text: 'B', fontSize: 14, fontFamily: 'Verdana', verticalAlign: 'bottom' },
                ],
                x: 0,
                y: 0,
            });
            text.setScene(mockScene);
            const [first, second] = segmentNodesOf(text);
            expect(second.textBaseline).toBe('bottom');
            // 'bottom' anchor sits below alphabetic anchor by roughly one descent
            expect(second.y).toBeGreaterThan(first.y);
        });

        it('mixes large-emoji middle with default text baseline without regressing alphabetic segments', () => {
            const text = new Text();
            Object.assign(text, {
                ...BASE_OPTIONS,
                text: [
                    { text: 'US', fontSize: 14, fontFamily: 'Verdana' },
                    { text: ' 🇺🇸', fontSize: 22, fontFamily: 'Verdana', verticalAlign: 'middle' },
                ],
                x: 0,
                y: 0,
            });
            text.setScene(mockScene);
            const [textSeg, flagSeg] = segmentNodesOf(text);
            expect(textSeg.textBaseline).toBe('alphabetic');
            expect(flagSeg.textBaseline).toBe('middle');
        });
    });

    describe('per-segment fontStyle', () => {
        const mockScene = setUpMockScene(canvasCtx);

        it('threads italic fontStyle through to the per-segment text node without affecting siblings', () => {
            const text = new Text();
            Object.assign(text, {
                ...BASE_OPTIONS,
                text: [
                    { text: 'normal ', fontSize: 14, fontFamily: 'Verdana' },
                    { text: 'italic', fontSize: 14, fontFamily: 'Verdana', fontStyle: 'italic' },
                ],
                x: 0,
                y: 0,
            });
            text.setScene(mockScene);
            const [first, second] = segmentNodesOf(text);
            expect(first.fontStyle).toBeUndefined();
            expect(second.fontStyle).toBe('italic');
            // Both segments share the same line/baseline.
            expect(first.y).toBeCloseTo(second.y, 5);
        });
    });

    describe('per-segment lineHeight', () => {
        const mockScene = setUpMockScene(canvasCtx);

        it('expands the containing line so the next line is pushed further down', () => {
            const baseText = new Text();
            Object.assign(baseText, {
                ...BASE_OPTIONS,
                lineHeight: undefined,
                text: [{ text: 'A', fontSize: 14, fontFamily: 'Verdana' }, { text: '\nB' }],
                x: 0,
                y: 0,
            });
            baseText.setScene(mockScene);
            const [baseFirst, baseSecond] = segmentNodesOf(baseText);

            const tallText = new Text();
            Object.assign(tallText, {
                ...BASE_OPTIONS,
                lineHeight: undefined,
                text: [{ text: 'A', fontSize: 14, fontFamily: 'Verdana', lineHeight: 50 }, { text: '\nB' }],
                x: 0,
                y: 0,
            });
            tallText.setScene(mockScene);
            const [tallFirst, tallSecond] = segmentNodesOf(tallText);

            // The taller first line pushes the second line further down.
            expect(tallSecond.y).toBeGreaterThan(baseSecond.y);
            // The first segment itself is anchored to its own baseline, unchanged by the override.
            expect(tallFirst.y).toBeCloseTo(baseFirst.y, 5);
        });

        it('largest lineHeight on a line wins when multiple segments declare different overrides', () => {
            const text = new Text();
            Object.assign(text, {
                ...BASE_OPTIONS,
                lineHeight: undefined,
                text: [
                    { text: 'A', fontSize: 14, fontFamily: 'Verdana', lineHeight: 30 },
                    { text: 'B', fontSize: 14, fontFamily: 'Verdana', lineHeight: 60 },
                    { text: '\nC' },
                ],
                x: 0,
                y: 0,
            });
            text.setScene(mockScene);
            const nodes = segmentNodesOf(text);
            const second = nodes[2];
            // Second line offset should reflect the 60px max, not the 30px first declaration.
            expect(second.y).toBeGreaterThanOrEqual(50);
        });
    });

    describe('image segments', () => {
        const mockScene = setUpMockScene(canvasCtx);

        function childNodesOf(text: Text) {
            text.getBBox();
            const richText = (text as unknown as { richText: { children(): Iterable<unknown> } }).richText;
            return Array.from(richText.children()) as Array<{
                x: number;
                y: number;
                boxWidth?: number;
                boxHeight?: number;
                imageWidth?: number;
                imageHeight?: number;
                paddingTop?: number;
                paddingRight?: number;
                paddingBottom?: number;
                paddingLeft?: number;
                borderRadius?: number;
                url?: string;
                backgroundFill?: string;
                textBaseline?: CanvasTextBaseline;
            }>;
        }

        it('creates one ImageSegmentNode per image segment with declared dimensions', () => {
            const text = new Text();
            Object.assign(text, {
                ...BASE_OPTIONS,
                text: [
                    { text: 'US ', fontSize: 14, fontFamily: 'Verdana' },
                    { type: 'image', url: 'https://example.com/us.png', width: 24, height: 16 },
                ],
                x: 0,
                y: 0,
            });
            text.setScene(mockScene);
            const nodes = childNodesOf(text);
            expect(nodes).toHaveLength(2);
            const imageNode = nodes[1];
            expect(imageNode.url).toBe('https://example.com/us.png');
            expect(imageNode.imageWidth).toBe(24);
            expect(imageNode.imageHeight).toBe(16);
            // No padding declared → boxWidth/Height match imageWidth/Height
            expect(imageNode.boxWidth).toBe(24);
            expect(imageNode.boxHeight).toBe(16);
        });

        it('expands box dimensions by declared padding', () => {
            const text = new Text();
            Object.assign(text, {
                ...BASE_OPTIONS,
                text: [
                    { text: 'A', fontSize: 14, fontFamily: 'Verdana' },
                    {
                        type: 'image',
                        url: 'https://example.com/icon.png',
                        width: 20,
                        height: 10,
                        padding: { top: 2, right: 4, bottom: 2, left: 4 },
                    },
                ],
                x: 0,
                y: 0,
            });
            text.setScene(mockScene);
            const imageNode = childNodesOf(text)[1];
            expect(imageNode.boxWidth).toBe(28); // 20 + 4 + 4
            expect(imageNode.boxHeight).toBe(14); // 10 + 2 + 2
            expect(imageNode.paddingLeft).toBe(4);
            expect(imageNode.paddingRight).toBe(4);
            expect(imageNode.paddingTop).toBe(2);
            expect(imageNode.paddingBottom).toBe(2);
        });

        it('treats numeric padding as uniform on all sides', () => {
            const text = new Text();
            Object.assign(text, {
                ...BASE_OPTIONS,
                text: [{ type: 'image', url: 'https://example.com/x.png', width: 10, height: 10, padding: 3 }],
                x: 0,
                y: 0,
            });
            text.setScene(mockScene);
            const imageNode = childNodesOf(text)[0];
            expect(imageNode.paddingTop).toBe(3);
            expect(imageNode.paddingRight).toBe(3);
            expect(imageNode.paddingBottom).toBe(3);
            expect(imageNode.paddingLeft).toBe(3);
        });

        it("defaults image segment verticalAlign to 'middle' (anchor below the line's top)", () => {
            const text = new Text();
            Object.assign(text, {
                ...BASE_OPTIONS,
                text: [
                    { text: 'US', fontSize: 14, fontFamily: 'Verdana' },
                    { type: 'image', url: 'https://example.com/flag.png', width: 20, height: 14 },
                ],
                x: 0,
                y: 0,
            });
            text.setScene(mockScene);
            const [textNode, imageNode] = childNodesOf(text);
            // The text node sits at its alphabetic baseline (a positive y inside the line),
            // and the image's top should be above its anchor — both within the line bounds.
            expect(textNode.textBaseline).toBe('alphabetic');
            expect(imageNode.boxHeight).toBeDefined();
        });

        it('threads borderRadius and backgroundFill through to the rendered node', () => {
            const text = new Text();
            Object.assign(text, {
                ...BASE_OPTIONS,
                text: [
                    {
                        type: 'image',
                        url: 'https://example.com/x.png',
                        width: 30,
                        height: 30,
                        borderRadius: 6,
                        backgroundFill: '#abc',
                    },
                ],
                x: 0,
                y: 0,
            });
            text.setScene(mockScene);
            const imageNode = childNodesOf(text)[0];
            expect(imageNode.borderRadius).toBe(6);
            expect(imageNode.backgroundFill).toBe('#abc');
        });

        it('threads border options through to the rendered node', () => {
            const text = new Text();
            const border = { enabled: true, stroke: '#0a0', strokeWidth: 2 };
            Object.assign(text, {
                ...BASE_OPTIONS,
                text: [
                    {
                        type: 'image',
                        url: 'https://example.com/x.png',
                        width: 20,
                        height: 20,
                        border,
                    },
                ],
                x: 0,
                y: 0,
            });
            text.setScene(mockScene);
            const imageNode = childNodesOf(text)[0] as typeof childNodesOf extends (...args: any) => Array<infer T>
                ? T & { border?: typeof border }
                : never;
            expect(imageNode.border).toEqual(border);
        });

        it.each(['top', 'middle', 'alphabetic', 'bottom'] as const)(
            "places an inline image's top edge relative to its line per verticalAlign='%s'",
            (verticalAlign) => {
                const text = new Text();
                Object.assign(text, {
                    ...BASE_OPTIONS,
                    text: [
                        { text: 'A', fontSize: 14, fontFamily: 'Verdana' },
                        { type: 'image', url: 'https://example.com/x.png', width: 20, height: 20, verticalAlign },
                    ],
                    x: 0,
                    y: 0,
                });
                text.setScene(mockScene);
                const [, imageNode] = childNodesOf(text);
                // Image top is bounded by the line's vertical extent. We sanity-check the
                // monotonicity: 'top' produces the smallest y, 'bottom' the largest.
                if (verticalAlign === 'top') {
                    expect(imageNode.y).toBeLessThanOrEqual(0);
                } else if (verticalAlign === 'bottom') {
                    expect(imageNode.y).toBeGreaterThan(0);
                }
            }
        );

        it.each([
            ['middle', 'middle'],
            ['top', 'top'],
            ['bottom', 'bottom'],
        ] as const)(
            'anchors block-leading image (%s) and text column (%s) together when heights differ',
            (imageAlign, textAlign) => {
                const text = new Text();
                Object.assign(text, {
                    ...BASE_OPTIONS,
                    text: [
                        // Image is 60px tall; text column will be ~30px (one line) so heights differ.
                        {
                            type: 'image',
                            url: 'https://example.com/logo.png',
                            width: 30,
                            height: 60,
                            block: true,
                            verticalAlign: imageAlign,
                        },
                        { text: 'Hi', fontSize: 14, fontFamily: 'Verdana', verticalAlign: textAlign },
                    ],
                    x: 0,
                    y: 0,
                });
                text.setScene(mockScene);
                const [imageNode, textNode] = childNodesOf(text);

                // Image is taller than the text column so it dictates the row height — image
                // anchors at y=0 across all values. The text column anchors within the same row,
                // so for 'top' the text sits at the top (y=0) and for any other value it shifts down.
                expect(imageNode.y).toBe(0);
                if (imageAlign === 'top') {
                    expect(textNode.y).toBe(0);
                } else {
                    expect(textNode.y).toBeGreaterThan(0);
                }
            }
        );

        // Pre-loaded skia-canvas images for visual snapshot tests. The ImageLoader path used in
        // production resolves async via HTMLImageElement; in tests we stub it so drawImage gets a
        // ready-to-render image and the snapshot reflects the actual image content.
        let inlineImage: Image;
        let blockImage: Image;
        const ICON_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">' +
                '<rect width="24" height="24" rx="4" fill="#2b7cd3"/>' +
                '<path d="M7 12l3 3 7-7" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
                '</svg>'
        )}`;
        const LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36">' +
                '<circle cx="18" cy="18" r="16" fill="#1f77b4"/>' +
                '<text x="18" y="24" text-anchor="middle" font-family="Verdana" font-size="18" fill="white" font-weight="bold">A</text>' +
                '</svg>'
        )}`;

        beforeAll(async () => {
            inlineImage = await loadImage(ICON_SVG);
            blockImage = await loadImage(LOGO_SVG);
        });

        function makeImageLoaderScene(imagesByUri: Record<string, Image>): IScene {
            return {
                ...setUpMockScene(canvasCtx),
                imageLoader: {
                    loadImage: (uri: string) => imagesByUri[uri] as unknown as HTMLImageElement,
                    waitingToLoad: () => false,
                    destroy: () => {},
                    on: () => () => {},
                    off: () => {},
                    once: () => () => {},
                    emit: () => {},
                } as any,
            };
        }

        it('renders an inline image segment alongside text with the reserved box placed at the segment offset', () => {
            const ctx = canvasCtx.getRenderContext2D();
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvasCtx.nodeCanvas.width ?? 800, canvasCtx.nodeCanvas.height ?? 600);

            const text = new Text();
            Object.assign(text, {
                ...BASE_OPTIONS,
                text: [
                    { text: 'Hello ', fontWeight: 'bold' as const },
                    { type: 'image', url: ICON_SVG, width: 24, height: 24, verticalAlign: 'middle' },
                    { text: ' world' },
                ],
                x: 100,
                y: 60,
            });
            text.setScene(makeImageLoaderScene({ [ICON_SVG]: inlineImage }));

            ctx.save();
            text.render({
                ctx,
                direction: 'ltr',
                width: canvasCtx.nodeCanvas.width,
                height: canvasCtx.nodeCanvas.height,
                devicePixelRatio: 1,
                debugNodes: {},
            });
            ctx.restore();

            const imageData = extractImageData(canvasCtx);
            expect(imageData).toMatchImageSnapshot();
        });

        it('renders a block-leading image with a two-line text column laid out to its right', () => {
            const ctx = canvasCtx.getRenderContext2D();
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvasCtx.nodeCanvas.width ?? 800, canvasCtx.nodeCanvas.height ?? 600);

            const text = new Text();
            Object.assign(text, {
                ...BASE_OPTIONS,
                textBaseline: 'middle',
                text: [
                    {
                        type: 'image',
                        url: LOGO_SVG,
                        width: 36,
                        height: 36,
                        block: true,
                        borderRadius: 8,
                    },
                    { text: 'Apple', fontWeight: 'bold' as const },
                    { text: '\n$2900B' },
                ],
                x: 120,
                y: 80,
            });
            text.setScene(makeImageLoaderScene({ [LOGO_SVG]: blockImage }));

            ctx.save();
            text.render({
                ctx,
                direction: 'ltr',
                width: canvasCtx.nodeCanvas.width,
                height: canvasCtx.nodeCanvas.height,
                devicePixelRatio: 1,
                debugNodes: {},
            });
            ctx.restore();

            const imageData = extractImageData(canvasCtx);
            expect(imageData).toMatchImageSnapshot();
        });

        function renderInlineImageSegmentSnapshot(extra: Record<string, unknown>) {
            const ctx = canvasCtx.getRenderContext2D();
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvasCtx.nodeCanvas.width ?? 800, canvasCtx.nodeCanvas.height ?? 600);

            const text = new Text();
            Object.assign(text, {
                ...BASE_OPTIONS,
                text: [
                    { text: 'Before ' },
                    { type: 'image', url: ICON_SVG, width: 24, height: 24, verticalAlign: 'middle', ...extra },
                    { text: ' after' },
                ],
                x: 100,
                y: 60,
            });
            text.setScene(makeImageLoaderScene({ [ICON_SVG]: inlineImage }));

            ctx.save();
            text.render({
                ctx,
                direction: 'ltr',
                width: canvasCtx.nodeCanvas.width,
                height: canvasCtx.nodeCanvas.height,
                devicePixelRatio: 1,
                debugNodes: {},
            });
            ctx.restore();

            return extractImageData(canvasCtx);
        }

        it('renders an inline image segment with padding around the icon', () => {
            expect(renderInlineImageSegmentSnapshot({ padding: 8, backgroundFill: '#e0e0e0' })).toMatchImageSnapshot();
        });

        it('renders an inline image segment with a rounded background', () => {
            expect(
                renderInlineImageSegmentSnapshot({ padding: 4, backgroundFill: '#333', borderRadius: 8 })
            ).toMatchImageSnapshot();
        });

        it('renders an inline image segment with backgroundFill aligned to the icon box', () => {
            expect(renderInlineImageSegmentSnapshot({ backgroundFill: '#d0e7ff' })).toMatchImageSnapshot();
        });

        it('positions block-leading image at left and offsets text lines into a column to its right', () => {
            const text = new Text();
            Object.assign(text, {
                ...BASE_OPTIONS,
                text: [
                    { type: 'image', url: 'https://example.com/logo.png', width: 40, height: 40, block: true },
                    { text: 'Title', fontWeight: 'bold' as const },
                    { text: '\nSubtitle' },
                ],
                x: 200,
                y: 100,
            });
            text.setScene(mockScene);
            const nodes = childNodesOf(text);

            // Children: image + two text children (one per non-empty line in the title/subtitle).
            expect(nodes).toHaveLength(3);
            const imageNode = nodes[0];
            const titleNode = nodes[1];
            const subtitleNode = nodes[2];

            expect(imageNode.imageWidth).toBe(40);
            expect(imageNode.imageHeight).toBe(40);
            // Image is left-anchored within the label's content box; both text children sit to its right
            // (offset by image width + the block-image spacing constant).
            expect(titleNode.x).toBeGreaterThan(imageNode.x);
            expect(subtitleNode.x).toBe(titleNode.x);
            // Subtitle is on a new line below the title.
            expect(subtitleNode.y).toBeGreaterThan(titleNode.y);
        });

        it('stacks two block-leading images vertically, each anchoring its own text column', () => {
            const text = new Text();
            Object.assign(text, {
                ...BASE_OPTIONS,
                text: [
                    { type: 'image', url: 'https://example.com/logo1.png', width: 40, height: 40, block: true },
                    { text: 'Row 1\n' },
                    { type: 'image', url: 'https://example.com/logo2.png', width: 40, height: 40, block: true },
                    { text: 'Row 2' },
                ],
                x: 200,
                y: 100,
            });
            text.setScene(mockScene);
            const nodes = childNodesOf(text);

            // Children: imageNode1, row1Text, imageNode2, row2Text.
            expect(nodes).toHaveLength(4);
            const [imageNode1, row1Text, imageNode2, row2Text] = nodes;

            // Both images anchor at the same x (left edge of the label content box).
            expect(imageNode2.x).toBe(imageNode1.x);
            // Block 2 sits below block 1.
            expect(imageNode2.y).toBeGreaterThan(imageNode1.y);
            // Text columns sit to the right of their own block image at the same x.
            expect(row1Text.x).toBe(row2Text.x);
            expect(row1Text.x).toBeGreaterThan(imageNode1.x);
            // Row 2 text sits below row 1 text.
            expect(row2Text.y).toBeGreaterThan(row1Text.y);
        });

        it('lays adjacent block-leading images side-by-side on the same row when no \\n separates them', () => {
            const text = new Text();
            Object.assign(text, {
                ...BASE_OPTIONS,
                text: [
                    { type: 'image', url: 'https://example.com/logo1.png', width: 40, height: 40, block: true },
                    { type: 'image', url: 'https://example.com/logo2.png', width: 40, height: 40, block: true },
                    { text: 'Row text' },
                ],
                x: 200,
                y: 100,
            });
            text.setScene(mockScene);
            const nodes = childNodesOf(text);

            // Children: imageNode1, imageNode2, rowText. The second block:true image joins the
            // leading strip side-by-side; the text column flows to the right of the strip.
            expect(nodes).toHaveLength(3);
            const [imageNode1, imageNode2, rowText] = nodes;

            // Both images share the same y (same row).
            expect(imageNode2.y).toBe(imageNode1.y);
            // Image 2 sits to the right of image 1.
            expect(imageNode2.x).toBeGreaterThan(imageNode1.x);
            // Text column sits to the right of image 2.
            expect(rowText.x).toBeGreaterThan(imageNode2.x);
        });
    });

    describe('text measurements', () => {
        // it('should measure text currently', () => {
        //     expect(
        //         CachedTextMeasurerPool.measureText('Hello world!', {
        //             font: { fontSize: 24, fontFamily: 'serif' },
        //             textBaseline: 'bottom',
        //             textAlign: 'start',
        //         })
        //     ).toMatchSnapshot();
        //     expect(
        //         CachedTextMeasurerPool.measureText('Hello world!', {
        //             font: { fontSize: 48, fontFamily: 'serif', fontWeight: 'bold' },
        //             textBaseline: 'middle',
        //             textAlign: 'center',
        //         })
        //     ).toMatchSnapshot();
        // });

        it('should measure text size currently', () => {
            const textMeasurerA = cachedTextMeasurer({ fontSize: 24, fontFamily: 'Verdana' });
            const textMeasurerB = cachedTextMeasurer({ fontSize: 48, fontFamily: 'Verdana', fontWeight: 'bold' });
            expect(textMeasurerA.measureText('Hello world!')).toMatchSnapshot();
            expect(textMeasurerB.measureText('Hello world!')).toMatchSnapshot();
        });
    });
});
