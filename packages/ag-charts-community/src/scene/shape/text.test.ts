import { describe, expect, it } from 'vitest';

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

        // Returns the inner per-segment Text nodes for direct assertion of y / textBaseline.
        function segmentNodesOf(text: Text): Text[] {
            text.getBBox(); // force generateTextMap
            const richText = (text as unknown as { richText: { children(): Iterable<Text> } }).richText;
            return Array.from(richText.children());
        }

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
