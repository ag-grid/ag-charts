import {
    BLOCK_IMAGE_SPACING,
    type BoxBounds,
    Debug,
    type FontOptions,
    LineSplitter,
    type RequireOptional,
    SceneRefChangeDetection,
    type TextMetricsBox,
    cachedTextMeasurer,
    createSvgElement,
    isArray,
    measureTextSegments,
    toFontString,
    toPlainText,
    toTextString,
} from 'ag-charts-core';
import type { FontStyle, FontWeight, Opacity, Padding, PixelSize, Segment, TextOrSegments } from 'ag-charts-types';

import { BBox } from '../bbox';
import { Group } from '../group';
import type { IScene, Node, NodeOptions, RenderContext } from '../node';
import { SceneChangeDetection } from '../node';
import { DebugSelectors } from '../sceneDebug';
import { Rotatable, type RotatableType, Translatable, type TranslatableType } from '../transformable';
import { ImageSegmentNode } from './imageSegmentNode';
import { Rect } from './rect';
import { Shape, type ShapeColor } from './shape';
import { setSvgFontAttributes } from './svgUtils';

export interface TextSizeProperties extends FontOptions {
    lineHeight?: number;
    textAlign?: CanvasTextAlign;
    textBaseline?: CanvasTextBaseline;
}

export interface TextBoxingProperties {
    cornerRadius?: PixelSize;
    padding?: Padding;
    fill?: ShapeColor;
    fillOpacity?: Opacity;
    border?: {
        enabled?: boolean;
        stroke?: ShapeColor;
        strokeWidth?: PixelSize;
        strokeOpacity?: Opacity;
    };
}

export class Text<D = unknown> extends Shape<D> {
    static override readonly className = 'Text';

    private static readonly debug = Debug.create(true, DebugSelectors.SCENE_TEXT);

    private static readonly defaultFontSize = 10;

    private richText?: Group;
    private textMap?: Map<Node, BoxBounds>;
    // Cached `measureTextSegments` output for the current `text` array. Invalidated by:
    //   - `onTextChange` (text reassignment)
    //   - `markDirty` (any layout-affecting field — all of which use `@SceneChangeDetection`,
    //     which calls `markDirty` via its onChange hook).
    // Any future field that affects segment layout must either be `@SceneChangeDetection`-tracked
    // or invalidate this cache explicitly, otherwise it will silently serve stale metrics.
    private segmentMetrics?: ReturnType<typeof measureTextSegments>;
    private generatingTextMap = false;

    @SceneChangeDetection()
    x: number = 0;

    @SceneChangeDetection()
    y: number = 0;

    private lines: string[] = [];
    private onTextChange() {
        this.richText?.clear();
        this.textMap?.clear();
        this.segmentMetrics = undefined;

        if (isArray(this.text)) {
            this.lines = [];
            this.richText ??= new Group();
            // Set parent so markDirty from segment children (e.g. ImageSegmentNode on async
            // image load) propagates up through Text to any cached parent group; otherwise
            // a titleGroup with renderToOffscreenCanvas would keep showing its stale bitmap.
            this.richText.parentNode = this;
            this.richText.setScene(this.scene);
            const children: Node[] = [];
            for (const segment of this.text) {
                if (segment.type === 'image') {
                    children.push(new ImageSegmentNode());
                } else {
                    for (const line of toTextString(segment.text).split(LineSplitter)) {
                        if (line) children.push(new Text({ trimText: false }));
                    }
                }
            }
            this.richText.append(children);
        } else {
            // Reverting to plain text: drop the empty richText Group entirely so any external
            // holder cannot keep it alive and inadvertently mark this Text dirty later. Children
            // were already detached by `clear()` above.
            if (this.richText) {
                this.richText.parentNode = undefined;
                this.richText.setScene(undefined);
                this.richText = undefined;
            }
            const lines = toTextString(this.text).split(LineSplitter);
            this.lines = this.trimText ? lines.map((line) => line.trim()) : lines;
        }
    }

