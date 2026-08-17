import {
    BLOCK_IMAGE_SPACING,
    type BoxBounds,
    Debug,
    type FontOptions,
    LineSplitter,
    type MeasuredImageSegment,
    type NormalisedContentSegment,
    type NormalisedTextOrSegments,
    type RequireOptional,
    SceneRefChangeDetection,
    type TextMetricsBox,
    ambientLog,
    blockStripHeight,
    blockStripWidth,
    cachedTextMeasurer,
    createSvgElement,
    forceLtrNumbers,
    imageBoxAroundBaseline,
    isArray,
    isDirectionNeutral,
    measureTextSegments,
    resolvePadding,
    resolveTextAlign,
    toCanvasTextBaseline,
    toFontString,
    toPlainText,
    toTextString,
} from 'ag-charts-core';
import type { SerializedNodeState, SerializedTextProps } from 'ag-charts-core';
import type { FontStyle, FontWeight, Opacity, Padding, PixelSize } from 'ag-charts-types';

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
    private suppressedDirtyDuringGenerate = false;

    @SceneChangeDetection()
    x: number = 0;

    @SceneChangeDetection()
    y: number = 0;

    override serialize(): SerializedNodeState {
        return { type: 'text', props: this.serializeProps() };
    }

    protected override serializeProps(): SerializedTextProps {
        return {
            ...super.serializeProps(),
            x: this.x,
            y: this.y,
            text: this.text == null ? undefined : String(this.text),
        };
    }

    private lines: string[] = [];
    private directed?: { direction: CanvasDirection; lines: string[] };
    private onTextChange() {
        this.richText?.clear();
        this.textMap?.clear();
        this.segmentMetrics = undefined;
        this.directed = undefined;

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
                this.richText.setScene();
                this.richText = undefined;
            }
            const lines = toTextString(this.text).split(LineSplitter);
            this.lines = this.trimText ? lines.map((line) => line.trim()) : lines;
        }
    }

    @SceneRefChangeDetection({
        changeCb: (o: Text) => o.onTextChange(),
    })
    text?: NormalisedTextOrSegments = undefined;

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
        text: NormalisedTextOrSegments,
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

            case 'middle': {
                // The single-line shortcut uses text-baseline metrics to anchor the row tightly to
                // the glyph middle. It is only valid for a pure-text line: a row carrying a
                // block-image strip or an inline image has its ascent dominated by the image box,
                // so the glyph offset no longer matches the row centre. Those rows (and multi-line
                // labels) centre on height/2 instead, so the box centres on y.
                const line = lineMetrics[0];
                const isPureTextLine =
                    lineMetrics.length === 1 &&
                    line.segments.length > 0 &&
                    !line.blockImages?.length &&
                    line.segments.every((s) => s.type !== 'image');
                if (isPureTextLine) {
                    return (
                        line.ascent +
                        line.segments.reduce(
                            (offsetY, segment) =>
                                segment.type === 'image'
                                    ? offsetY
                                    : Math.min(offsetY, cachedTextMeasurer(segment).baselineDistance('middle')),
                            0
                        )
                    );
                }
                return height / 2;
            }

            case 'bottom':
                return height;

            default:
                return 0;
        }
    }

    private static calcLeftOffset(width: number, textAlign?: CanvasTextAlign, isRtl?: boolean): number {
        switch (textAlign && resolveTextAlign(textAlign, isRtl)) {
            case 'center':
                return width * 0.5;
            case 'right':
                return width;
            default:
                return 0;
        }
    }

    override getBBox(): BBox {
        const bbox = super.getBBox();
        if (!this.textMap?.size || !isArray(this.text)) return bbox;

        const { height, lineMetrics } = this.getSegmentMetrics(this.text);
        const offsetTop = Text.calcSegmentedTopOffset(height, lineMetrics, this.textBaseline);
        const y = this.y - offsetTop;
        if (bbox.y === y && this.boxing == null) return bbox;

        const segmentBBox = new BBox(bbox.x, y, bbox.width, bbox.height);
        // Mirror the plain-text grow (computeTextBBox) so a boxed segment caption's bounds — and the
        // render layer sized from them — include the box; without it the box top is clipped.
        if (this.boxing != null) segmentBBox.grow(this.boxPadding);
        return segmentBBox;
    }

    protected override computeBBox(): BBox {
        return this.computeTextBBox();
    }

    // Untransformed glyph box; must bypass the computeBBox override so getTextMeasureBBox never folds
    // in the node's own rotation/translation.
    private computeTextBBox(): BBox {
        if (!this.hasRenderableText()) {
            return new BBox(this.x, this.y, 0, 0);
        }
        this.generateTextMap();
        if (this.textMap?.size) {
            const bbox = BBox.merge(this.textMap.values());
            bbox.x = this.x - Text.calcLeftOffset(bbox.width, this.textAlign, this.scene?.isRtl);
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
        return this.computeTextBBox();
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
        this.suppressedDirtyDuringGenerate = false;
        try {
            this.buildTextMap(this.text);
        } finally {
            this.generatingTextMap = false;
            if (this.suppressedDirtyDuringGenerate) {
                this.suppressedDirtyDuringGenerate = false;
                // Propagate the accumulated child-dirty signal up once now that the map is whole.
                // Bypass our own override to avoid wiping the textMap we just built.
                super.markDirty();
            }
        }
    }

    private getSegmentMetrics(text: NormalisedContentSegment[]): ReturnType<typeof measureTextSegments> {
        this.segmentMetrics ??= measureTextSegments(text, this);
        return this.segmentMetrics;
    }

    private buildTextMap(text: NormalisedContentSegment[]) {
        const childNodes = this.richText!.children();
        const { width: totalWidth, lineMetrics } = this.getSegmentMetrics(text);

        // Block-row strips anchor at `labelLeft` (the leftmost edge of the wrapped row), while
        // single-segment lines anchor at `this.x - line.width / 2` so they centre on the label
        // origin. That asymmetry is deliberate: block layouts have a fixed left edge so the
        // strip+column geometry is preserved; line-only content centres as before.
        const labelLeft = this.x - totalWidth / 2;
        let offsetY = 0;

        for (let lineIndex = 0; lineIndex < lineMetrics.length; ) {
            const line = lineMetrics[lineIndex];

            if (line.blockImages?.length) {
                const span = line.blockRowSpan ?? 1;
                const nextOffsetY = this.layoutBlockRow(lineMetrics, lineIndex, span, offsetY, labelLeft, childNodes);
                if (nextOffsetY == null) return;
                offsetY = nextOffsetY;
                lineIndex += span;
                continue;
            }

            offsetY = this.renderLine(line, this.x - line.width / 2, offsetY, childNodes);
            lineIndex += 1;
        }
    }

    // Lay out a block-image row: the leading image strip anchored at `labelLeft`, then the text
    // column (`span` wrapped lines) flowing to its right. Returns the advanced offsetY, or null
    // if the child-node supply diverged from the line metrics (caller abandons the map).
    private layoutBlockRow(
        lineMetrics: ReturnType<typeof measureTextSegments>['lineMetrics'],
        lineIndex: number,
        span: number,
        offsetY: number,
        labelLeft: number,
        childNodes: IterableIterator<Node>
    ): number | null {
        const strip = lineMetrics[lineIndex].blockImages!;
        const stripWidth = blockStripWidth(strip);
        const stripHeight = blockStripHeight(strip);

        let innerColHeight = 0;
        for (let k = 0; k < span; k++) {
            innerColHeight += lineMetrics[lineIndex + k].height;
        }
        const rowHeight = Math.max(stripHeight, innerColHeight);

        // Lay out each image in the strip left-to-right. Each image anchors inside the row height
        // per its own verticalAlign; the text column anchors independently per the first text
        // segment's verticalAlign.
        let stripX = labelLeft;
        for (let s = 0; s < strip.length; s++) {
            const blockSeg = strip[s];
            const blockBox = blockSeg.textMetrics;
            const imageAlign = toCanvasTextBaseline(blockSeg.verticalAlign) ?? 'middle';
            const imageOffset = Text.calcAnchoredOffset(imageAlign, rowHeight, blockBox.height);

            const imageChild = childNodes.next().value;
            if (!imageChild) {
                this.abandonTextMap();
                return null;
            }
            Text.applyImageSegment(imageChild as ImageSegmentNode, blockSeg, stripX, offsetY + imageOffset);
            this.textMap!.set(imageChild, (imageChild as ImageSegmentNode).getBBox());

            stripX += blockBox.width + (s < strip.length - 1 ? BLOCK_IMAGE_SPACING : 0);
        }

        const firstTextSegment = Text.findFirstTextSegment(lineMetrics, lineIndex, span);
        const columnLeft = labelLeft + stripWidth + BLOCK_IMAGE_SPACING;
        let innerOffsetY =
            offsetY +
            Text.calcAnchoredOffset(
                toCanvasTextBaseline(firstTextSegment?.verticalAlign) ?? 'alphabetic',
                rowHeight,
                innerColHeight
            );

        for (let k = 0; k < span; k++) {
            innerOffsetY = this.renderLine(lineMetrics[lineIndex + k], columnLeft, innerOffsetY, childNodes);
        }

        return offsetY + rowHeight;
    }

    private static findFirstTextSegment(
        lineMetrics: ReturnType<typeof measureTextSegments>['lineMetrics'],
        startIndex: number,
        span: number
    ) {
        for (let k = 0; k < span; k++) {
            const seg = lineMetrics[startIndex + k].segments.find((s) => s.type !== 'image');
            if (seg) return seg;
        }
        return undefined;
    }

    private renderLine(
        line: ReturnType<typeof measureTextSegments>['lineMetrics'][number],
        lineLeft: number,
        offsetY: number,
        childNodes: IterableIterator<Node>
    ): number {
        const { height, ascent, textAscent, textDescent, segments } = line;
        const baseline = offsetY + ascent;
        let offsetX = 0;
        for (const measured of segments) {
            const node = childNodes.next().value;
            if (!node) {
                // Child supply diverged from the line metrics. Abandon the partial map so the next
                // render rebuilds from scratch instead of serving a half-populated textMap.
                this.abandonTextMap();
                return offsetY + height;
            }

            if (measured.type === 'image') {
                // The image box is placed relative to the text baseline per its verticalAlign; the
                // text stays put. The line was already grown to contain this extent during measurement.
                const boxWidth = measured.textMetrics.width;
                const boxHeight = measured.textMetrics.height;
                const { above } = imageBoxAroundBaseline(
                    toCanvasTextBaseline(measured.verticalAlign),
                    boxHeight,
                    textAscent,
                    textDescent
                );
                const imageNode = node as ImageSegmentNode;
                Text.applyImageSegment(imageNode, measured, lineLeft + offsetX, baseline - above);
                this.textMap!.set(imageNode, imageNode.getBBox());
                offsetX += boxWidth;
                continue;
            }

            const { color, textMetrics, verticalAlign, ...segment } = measured;
            const textNode = node as Text;
            const segmentBaseline: CanvasTextBaseline = toCanvasTextBaseline(verticalAlign) ?? 'alphabetic';
            textNode.x = lineLeft + offsetX;
            textNode.y = Text.calcSegmentY(segmentBaseline, offsetY, ascent, height);
            textNode.setProperties({ ...segment, textBaseline: segmentBaseline, fill: color ?? this.fill });
            const textBBox = textNode.getBBox();
            this.textMap!.set(textNode, textBBox);
            offsetX += textMetrics.width;
        }
        return offsetY + height;
    }

    private abandonTextMap() {
        this.textMap?.clear();
        this.segmentMetrics = undefined;
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

    private static applyImageSegment(node: ImageSegmentNode, segment: MeasuredImageSegment, x: number, y: number) {
        const { top, right, bottom, left } = resolvePadding(segment.padding);
        node.x = x;
        node.y = y;
        node.boxWidth = segment.textMetrics.width;
        node.boxHeight = segment.textMetrics.height;
        node.imageWidth = segment.width;
        node.imageHeight = segment.height;
        node.paddingTop = top;
        node.paddingRight = right;
        node.paddingBottom = bottom;
        node.paddingLeft = left;
        node.cornerRadius = segment.cornerRadius ?? 0;
        node.backgroundFill = segment.backgroundFill;
        node.url = segment.url;
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
            switch (resolveTextAlign(this.textAlign, renderCtx.direction === 'rtl')) {
                case 'left':
                    translateX = width / 2;
                    break;

                case 'right':
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
        if (this.generatingTextMap) {
            // Child setters during buildTextMap trigger markDirty that propagates back here
            // through richText.parentNode. Skip both the local-cache clear (would wipe entries
            // mid-iteration) and the super.markDirty() propagation (would fan out N×K parent
            // invalidations during the build). The accumulated dirty signal is flushed once at
            // the end of generateTextMap.
            this.suppressedDirtyDuringGenerate = true;
            return;
        }
        this.textMap?.clear();
        this.segmentMetrics = undefined;
        return super.markDirty(property);
    }

    // A number beside RTL text reorders to `5-` whatever the paragraph direction, since the sign is
    // neutral and binds to the RTL run. `direction` is the line's own reading order, not the scene's.
    private resolveDirected(): { direction: CanvasDirection; lines: string[] } {
        this.directed ??= this.lines.every(isDirectionNeutral)
            ? { direction: 'ltr', lines: this.lines }
            : { direction: 'rtl', lines: this.lines.map(forceLtrNumbers) };
        return this.directed;
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

        // Only an RTL scene can impose a paragraph direction the line did not ask for.
        const isRtl = renderCtx.direction === 'rtl';
        const direction = isRtl ? this.resolveDirected().direction : 'ltr';
        if (ctx.direction !== direction) {
            ctx.direction = direction;
        }
        ctx.textAlign = resolveTextAlign(textAlign, isRtl);

        this.renderBoxing(renderCtx);
        this.fillStroke(ctx, renderCtx.logger);
    }

    private renderBoxing(renderCtx: RenderContext, bbox?: BBox): void {
        if (!this.boxing) return;

        // Use the static version of computeBBox instead of a dynamic version. The `boxing: Rect` shape is drawn
        // using the same matrix transformation of the text, so we want to ignore translation/rotation/scale
        // transformations from derived classes. We only need to measure the width/height of the untransformed text
        const textBBox =
            bbox ??
            Text.computeBBox(this.lines, this.x, this.y, {
                font: this,
                lineHeight: this.lineHeight,
                textAlign: this.textAlign,
                textBaseline: this.textBaseline,
                isRtl: renderCtx.direction === 'rtl',
            });
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

        // Metrics stay keyed on the unmodified lines; the directional marks are zero-width, so only
        // the drawn string carries them.
        const directedLines = this.resolveDirected().lines;
        for (let i = 0; i < lineMetrics.length; i += 1) {
            renderCallback(directedLines?.[i] ?? lineMetrics[i].text, x, y + offsetY);
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
                if (segment.type === 'image') {
                    ambientLog.warnOnce('SVG export drops inline image segments; text content is preserved.');
                    continue;
                }
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
        return isArray(text) ? text.length > 0 : toTextString(text) !== '';
    }
}

export type RotatableText<D = unknown> = RotatableType<Text<D>>;
export type TransformableText<D = unknown> = RotatableType<TranslatableType<Text<D>>>;

type P = ConstructorParameters<typeof Text>[0];
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const RotatableText: new <D = unknown>(p?: P) => RotatableText<D> = Rotatable(Text<any>);
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const TransformableText: new <D = unknown>(p?: P) => TransformableText<D> = Rotatable(Translatable(Text<any>));
