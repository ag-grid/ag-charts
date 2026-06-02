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

    // AG-15933: a 'middle'-baseline label whose row carries a block-image strip (and/or an inline
    // image) must centre on text.y. The single-line glyph-baseline shortcut in calcSegmentedTopOffset
    // is only valid for pure-text lines; for image-bearing rows it produced an offset unrelated to
    // the row height, mis-centring the label by ~15-18px and overflowing short tiles.
    describe('block-image row vertical centring', () => {
        const mockScene = setUpMockScene(canvasCtx);

        const blockImage = {
            type: 'image' as const,
            url: 'icon.svg',
            width: 36,
            height: 36,
            block: true,
            padding: 6,
        };

        it.each([
            [
                'block image + middle text + trailing block image',
                [
                    blockImage,
                    { text: 'X', fontSize: 16, fontFamily: 'Verdana', verticalAlign: 'middle' as const },
                    blockImage,
                ],
            ],
            ['block image + text', [blockImage, { text: 'X', fontSize: 16, fontFamily: 'Verdana' }]],
        ])('centres a %s on text.y for middle baseline', (_label, segments) => {
            const text = new Text();
            Object.assign(text, { ...BASE_OPTIONS, text: segments, textBaseline: 'middle', x: 100, y: 400 });
            text.setScene(mockScene);
            const bbox = text.getBBox();
            const centre = bbox.y + bbox.height / 2;
            expect(Math.abs(centre - 400)).toBeLessThan(3);
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

        it('defaults image segment verticalAlign to baseline (image bottom on the text baseline)', () => {
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
            const [textNode, imageNode] = childNodesOf(text) as unknown as Array<{
                y: number;
                textBaseline?: CanvasTextBaseline;
                getBBox(): { y: number; height: number };
            }>;
            // The text sits on its alphabetic baseline; with no verticalAlign the image defaults to
            // baseline too, so its bottom edge rests on that same baseline (textNode.y).
            expect(textNode.textBaseline).toBe('alphabetic');
            const imageBox = imageNode.getBBox();
            expect(Math.abs(imageBox.y + imageBox.height - textNode.y)).toBeLessThan(1);
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

        // AG-15933: verticalAlign positions the image box relative to the adjacent text — the image
        // moves, the text does not. The image is taller than the text here so each option resolves
        // to a visibly different image position. Reference lines come from the same rendered text
        // node (its bbox is the font-metrics box; its y is the alphabetic baseline).
        describe('inline image verticalAlign positions the image relative to the text', () => {
            const layout = (verticalAlign: CanvasTextBaseline) => {
                const text = new Text();
                Object.assign(text, {
                    ...BASE_OPTIONS,
                    text: [
                        { text: 'Ay', fontSize: 16, fontFamily: 'Verdana' },
                        { type: 'image', url: 'i.png', width: 20, height: 40, verticalAlign },
                    ],
                    x: 0,
                    y: 0,
                });
                text.setScene(mockScene);
                const [textNode, imageNode] = childNodesOf(text) as unknown as Array<{
                    y: number;
                    getBBox(): { y: number; height: number };
                }>;
                const t = textNode.getBBox();
                const i = imageNode.getBBox();
                return {
                    baseline: textNode.y,
                    textTop: t.y,
                    textBottom: t.y + t.height,
                    textMid: t.y + t.height / 2,
                    imageTop: i.y,
                    imageBottom: i.y + i.height,
                    imageMid: i.y + i.height / 2,
                };
            };

            it("'top' aligns the image top with the text top", () => {
                const l = layout('top');
                expect(Math.abs(l.imageTop - l.textTop)).toBeLessThan(1);
            });

            it("'middle' aligns the image centre with the text midline", () => {
                const l = layout('middle');
                expect(Math.abs(l.imageMid - l.textMid)).toBeLessThan(1);
            });

            it("'bottom' aligns the image bottom with the text descender line", () => {
                const l = layout('bottom');
                expect(Math.abs(l.imageBottom - l.textBottom)).toBeLessThan(1);
            });

            it("'alphabetic' sits the image bottom on the text baseline", () => {
                const l = layout('alphabetic');
                expect(Math.abs(l.imageBottom - l.baseline)).toBeLessThan(1);
            });

            it("extends the image below the text for 'top' and above the text for 'bottom'", () => {
                const top = layout('top');
                const bottom = layout('bottom');
                expect(top.imageBottom).toBeGreaterThan(top.textBottom);
                expect(bottom.imageTop).toBeLessThan(bottom.textTop);
            });
        });

        it('sizes an image-only line to the image box (no text to align against)', () => {
            const text = new Text();
            Object.assign(text, {
                ...BASE_OPTIONS,
                text: [{ type: 'image', url: 'i.png', width: 20, height: 30 }],
                x: 0,
                y: 0,
            });
            text.setScene(mockScene);
            expect(text.getBBox().height).toBeCloseTo(30, 5);
        });

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
        let blockImage2: Image;
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
        // A second, visually distinct block logo so stacked/side-by-side block rows are
        // distinguishable in the snapshots.
        const LOGO2_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36">' +
                '<rect x="2" y="2" width="32" height="32" rx="6" fill="#d62728"/>' +
                '<text x="18" y="24" text-anchor="middle" font-family="Verdana" font-size="18" fill="white" font-weight="bold">B</text>' +
                '</svg>'
        )}`;

        beforeAll(async () => {
            inlineImage = await loadImage(ICON_SVG);
            blockImage = await loadImage(LOGO_SVG);
            blockImage2 = await loadImage(LOGO2_SVG);
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
                    { type: 'image', url: ICON_SVG, width: 24, height: 24, ...extra },
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
                renderInlineImageSegmentSnapshot({
                    padding: 4,
                    backgroundFill: '#333',
                    borderRadius: 8,
                    verticalAlign: 'middle',
                })
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

        // ---------------------------------------------------------------------------------------
        // Block-image position, mixing and decoration scenarios. Geometry tests use `mockScene`
        // and assert the layout invariants directly; visual tests render real (stubbed) images
        // and snapshot the output so block positioning can be reviewed by eye.
        // ---------------------------------------------------------------------------------------

        const imageNodesOf = (text: Text) => childNodesOf(text).filter((n) => n.imageWidth != null);
        const textNodesOf = (text: Text) => childNodesOf(text).filter((n) => n.imageWidth == null);

        function renderSegmentsSnapshot(text: unknown[], imagesByUri: Record<string, Image>, x = 200, y = 120) {
            const ctx = canvasCtx.getRenderContext2D();
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvasCtx.nodeCanvas.width ?? 800, canvasCtx.nodeCanvas.height ?? 600);

            const node = new Text();
            Object.assign(node, { ...BASE_OPTIONS, textBaseline: 'middle', text, x, y });
            node.setScene(makeImageLoaderScene(imagesByUri));

            ctx.save();
            node.render({
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

        const BLOCK_A = 'https://example.com/blockA.png';
        const BLOCK_B = 'https://example.com/blockB.png';
        const BLOCK_C = 'https://example.com/blockC.png';
        const INLINE = 'https://example.com/inline.png';

        describe('block position within the segments array', () => {
            it('stacks a leading and a trailing block image as two rows (block, 2 text segments, block)', () => {
                const text = new Text();
                Object.assign(text, {
                    ...BASE_OPTIONS,
                    text: [
                        { type: 'image', url: BLOCK_A, width: 40, height: 40, block: true },
                        { text: 'Alpha ', fontWeight: 'bold' as const },
                        { text: 'beta\n' },
                        // Preceded by a `\n`-terminated text segment, so this block starts a new row
                        // rather than joining the first strip — it must NOT be dropped.
                        { type: 'image', url: BLOCK_B, width: 40, height: 40, block: true },
                        { text: 'Gamma' },
                    ],
                    x: 200,
                    y: 100,
                });
                text.setScene(mockScene);

                const images = imageNodesOf(text);
                expect(images).toHaveLength(2);
                const [blockA, blockB] = images;
                // Both blocks anchor at the same left edge; block B sits in a new row below block A.
                expect(blockB.x).toBe(blockA.x);
                expect(blockB.y).toBeGreaterThan(blockA.y);
                // The trailing 'Gamma' column flows to the right of block B.
                const gamma = textNodesOf(text).at(-1)!;
                expect(gamma.x).toBeGreaterThan(blockB.x);
            });

            it('keeps a trailing block image inline when no newline separates it from the text (block, 2 text segments, block)', () => {
                const text = new Text();
                Object.assign(text, {
                    ...BASE_OPTIONS,
                    text: [
                        { type: 'image', url: BLOCK_A, width: 40, height: 40, block: true },
                        { text: 'Alpha ', fontWeight: 'bold' as const },
                        // No trailing `\n`, so the next block:true image is mid-line and renders
                        // inline within block A's column rather than starting a second row.
                        { text: 'beta' },
                        { type: 'image', url: BLOCK_B, width: 40, height: 40, block: true },
                        { text: 'Gamma' },
                    ],
                    x: 200,
                    y: 100,
                });
                text.setScene(mockScene);

                const images = imageNodesOf(text);
                expect(images).toHaveLength(2);
                const [blockA, blockB] = images;
                // Block A is the single leading strip (left-anchored). Block B is not stacked below
                // it — it flows inline inside the column, to block A's right, before 'Gamma'.
                expect(blockB.x).toBeGreaterThan(blockA.x);
                const gamma = textNodesOf(text).at(-1)!;
                expect(gamma.x).toBeGreaterThan(blockB.x);
            });

            it('ignores block:true when the image is mid-line (preceded by inline text, no newline)', () => {
                const text = new Text();
                Object.assign(text, {
                    ...BASE_OPTIONS,
                    text: [
                        { text: 'Before ' },
                        { type: 'image', url: BLOCK_A, width: 24, height: 24, block: true },
                        { text: ' after' },
                    ],
                    x: 200,
                    y: 100,
                });
                text.setScene(mockScene);

                const [image] = imageNodesOf(text);
                const [before, after] = textNodesOf(text);
                // A real block row would left-anchor the image (smallest x). Inline flow instead
                // places it after 'Before ' and before ' after' on the same line.
                expect(image.x).toBeGreaterThan(before.x);
                expect(after.x).toBeGreaterThan(image.x);
            });

            it('starts a new block row when block:true follows a newline-terminated text segment', () => {
                const text = new Text();
                Object.assign(text, {
                    ...BASE_OPTIONS,
                    text: [
                        { text: 'Header\n' },
                        { type: 'image', url: BLOCK_A, width: 40, height: 40, block: true },
                        { text: 'Body' },
                    ],
                    x: 200,
                    y: 100,
                });
                text.setScene(mockScene);

                const [image] = imageNodesOf(text);
                const [header, body] = textNodesOf(text);
                // Header is its own line above the block row; the block image sits below it and the
                // body column flows to its right.
                expect(image.y).toBeGreaterThan(header.y);
                expect(body.x).toBeGreaterThan(image.x);
            });

            it('renders the leading/trailing block stack visually', () => {
                expect(
                    renderSegmentsSnapshot(
                        [
                            { type: 'image', url: BLOCK_A, width: 40, height: 40, block: true, borderRadius: 8 },
                            { text: 'Alpha', fontWeight: 'bold' as const },
                            { text: '\nbeta\n' },
                            { type: 'image', url: BLOCK_B, width: 40, height: 40, block: true, borderRadius: 8 },
                            { text: 'Gamma' },
                        ],
                        { [BLOCK_A]: blockImage, [BLOCK_B]: blockImage2 }
                    )
                ).toMatchImageSnapshot();
            });

            it('renders a trailing block image inline (no newline between the two blocks) visually', () => {
                expect(
                    renderSegmentsSnapshot(
                        [
                            { type: 'image', url: BLOCK_A, width: 40, height: 40, block: true, borderRadius: 8 },
                            { text: 'Alpha ', fontWeight: 'bold' as const },
                            { text: 'beta' },
                            { type: 'image', url: BLOCK_B, width: 40, height: 40, block: true, borderRadius: 8 },
                            { text: 'Gamma' },
                        ],
                        { [BLOCK_A]: blockImage, [BLOCK_B]: blockImage2 }
                    )
                ).toMatchImageSnapshot();
            });
        });

        describe('multiple block images', () => {
            it('lays three block images side-by-side in one strip', () => {
                const text = new Text();
                Object.assign(text, {
                    ...BASE_OPTIONS,
                    text: [
                        { type: 'image', url: BLOCK_A, width: 30, height: 30, block: true },
                        { type: 'image', url: BLOCK_B, width: 30, height: 30, block: true },
                        { type: 'image', url: BLOCK_C, width: 30, height: 30, block: true },
                        { text: 'Row' },
                    ],
                    x: 200,
                    y: 100,
                });
                text.setScene(mockScene);

                const [a, b, c] = imageNodesOf(text);
                expect(b.y).toBe(a.y);
                expect(c.y).toBe(a.y);
                expect(b.x).toBeGreaterThan(a.x);
                expect(c.x).toBeGreaterThan(b.x);
                const row = textNodesOf(text).at(-1)!;
                expect(row.x).toBeGreaterThan(c.x);
            });

            it('renders three side-by-side block images visually', () => {
                expect(
                    renderSegmentsSnapshot(
                        [
                            { type: 'image', url: BLOCK_A, width: 32, height: 32, block: true },
                            { type: 'image', url: BLOCK_B, width: 32, height: 32, block: true },
                            { type: 'image', url: BLOCK_A, width: 32, height: 32, block: true },
                            { text: 'Three icons' },
                        ],
                        { [BLOCK_A]: blockImage, [BLOCK_B]: blockImage2 }
                    )
                ).toMatchImageSnapshot();
            });
        });

        describe('mixing block and inline images', () => {
            it('renders an inline image inside the text column of a block row', () => {
                const text = new Text();
                Object.assign(text, {
                    ...BASE_OPTIONS,
                    text: [
                        { type: 'image', url: BLOCK_A, width: 40, height: 40, block: true },
                        { text: 'Name ' },
                        { type: 'image', url: INLINE, width: 20, height: 20, verticalAlign: 'middle' },
                        { text: ' end' },
                    ],
                    x: 200,
                    y: 100,
                });
                text.setScene(mockScene);

                const [block, inline] = imageNodesOf(text);
                // The inline image lives in the column to the right of the block image.
                expect(inline.x).toBeGreaterThan(block.x);
            });

            it('starts a block row after a newline-terminated inline row', () => {
                const text = new Text();
                Object.assign(text, {
                    ...BASE_OPTIONS,
                    text: [
                        { type: 'image', url: INLINE, width: 20, height: 20, verticalAlign: 'middle' },
                        { text: 'top\n' },
                        { type: 'image', url: BLOCK_A, width: 40, height: 40, block: true },
                        { text: 'bottom' },
                    ],
                    x: 200,
                    y: 100,
                });
                text.setScene(mockScene);

                const [inline, block] = imageNodesOf(text);
                // The block row sits below the inline row.
                expect(block.y).toBeGreaterThan(inline.y);
            });

            it('renders a block + inline image mix visually', () => {
                expect(
                    renderSegmentsSnapshot(
                        [
                            { type: 'image', url: BLOCK_A, width: 40, height: 40, block: true, borderRadius: 8 },
                            { text: 'Name ' },
                            { type: 'image', url: INLINE, width: 20, height: 20, verticalAlign: 'middle' },
                            { text: ' tag\nsecond line' },
                        ],
                        { [BLOCK_A]: blockImage, [INLINE]: inlineImage }
                    )
                ).toMatchImageSnapshot();
            });
        });

        describe('block image verticalAlign', () => {
            it.each(['top', 'middle', 'bottom'] as const)(
                "renders a tall block image with verticalAlign='%s' beside a short text column",
                (verticalAlign) => {
                    expect(
                        renderSegmentsSnapshot(
                            [
                                { type: 'image', url: BLOCK_A, width: 36, height: 72, block: true, verticalAlign },
                                { text: 'Single line' },
                            ],
                            { [BLOCK_A]: blockImage }
                        )
                    ).toMatchImageSnapshot();
                }
            );
        });

        describe('multi-line text column', () => {
            it('spans the block row across the pre-split text lines', () => {
                const text = new Text();
                Object.assign(text, {
                    ...BASE_OPTIONS,
                    text: [
                        { type: 'image', url: BLOCK_A, width: 40, height: 40, block: true },
                        { text: 'Line one\nLine two\nLine three' },
                    ],
                    x: 200,
                    y: 100,
                });
                text.setScene(mockScene);

                // One block image plus a text node per non-empty column line.
                expect(imageNodesOf(text)).toHaveLength(1);
                const columnLines = textNodesOf(text);
                expect(columnLines.length).toBeGreaterThanOrEqual(3);
                // Column lines stack downward at the same x, to the right of the block image.
                expect(columnLines[1].y).toBeGreaterThan(columnLines[0].y);
                expect(columnLines[0].x).toBe(columnLines[1].x);
                expect(columnLines[0].x).toBeGreaterThan(imageNodesOf(text)[0].x);
            });

            it('renders a multi-line column beside a block image visually', () => {
                expect(
                    renderSegmentsSnapshot(
                        [
                            { type: 'image', url: BLOCK_A, width: 40, height: 40, block: true, borderRadius: 8 },
                            { text: 'Title', fontWeight: 'bold' as const },
                            { text: '\nSubtitle\nDetail line' },
                        ],
                        { [BLOCK_A]: blockImage }
                    )
                ).toMatchImageSnapshot();
            });
        });

        describe('block image decorations', () => {
            it.each([
                ['padding', { padding: 8, backgroundFill: '#e0e0e0' }],
                ['rounded background', { padding: 4, backgroundFill: '#333', borderRadius: 10 }],
                ['border', { border: { enabled: true, stroke: '#0a0', strokeWidth: 2 }, padding: 4 }],
            ] as const)('renders a block image with %s', (_name, extra) => {
                expect(
                    renderSegmentsSnapshot(
                        [
                            { type: 'image', url: BLOCK_A, width: 40, height: 40, block: true, ...extra },
                            { text: 'Decorated', fontWeight: 'bold' as const },
                        ],
                        { [BLOCK_A]: blockImage }
                    )
                ).toMatchImageSnapshot();
            });
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