    @SceneRefChangeDetection({
        changeCb: (o: Text) => o.onTextChange(),
    })
    text?: TextOrSegments = undefined;

    fontCache?: string = undefined;

    get font() {
        this.fontCache ??= toFontString(this);
        return this.fontCache;
    }

    override resolveFont(): string | undefined {
        if (!this.hasRenderableText()) return undefined;
        return this.font;
    }

    @SceneChangeDetection({
        changeCb: (o: Text) => {
            o.fontCache = undefined;
        },
    })
    fontStyle?: FontStyle;

    @SceneChangeDetection({
        changeCb: (o: Text) => {
            o.fontCache = undefined;
        },
    })
    fontWeight?: FontWeight;

    @SceneChangeDetection({
        changeCb: (o: Text) => {
            o.fontCache = undefined;
        },
    })
    fontSize: number = Text.defaultFontSize;

    @SceneChangeDetection({
        changeCb: (o: Text) => {
            o.fontCache = undefined;
        },
    })
    fontFamily?: string = 'sans-serif';

    @SceneChangeDetection()
    textAlign: CanvasTextAlign = 'start';

    @SceneChangeDetection()
    textBaseline: CanvasTextBaseline = 'alphabetic'; // we don't support 'hanging' or 'ideographic' baselines

    // TextMetrics are used if lineHeight is not defined.
    @SceneChangeDetection()
    lineHeight?: number;

    private boxing?: Rect;
    private boxPadding: Padding = 0;
    private readonly trimText: boolean;

    constructor(options?: NodeOptions & { trimText?: boolean }) {
        super(options);
        this.trimText = options?.trimText ?? true;
    }

    static measureBBox(
        text: TextOrSegments,
        x: number,
        y: number,
        options: {
            font: FontOptions;
            lineHeight?: number;
            textAlign?: CanvasTextAlign;
            textBaseline?: CanvasTextBaseline;
        }
    ) {
        if (isArray(text)) {
            const { font, lineHeight, textAlign, textBaseline } = options;
            const { width, height, lineMetrics } = measureTextSegments(text, font);
            const totalHeight = lineHeight ? lineHeight * lineMetrics.length : height;
            const offsetTop = Text.calcTopOffset(totalHeight, lineMetrics[0], textBaseline);
            const offsetLeft = Text.calcLeftOffset(width, textAlign);

            return new BBox(x - offsetLeft, y - offsetTop, width, totalHeight);
        } else {
            return Text.computeBBox(toTextString(text).split(LineSplitter), x, y, options);
        }
    }

    private static computeBBox(
        lines: string[],
        x: number,
        y: number,
        opts: {
            font: string | FontOptions;
            lineHeight?: number;
            textAlign?: CanvasTextAlign;
            textBaseline?: CanvasTextBaseline;
            isRtl?: boolean;
        }
    ): BBox {
        const { font, lineHeight, textAlign, textBaseline, isRtl } = opts;
        const { width, height, lineMetrics } = cachedTextMeasurer(font).measureLines(lines);
        const totalHeight = lineHeight ? lineHeight * lineMetrics.length : height;
        const offsetTop = Text.calcTopOffset(totalHeight, lineMetrics[0], textBaseline);
        const offsetLeft = Text.calcLeftOffset(width, textAlign, isRtl);

        return new BBox(x - offsetLeft, y - offsetTop, width, totalHeight);
    }

    private static calcTopOffset(
        height: number,
        textMetrics?: TextMetricsBox,
        textBaseline?: CanvasTextBaseline
    ): number {
        switch (textBaseline) {
            case 'alphabetic':
                return textMetrics?.ascent ?? 0;
            case 'middle':
                return height / 2;
            case 'bottom':
                return height;
            default:
                return 0;
        }
    }

