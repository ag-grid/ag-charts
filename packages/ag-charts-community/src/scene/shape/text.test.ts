import { type Image, loadImage } from 'skia-canvas';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { LtrEmbedding, PopDirectionalFormatting, cachedTextMeasurer, wrapText } from 'ag-charts-core';
import { testLogger } from 'ag-charts-test';
import type { TextWrap } from 'ag-charts-types';

import { extractImageData, setupMockCanvas } from '../../util/test/mockCanvas';
import { expectWarningMessages, setupMockConsole } from '../../util/test/mockConsole';
import type { IScene } from '../node';
import { RotatableText, Text } from './text';

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
                        logger: testLogger,
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
                        logger: testLogger,
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

    describe('image segments', () => {
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
                '<path d="M13 25L18 11L23 25M15.5 19.5L20.5 19.5" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
                '</svg>'
        )}`;
        // A second, visually distinct block logo so stacked/side-by-side block rows are
        // distinguishable in the snapshots.
        const LOGO2_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36">' +
                '<rect x="2" y="2" width="32" height="32" rx="6" fill="#d62728"/>' +
                '<path d="M14 11L14 25M14 11L19 11Q23 11 23 14.5Q23 18 19 18L14 18M14 18L20 18Q24 18 24 21.5Q24 25 20 25L14 25" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
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
                logger: testLogger,
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
                        cornerRadius: 8,
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
                logger: testLogger,
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
                logger: testLogger,
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
                    cornerRadius: 8,
                    verticalAlign: 'middle',
                })
            ).toMatchImageSnapshot();
        });

        it('renders an inline image segment with backgroundFill aligned to the icon box', () => {
            expect(renderInlineImageSegmentSnapshot({ backgroundFill: '#d0e7ff' })).toMatchImageSnapshot();
        });

        it('clips the image to a circle when cornerRadius is set with no padding', () => {
            // No padding means the image fills the box, so the corner-radius clip rounds the image
            // itself — a half-box radius yields a circle.
            expect(
                renderInlineImageSegmentSnapshot({ cornerRadius: 12, verticalAlign: 'middle' })
            ).toMatchImageSnapshot();
        });

        it('warns and still paints the background box when the image url is empty', () => {
            // The warning is emitted only after the background paint, so asserting it fired confirms
            // the empty-url path still renders the box (its pixels are covered by the snapshots above).
            renderInlineImageSegmentSnapshot({ url: '', backgroundFill: '#d0e7ff' });
            expectWarningMessages([
                'AG Charts - Image segment has an empty url; rendering background only (24x24 box).',
            ]);
        });

        // Block-image position, mixing and decoration scenarios are validated by rendering real
        // (stubbed) images and snapshotting the output, so block positioning can be reviewed by eye.

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
                logger: testLogger,
                debugNodes: {},
            });
            ctx.restore();
            return extractImageData(canvasCtx);
        }

        const BLOCK_A = 'https://example.com/blockA.png';
        const BLOCK_B = 'https://example.com/blockB.png';
        const INLINE = 'https://example.com/inline.png';

        describe('block position within the segments array', () => {
            it('renders a mid-line block:true image inline (text, block, text — block flag ignored) visually', () => {
                // A real block row would left-anchor the image; mid-line it must flow inline between
                // 'Before ' and ' after' on the same line instead.
                expect(
                    renderSegmentsSnapshot(
                        [
                            { text: 'Before ' },
                            { type: 'image', url: BLOCK_A, width: 24, height: 24, block: true, cornerRadius: 6 },
                            { text: ' after' },
                        ],
                        { [BLOCK_A]: blockImage }
                    )
                ).toMatchImageSnapshot();
            });

            it('starts a new block row after a newline-terminated text segment (header, block, body) visually', () => {
                // 'Header' is its own line above the block row; the block image sits below it with the
                // body column flowing to its right.
                expect(
                    renderSegmentsSnapshot(
                        [
                            { text: 'Header\n' },
                            { type: 'image', url: BLOCK_A, width: 40, height: 40, block: true, cornerRadius: 8 },
                            { text: 'Body' },
                        ],
                        { [BLOCK_A]: blockImage }
                    )
                ).toMatchImageSnapshot();
            });

            it('renders the leading/trailing block stack visually', () => {
                expect(
                    renderSegmentsSnapshot(
                        [
                            { type: 'image', url: BLOCK_A, width: 40, height: 40, block: true, cornerRadius: 8 },
                            { text: 'Alpha', fontWeight: 'bold' as const },
                            { text: '\nbeta\n' },
                            { type: 'image', url: BLOCK_B, width: 40, height: 40, block: true, cornerRadius: 8 },
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
                            { type: 'image', url: BLOCK_A, width: 40, height: 40, block: true, cornerRadius: 8 },
                            { text: 'Alpha ', fontWeight: 'bold' as const },
                            { text: 'beta' },
                            { type: 'image', url: BLOCK_B, width: 40, height: 40, block: true, cornerRadius: 8 },
                            { text: 'Gamma' },
                        ],
                        { [BLOCK_A]: blockImage, [BLOCK_B]: blockImage2 }
                    )
                ).toMatchImageSnapshot();
            });
        });

        describe('multiple block images', () => {
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
            it('starts a block row after a newline-terminated inline row visually', () => {
                // First row is an inline image + text; the `\n` ends it, so the block image opens a
                // new row below with its own text column to the right.
                expect(
                    renderSegmentsSnapshot(
                        [
                            { type: 'image', url: INLINE, width: 20, height: 20, verticalAlign: 'middle' },
                            { text: 'top\n' },
                            { type: 'image', url: BLOCK_A, width: 40, height: 40, block: true, cornerRadius: 8 },
                            { text: 'bottom' },
                        ],
                        { [BLOCK_A]: blockImage, [INLINE]: inlineImage }
                    )
                ).toMatchImageSnapshot();
            });

            it('renders a block + inline image mix visually', () => {
                expect(
                    renderSegmentsSnapshot(
                        [
                            { type: 'image', url: BLOCK_A, width: 40, height: 40, block: true, cornerRadius: 8 },
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
            it('renders a multi-line column beside a block image visually', () => {
                expect(
                    renderSegmentsSnapshot(
                        [
                            { type: 'image', url: BLOCK_A, width: 40, height: 40, block: true, cornerRadius: 8 },
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
                ['rounded background', { padding: 4, backgroundFill: '#333', cornerRadius: 10 }],
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

        describe('inline image segment styling (visual)', () => {
            it.each(['top', 'middle', 'bottom', 'baseline'] as const)(
                "positions a tall inline image with verticalAlign='%s' relative to the text",
                (verticalAlign) => {
                    expect(
                        renderInlineImageSegmentSnapshot({ width: 20, height: 44, verticalAlign })
                    ).toMatchImageSnapshot();
                }
            );

            it('renders an inline image with padding and a rounded background', () => {
                expect(
                    renderInlineImageSegmentSnapshot({
                        padding: 4,
                        backgroundFill: '#d0e7ff',
                        cornerRadius: 6,
                        verticalAlign: 'middle',
                    })
                ).toMatchImageSnapshot();
            });

            it('renders an image-only line sized to the image box', () => {
                expect(
                    renderSegmentsSnapshot([{ type: 'image', url: BLOCK_A, width: 40, height: 40, block: true }], {
                        [BLOCK_A]: blockImage,
                    })
                ).toMatchImageSnapshot();
            });
        });

        describe('per-segment text styling (visual)', () => {
            it.each(['top', 'middle', 'bottom'] as const)(
                "anchors a large text segment with verticalAlign='%s' beside normal text",
                (verticalAlign) => {
                    expect(
                        renderSegmentsSnapshot(
                            [
                                { text: 'Base ', fontSize: 14, fontFamily: 'Verdana' },
                                { text: 'BIG', fontSize: 30, fontFamily: 'Verdana', verticalAlign },
                                { text: ' tail', fontSize: 14, fontFamily: 'Verdana' },
                            ],
                            {}
                        )
                    ).toMatchImageSnapshot();
                }
            );

            it('renders an italic segment beside a normal segment', () => {
                expect(
                    renderSegmentsSnapshot(
                        [
                            { text: 'normal ', fontSize: 20, fontFamily: 'Verdana' },
                            { text: 'italic', fontSize: 20, fontFamily: 'Verdana', fontStyle: 'italic' },
                        ],
                        {}
                    )
                ).toMatchImageSnapshot();
            });

            it('widens the line gap when a segment declares a larger lineHeight', () => {
                expect(
                    renderSegmentsSnapshot(
                        [
                            { text: 'A', fontSize: 14, fontFamily: 'Verdana', lineHeight: 50 },
                            { text: '\nB', fontSize: 14, fontFamily: 'Verdana' },
                        ],
                        {}
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

    // `ctx.direction` is canvas-wide, so an RTL chart would otherwise reorder a label such as `-5`
    // to `5-`.
    describe('RTL text runs', () => {
        const rtlScene = { ...setUpMockScene(canvasCtx), isRtl: true };

        const renderInRtl = (text: string, textAlign: CanvasTextAlign = 'start') => {
            const node = Object.assign(new Text(), { ...BASE_OPTIONS, textAlign, text, x: 50, y: 50, fill: 'black' });
            node.setScene(rtlScene);

            const ctx = canvasCtx.getRenderContext2D();
            // What HdpiCanvas.setDirection does for an RTL chart — each text run opts out for itself.
            ctx.direction = 'rtl';
            const drawn: string[] = [];
            const fillText = vi.spyOn(ctx, 'fillText').mockImplementation((line) => {
                drawn.push(line);
            });
            try {
                node.render({
                    ctx,
                    direction: 'rtl' as const,
                    width: canvasCtx.nodeCanvas.width,
                    height: canvasCtx.nodeCanvas.height,
                    devicePixelRatio: 1,
                    logger: testLogger,
                    debugNodes: {},
                });
            } finally {
                fillText.mockRestore();
            }
            return { drawn, direction: ctx.direction, textAlign: ctx.textAlign };
        };

        it('draws a label carrying no direction of its own left-to-right and unmodified', () => {
            const { drawn, direction } = renderInRtl('-5');

            expect(direction).toBe('ltr');
            expect(drawn).toEqual(['-5']);
        });

        it('keeps RTL text right-to-left and marks its numbers as left-to-right', () => {
            const { drawn, direction } = renderInRtl(`\u05DE\u05DB\u05D9\u05E8\u05D5\u05EA -5`);

            expect(direction).toBe('rtl');
            expect(drawn).toEqual([
                `\u05DE\u05DB\u05D9\u05E8\u05D5\u05EA ${LtrEmbedding}-5${PopDirectionalFormatting}`,
            ]);
        });

        // The bounding box resolves start/end from the scene direction alone, so the context needs a
        // concrete side rather than one the overridden direction would reinterpret.
        it.each([
            ['start', 'right'],
            ['end', 'left'],
            ['center', 'center'],
        ] as const)('resolves textAlign %s to %s', (textAlign, expected) => {
            expect(renderInRtl('-5', textAlign).textAlign).toBe(expected);
        });
    });

    describe('getTextMeasureBBox', () => {
        const mockScene = setUpMockScene(canvasCtx);

        // The rotation pivot in updateLabelNode is derived from getTextMeasureBBox each render. If the
        // measure folds in the node's own rotation, a reused label node drifts frame over frame — the
        // resize-instability bug. getTextMeasureBBox must report the untransformed glyph box.
        it('is unaffected by the node rotation and rotation centre', () => {
            const node = Object.assign(new RotatableText(), {
                ...BASE_OPTIONS,
                text: 'Testing testing',
                x: 100,
                y: 60,
            });
            node.setScene(mockScene);

            const upright = node.getTextMeasureBBox();

            node.rotationCenterX = upright.x - 40;
            node.rotationCenterY = upright.y + 25;
            node.rotation = Math.PI / 2;

            const rotated = node.getTextMeasureBBox();

            expect(rotated.x).toBeCloseTo(upright.x);
            expect(rotated.y).toBeCloseTo(upright.y);
            expect(rotated.width).toBeCloseTo(upright.width);
            expect(rotated.height).toBeCloseTo(upright.height);
        });
    });
});
