import {
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
import type { FontStyle, FontWeight, Opacity, Padding, PixelSize, TextOrSegments } from 'ag-charts-types';

import { BBox } from '../bbox';
import { Group } from '../group';
import type { IScene, NodeOptions, RenderContext } from '../node';
import { SceneChangeDetection } from '../node';
import { DebugSelectors } from '../sceneDebug';
import { Rotatable, Translatable } from '../transformable';
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

export class Text<D = any> extends Shape<D> {
    static override readonly className = 'Text';

    private static readonly debug = Debug.create(true, DebugSelectors.SCENE_TEXT);

    private static readonly defaultFontSize = 10;

    private richText?: Group;
    private textMap?: Map<Text, BoxBounds>;

    @SceneChangeDetection()
    x: number = 0;

    @SceneChangeDetection()
    y: number = 0;

    private lines: string[] = [];
    private onTextChange() {
        this.richText?.clear();
        this.textMap?.clear();

        if (isArray(this.text)) {
            this.lines = [];
            this.richText ??= new Group();
            this.richText.setScene(this.scene);
            this.richText.append(
                this.text
                    .flatMap((s) => toTextString(s.text).split(LineSplitter))
                    .filter(Boolean)
                    .map(() => new Text({ trimText: false }))
            );
        } else {
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
        }
    ): BBox {
        const { font, lineHeight, textAlign, textBaseline } = opts;
        const { width, height, lineMetrics } = cachedTextMeasurer(font).measureLines(lines);
        const totalHeight = lineHeight ? lineHeight * lineMetrics.length : height;
        const offsetTop = Text.calcTopOffset(totalHeight, lineMetrics[0], textBaseline);
        const offsetLeft = Text.calcLeftOffset(width, textAlign);

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
                return lineMetrics.length === 1
                    ? lineMetrics[0].ascent +
                          lineMetrics[0].segments.reduce(
                              (offsetY, segment) =>
                                  Math.min(offsetY, cachedTextMeasurer(segment).baselineDistance('middle')),
                              0
                          )
                    : height / 2;

            case 'bottom':
                return height;

            default:
                return 0;
        }
    }

    private static calcLeftOffset(width: number, textAlign?: CanvasTextAlign): number {
        let offset = 0;
        switch (textAlign) {
            case 'center':
                offset = 0.5;
                break;
            case 'right':
            case 'end':
                offset = 1;
        }
        return width * offset;
    }

    override getBBox(): BBox {
        const bbox = super.getBBox();
        if (!this.textMap?.size || !isArray(this.text)) return bbox;

        const { height, lineMetrics } = measureTextSegments(this.text, this);
        const offsetTop = Text.calcSegmentedTopOffset(height, lineMetrics, this.textBaseline);
        const y = this.y - offsetTop;
        if (bbox.y === y) return bbox;

        return new BBox(bbox.x, y, bbox.width, bbox.height);
    }

    protected override computeBBox(): BBox {
        this.generateTextMap();
        if (this.textMap?.size) {
            const bbox = BBox.merge(this.textMap.values());
            bbox.x = this.x - Text.calcLeftOffset(bbox.width, this.textAlign);
            bbox.y = this.y;
            return bbox;
        }
        const { x, y, lines, textBaseline, textAlign } = this;
        const measuredTextBounds = Text.computeBBox(lines, x, y, { font: this, textBaseline, textAlign });
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

        let offsetY = 0;
        const textNodes = this.richText!.children();
        for (const { width, height, ascent, segments } of measureTextSegments(this.text, this).lineMetrics) {
            let offsetX = 0;
            for (const { color, textMetrics, ...segment } of segments) {
                const textNode = textNodes.next().value as Text;
                textNode.x = this.x - width / 2 + offsetX;
                textNode.y = ascent + offsetY;
                textNode.setProperties({ ...segment, fill: color ?? this.fill });
                const textBBox = textNode.getBBox();
                this.textMap.set(textNode, textBBox);
                offsetX += textMetrics.width;
            }
            offsetY += height;
        }
    }

    override render(renderCtx: RenderContext): void {
        const { ctx, stats } = renderCtx;

        if (!this.layerManager || !this.hasRenderableText()) {
            if (stats) stats.nodesSkipped += 1;
            return super.render(renderCtx);
        }

        if (isArray(this.text) && this.richText) {
            this.generateTextMap();
            const richTextBBox = this.richText.getBBox();
            const { width, height, lineMetrics } = measureTextSegments(this.text, this);

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
        this.textMap?.clear();
        return super.markDirty(property);
    }

    private renderText(renderCtx: RenderContext): void {
        const { fill, stroke, strokeWidth, font, textAlign } = this;

        if ((!fill && !(stroke && strokeWidth)) || !this.layerManager) {
            // Short circuit early if nothing will be rendered.
            return super.render(renderCtx);
        }

        const { ctx } = renderCtx;
        // Try to avoid this assignment, which typically always incurs a font switch cost.
        if (ctx.font !== font) {
            ctx.font = font;
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

export class RotatableText extends Rotatable(Text) {}
export class TransformableText extends Rotatable(Translatable(Text)) {}