    private static calcSegmentedTopOffset(
        height: number,
        lineMetrics: ReturnType<typeof measureTextSegments>['lineMetrics'],
        textBaseline: CanvasTextBaseline
    ): number {
        switch (textBaseline) {
            case 'alphabetic':
                return lineMetrics[0]?.ascent ?? 0;

            case 'middle':
                // The single-line shortcut uses text-baseline metrics to anchor the row tightly to
                // the glyph middle. For a strip-only line (block images, no text), there are no
                // text metrics to consult — fall through to height/2 so the strip box centres on y.
                if (lineMetrics.length === 1 && lineMetrics[0].segments.length > 0) {
                    return (
                        lineMetrics[0].ascent +
                        lineMetrics[0].segments.reduce(
                            (offsetY, segment) =>
                                segment.type === 'image'
                                    ? offsetY
                                    : Math.min(offsetY, cachedTextMeasurer(segment).baselineDistance('middle')),
                            0
                        )
                    );
                }
                return height / 2;

            case 'bottom':
                return height;

            default:
                return 0;
        }
    }

    private static calcLeftOffset(width: number, textAlign?: CanvasTextAlign, isRtl?: boolean): number {
        let offset = 0;
        switch (textAlign) {
            case 'center':
                offset = 0.5;
                break;
            case 'right':
            case isRtl ? 'start' : 'end':
                offset = 1;
        }
        return width * offset;
    }

    override getBBox(): BBox {
        const bbox = super.getBBox();
        if (!this.textMap?.size || !isArray(this.text)) return bbox;

        const { height, lineMetrics } = this.getSegmentMetrics(this.text);
        const offsetTop = Text.calcSegmentedTopOffset(height, lineMetrics, this.textBaseline);
        const y = this.y - offsetTop;
        if (bbox.y === y) return bbox;

        return new BBox(bbox.x, y, bbox.width, bbox.height);
    }

    protected override computeBBox(): BBox {
        if (!this.hasRenderableText()) {
            return new BBox(this.x, this.y, 0, 0);
        }
        this.generateTextMap();
        if (this.textMap?.size) {
            const bbox = BBox.merge(this.textMap.values());
            bbox.x = this.x - Text.calcLeftOffset(bbox.width, this.textAlign);
            bbox.y = this.y;
            return bbox;
        }
        const isRtl = this.scene?.isRtl;
        const { x, y, lines, textBaseline, textAlign } = this;
        const measuredTextBounds = Text.computeBBox(lines, x, y, { font: this, textBaseline, textAlign, isRtl });
        if (this.boxing != null) measuredTextBounds.grow(this.boxPadding);
        return measuredTextBounds;
    }

    getTextMeasureBBox() {
        return this.computeBBox();
    }

    getPlainText() {
        return toPlainText(this.text);
    }

    isPointInPath(x: number, y: number): boolean {
        return this.getBBox()?.containsPoint(x, y) ?? false;
    }

    override setScene(scene?: IScene) {
        this.richText?.setScene(scene);
        super.setScene(scene);
    }

    private generateTextMap() {
        if (!isArray(this.text) || this.textMap?.size) return;

        this.textMap ??= new Map();
        this.generatingTextMap = true;
        try {
            this.buildTextMap(this.text);
        } finally {
            this.generatingTextMap = false;
        }
    }

    private getSegmentMetrics(text: Segment[]): ReturnType<typeof measureTextSegments> {
        this.segmentMetrics ??= measureTextSegments(text, this);
        return this.segmentMetrics;
    }

    private buildTextMap(text: Segment[]) {
        const childNodes = this.richText!.children();
        const { width: totalWidth, lineMetrics } = this.getSegmentMetrics(text);

        const labelLeft = this.x - totalWidth / 2;
        let offsetY = 0;

        for (let lineIndex = 0; lineIndex < lineMetrics.length; ) {
            const line = lineMetrics[lineIndex];

            if (line.blockImages?.length) {
                const span = line.blockRowSpan ?? 1;
                const strip = line.blockImages;
                const stripWidth = strip.reduce(
                    (w, img, i) => w + img.textMetrics.width + (i > 0 ? BLOCK_IMAGE_SPACING : 0),
                    0
                );
                const stripHeight = strip.reduce((h, img) => Math.max(h, img.textMetrics.height), 0);

                let innerColHeight = 0;
                for (let k = 0; k < span; k++) {
                    innerColHeight += lineMetrics[lineIndex + k].height;
                }
                const rowHeight = Math.max(stripHeight, innerColHeight);

                // Lay out each image in the strip left-to-right. Each image anchors inside the row
                // height per its own verticalAlign; the text column anchors independently per the
                // first text segment's verticalAlign.
                let stripX = labelLeft;
                for (let s = 0; s < strip.length; s++) {
                    const blockSeg = strip[s];
                    const blockBox = blockSeg.textMetrics;
                    const imageAlign = blockSeg.verticalAlign ?? 'middle';
                    const imageOffset = Text.calcAnchoredOffset(imageAlign, rowHeight, blockBox.height);

                    const imageChild = childNodes.next().value;
                    if (!imageChild) return;
                    const imageNode = imageChild as ImageSegmentNode;
                    imageNode.x = stripX;
                    imageNode.y = offsetY + imageOffset;
                    imageNode.boxWidth = blockBox.width;
                    imageNode.boxHeight = blockBox.height;
                    imageNode.imageWidth = blockSeg.width;
                    imageNode.imageHeight = blockSeg.height;
                    Text.applyImagePadding(imageNode, blockSeg.padding);
                    imageNode.borderRadius = blockSeg.borderRadius ?? 0;
                    imageNode.backgroundFill = blockSeg.backgroundFill;
                    imageNode.border = blockSeg.border;
                    imageNode.url = blockSeg.url;
                    this.textMap!.set(imageNode, imageNode.getBBox());

                    stripX += blockBox.width + (s < strip.length - 1 ? BLOCK_IMAGE_SPACING : 0);
                }

                const firstTextSegment = Text.findFirstTextSegment(lineMetrics, lineIndex, span);
                const columnLeft = labelLeft + stripWidth + BLOCK_IMAGE_SPACING;
                let innerOffsetY =
                    offsetY +
                    Text.calcAnchoredOffset(firstTextSegment?.verticalAlign ?? 'alphabetic', rowHeight, innerColHeight);

                for (let k = 0; k < span; k++) {
                    innerOffsetY = this.renderLine(lineMetrics[lineIndex + k], columnLeft, innerOffsetY, childNodes);
                }

                offsetY += rowHeight;
                lineIndex += span;
                continue;
            }

            offsetY = this.renderLine(line, this.x - line.width / 2, offsetY, childNodes);
            lineIndex += 1;
        }
    }

    private static findFirstTextSegment(
        lineMetrics: ReturnType<typeof measureTextSegments>['lineMetrics'],
        startIndex: number,
        span: number
    ) {
        for (let k = 0; k < span; k++) {
            const seg = lineMetrics[startIndex + k].segments.find((s) => s.type !== 'image');
            if (seg && seg.type !== 'image') return seg;
        }
        return undefined;
    }

    private renderLine(
        line: ReturnType<typeof measureTextSegments>['lineMetrics'][number],
        lineLeft: number,
        offsetY: number,
        childNodes: IterableIterator<Node>
    ): number {
        const { height, ascent, segments } = line;
        let offsetX = 0;
        for (const measured of segments) {
            const node = childNodes.next().value;
            if (!node) break;

            if (measured.type === 'image') {
                const imageNode = node as ImageSegmentNode;
                const verticalAlign = measured.verticalAlign ?? 'middle';
                const anchorY = Text.calcSegmentY(verticalAlign, offsetY, ascent, height);
                const boxWidth = measured.textMetrics.width;
                const boxHeight = measured.textMetrics.height;
                imageNode.x = lineLeft + offsetX;
                imageNode.y = Text.calcImageTopFromAnchor(verticalAlign, anchorY, boxHeight);
                imageNode.boxWidth = boxWidth;
                imageNode.boxHeight = boxHeight;
                imageNode.imageWidth = measured.width;
                imageNode.imageHeight = measured.height;
                Text.applyImagePadding(imageNode, measured.padding);
                imageNode.borderRadius = measured.borderRadius ?? 0;
                imageNode.backgroundFill = measured.backgroundFill;
                imageNode.border = measured.border;
                imageNode.url = measured.url;
                this.textMap!.set(imageNode, imageNode.getBBox());
                offsetX += boxWidth;
                continue;
            }

            const { color, textMetrics, verticalAlign, ...segment } = measured;
            const textNode = node as Text;
            const segmentBaseline: CanvasTextBaseline = verticalAlign ?? 'alphabetic';
            textNode.x = lineLeft + offsetX;
            textNode.y = Text.calcSegmentY(segmentBaseline, offsetY, ascent, height);
            textNode.setProperties({ ...segment, textBaseline: segmentBaseline, fill: color ?? this.fill });
            const textBBox = textNode.getBBox();
            this.textMap!.set(textNode, textBBox);
            offsetX += textMetrics.width;
        }
        return offsetY + height;
    }

    // Anchor a child of `childHeight` inside a container of `totalHeight` according to verticalAlign.
    // Used to position the block-leading image and its text column independently within the label.
    private static calcAnchoredOffset(verticalAlign: CanvasTextBaseline, totalHeight: number, childHeight: number) {
        const slack = Math.max(0, totalHeight - childHeight);
        switch (verticalAlign) {
            case 'middle':
                return slack / 2;
            case 'bottom':
            case 'ideographic':
            case 'alphabetic':
                return slack;
            case 'top':
            case 'hanging':
            default:
                return 0;
        }
    }

    // Convert a chosen baseline anchor position into the image box's top-left y.
    private static calcImageTopFromAnchor(verticalAlign: CanvasTextBaseline, anchorY: number, boxHeight: number) {
        switch (verticalAlign) {
            case 'middle':
                return anchorY - boxHeight / 2;
            case 'bottom':
            case 'ideographic':
            case 'alphabetic':
                return anchorY - boxHeight;
            case 'top':
            case 'hanging':
            default:
                return anchorY;
        }
    }

    private static applyImagePadding(node: ImageSegmentNode, padding: Padding | undefined) {
        if (padding == null) {
            node.paddingTop = node.paddingRight = node.paddingBottom = node.paddingLeft = 0;
            return;
        }
        if (typeof padding === 'number') {
            node.paddingTop = node.paddingRight = node.paddingBottom = node.paddingLeft = padding;
            return;
        }
        node.paddingTop = padding.top ?? 0;
        node.paddingRight = padding.right ?? 0;
        node.paddingBottom = padding.bottom ?? 0;
        node.paddingLeft = padding.left ?? 0;
    }

    private static calcSegmentY(
        verticalAlign: CanvasTextBaseline,
        lineTop: number,
        ascent: number,
        height: number
    ): number {
        switch (verticalAlign) {
            case 'top':
            case 'hanging':
                return lineTop;
            case 'middle':
                return lineTop + height / 2;
            case 'bottom':
            case 'ideographic':
                return lineTop + height;
            case 'alphabetic':
            default:
                return lineTop + ascent;
        }
    }

    override render(renderCtx: RenderContext): void {
        const { ctx, stats } = renderCtx;

        if (!this.layerManager || !this.hasRenderableText()) {
            if (stats) stats.nodesSkipped += 1;
            return;
        }

        if (isArray(this.text) && this.richText) {
            this.generateTextMap();
            const richTextBBox = this.richText.getBBox();
            const { width, height, lineMetrics } = this.getSegmentMetrics(this.text);

            let translateX = 0;
            switch (this.textAlign) {
                case 'left':
                case 'start':
                    translateX = width / 2;
                    break;

                case 'right':
                case 'end':
                    translateX = width / -2;
            }

            const translateY = this.y - Text.calcSegmentedTopOffset(height, lineMetrics, this.textBaseline);

            this.renderBoxing(renderCtx, richTextBBox.clone().translate(translateX, translateY));

            ctx.save();
            ctx.translate(translateX, translateY);
            this.richText.opacity = this.opacity;
            this.richText.render(renderCtx);
            ctx.restore();
        } else {
            this.renderText(renderCtx);
        }

        if (Text.debug.check()) {
            const bbox = this.getBBox();
            ctx.lineWidth = this.textMap?.size ? 2 : 1;
            ctx.strokeStyle = this.textMap?.size ? 'blue' : 'red';
            ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);
        }

        super.render(renderCtx);
    }

    override markDirty(property?: string) {
        // Skip while generateTextMap is populating textMap — child setters trigger markDirty that
        // propagates back here through richText.parentNode, which would otherwise wipe entries
        // mid-iteration and leave only the last segment in textMap.
        if (!this.generatingTextMap) {
            this.textMap?.clear();
            this.segmentMetrics = undefined;
        }
        return super.markDirty(property);
    }

    private renderText(renderCtx: RenderContext): void {
        const { fill, stroke, strokeWidth, font, textAlign } = this;

        if ((!fill && !(stroke && strokeWidth)) || !this.layerManager) {
            // Short circuit early if nothing will be rendered.
            return super.render(renderCtx);
        }

        const { ctx } = renderCtx;
        // Compare against tracker — ctx.font getter canonicalises and spuriously fails !==.
        if (renderCtx.currentFont !== font) {
            ctx.font = font;
            renderCtx.currentFont = font;
        }

        ctx.textAlign = textAlign;

        this.renderBoxing(renderCtx);
        this.fillStroke(ctx);
    }

    private renderBoxing(renderCtx: RenderContext, bbox?: BBox): void {
        if (!this.boxing) return;

        // Use the static version of computeBBox instead of a dynamic version. The `boxing: Rect` shape is drawn
        // using the same matrix transformation of the text, so we want to ignore translation/rotation/scale
        // transformations from derived classes. We only need to measure the width/height of the untransformed text
        const textBBox = bbox ?? Text.computeBBox(this.lines, this.x, this.y, this);
        if (textBBox.width === 0 || textBBox.height === 0) return;

        const { x, y, width, height } = textBBox.grow(this.boxPadding);
        this.boxing.opacity = this.opacity;
        this.boxing.x = x;
        this.boxing.y = y;
        this.boxing.width = width;
        this.boxing.height = height;
        this.boxing.preRender(renderCtx);
        this.boxing.render(renderCtx);
    }

    protected override executeFill(ctx: CanvasRenderingContext2D) {
        this.renderLines((line, x, y) => ctx.fillText(line, x, y));
    }

    protected override executeStroke(ctx: CanvasRenderingContext2D) {
        this.renderLines((line, x, y) => ctx.strokeText(line, x, y));
    }

    private renderLines(renderCallback: (line: string, x: number, y: number) => void): void {
        const { x, y, lines } = this;

        if (!Number.isFinite(x) || !Number.isFinite(y)) return;

        const measurer = cachedTextMeasurer(this);
        const { lineMetrics } = measurer.measureLines(lines);
        const { textBaseline, lineHeight = measurer.lineHeight() } = this;

        let offsetY = 0;
        if (textBaseline === 'top') {
            offsetY = lineMetrics[0].ascent;
        } else if (textBaseline === 'middle' || textBaseline === 'bottom') {
            offsetY = lineHeight * (1 - lines.length);
            if (textBaseline === 'middle') {
                offsetY /= 2;
                offsetY -= measurer.baselineDistance(textBaseline);
            } else {
                offsetY -= lineMetrics[0].descent;
            }
        }

        for (const line of lineMetrics) {
            renderCallback(line.text, x, y + offsetY);
            offsetY += lineHeight;
        }
    }

    setFont(props: FontOptions) {
        this.fontFamily = props.fontFamily;
        this.fontSize = props.fontSize;
        this.fontStyle = props.fontStyle;
        this.fontWeight = props.fontWeight;
    }

    setAlign(props: { textAlign: CanvasTextAlign; textBaseline: CanvasTextBaseline }) {
        this.textAlign = props.textAlign;
        this.textBaseline = props.textBaseline;
    }

    setBoxing(props: TextBoxingProperties) {
        const stroke = props.border?.enabled ? props.border?.stroke : undefined;
        if (props.fill != null || stroke != null) {
            this.boxing ??= new Rect({ scene: this.scene });
            this.boxing.fill = props.fill;
            this.boxing.fillOpacity = props.fillOpacity ?? 1;
            this.boxing.cornerRadius = props.cornerRadius ?? 0;
            this.boxing.stroke = stroke;
            this.boxing.strokeWidth = props.border?.strokeWidth ?? 0;
            this.boxing.strokeOpacity = props.border?.strokeOpacity ?? 1;
            this.boxPadding = props.padding ?? 0;
        } else if (this.boxing) {
            this.boxing.destroy();
            this.boxing = undefined;
        }
    }

    hasBoxing() {
        return this.boxing != null;
    }

    getBoxingProperties(): TextBoxingProperties {
        const { fill, fillOpacity, cornerRadius, stroke, strokeWidth, strokeOpacity } = this.boxing ?? {};

        type Contraints = RequireOptional<TextBoxingProperties> & {
            border: RequireOptional<TextBoxingProperties['border']>;
        };
        return {
            border: { enabled: stroke != null, stroke, strokeWidth, strokeOpacity },
            cornerRadius,
            fill,
            fillOpacity,
            padding: this.boxPadding,
        } satisfies Contraints;
    }

    override toSVG(): { elements: SVGElement[]; defs?: SVGElement[] } | undefined {
        if (!this.visible || !this.hasRenderableText()) return;

        const text = this.text;
        if (text == null) return;
        const element = createSvgElement('text');

        if (isArray(text)) {
            for (const segment of text) {
                if (segment.type === 'image') continue;
                const segmentElement = createSvgElement('tspan');

                setSvgFontAttributes(segmentElement, {
                    fontSize: segment.fontSize ?? this.fontSize,
                    fontFamily: segment.fontFamily ?? this.fontFamily,
                    fontWeight: segment.fontWeight ?? this.fontWeight,
                    fontStyle: segment.fontStyle ?? this.fontStyle,
                });
                this.applySvgFillAttributes(segmentElement);

                segmentElement.textContent = toTextString(segment.text);
                element.append(segmentElement);
            }
        } else {
            this.applySvgFillAttributes(element);
            setSvgFontAttributes(element, this);
            element.setAttribute(
                'text-anchor',
                {
                    center: 'middle',
                    left: 'start',
                    right: 'end',
                    start: 'start',
                    end: 'end',
                }[this.textAlign ?? 'start']
            );
            element.setAttribute('alignment-baseline', this.textBaseline);
            element.setAttribute('x', String(this.x));
            element.setAttribute('y', String(this.y));

            element.textContent = toTextString(text);
        }

        return { elements: [element] };
    }

    private hasRenderableText(): boolean {
        const { text } = this;
        if (text == null) {
            return false;
        }
        return isArray(text) ? true : toTextString(text) !== '';
    }
}

export type RotatableText<D = unknown> = RotatableType<Text<D>>;
export type TransformableText<D = unknown> = RotatableType<TranslatableType<Text<D>>>;

type P = ConstructorParameters<typeof Text>[0];
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const RotatableText: new <D = unknown>(p?: P) => RotatableText<D> = Rotatable(Text<any>);
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const TransformableText: new <D = unknown>(p?: P) => TransformableText<D> = Rotatable(Translatable(Text<any>));
