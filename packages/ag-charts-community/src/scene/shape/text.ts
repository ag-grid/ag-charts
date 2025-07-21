import { type BoxBounds, type RequireOptional, createSvgElement, isArray, isString } from 'ag-charts-core';
import type {
    FontFamily,
    FontSize,
    FontStyle,
    FontWeight,
    Opacity,
    Padding,
    PixelSize,
    TextSegment,
} from 'ag-charts-types';

import { Debug } from '../../util/debug';
import { mergeDefaults } from '../../util/object';
import { CachedTextMeasurerPool, type MeasureOptions, TextUtils } from '../../util/textMeasurer';
import { BBox } from '../bbox';
import { SceneRefChangeDetection } from '../changeDetectable';
import { Group } from '../group';
import type { IScene, NodeOptions, RenderContext } from '../node';
import { SceneChangeDetection } from '../node';
import { DebugSelectors } from '../sceneDebug';
import { Rotatable, Translatable } from '../transformable';
import { Rect } from './rect';
import { Shape, type ShapeColor } from './shape';
import { setSvgFontAttributes } from './svgUtils';

export interface TextSizeProperties {
    fontFamily?: FontFamily;
    fontSize: FontSize;
    fontStyle?: FontStyle;
    fontWeight?: FontWeight;
    lineHeight?: number;
    textBaseline?: CanvasTextBaseline;
    textAlign?: CanvasTextAlign;
}

export interface TextBoxingProperties {
    cornerRadius?: PixelSize;
    padding?: Padding;
    fill?: ShapeColor;
    fillOpacity?: Opacity;
    border?: {
        stroke?: ShapeColor;
        strokeWidth?: PixelSize;
        strokeOpacity?: Opacity;
    };
}

// @todo() - Workaround for subclassing
let externUseGlyphIndependentMeasurements = false;

export class Text<D = any> extends Shape<D> {
    static readonly className = 'Text';

    private static readonly debug = Debug.create(true, DebugSelectors.SCENE_TEXT);

    private static readonly defaultFontSize = 10;

    private richText?: Group<Text>;
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
            this.richText.append(this.text.map(() => new Text({ trimText: false })));
        } else {
            const lines = this.text?.split('\n') ?? [];
            this.lines = this.trimText ? lines.map((line) => line.trim()) : lines;
        }
    }

    @SceneRefChangeDetection({
        changeCb: (o: Text) => o.onTextChange(),
    })
    text?: string | TextSegment[] = undefined;

    @SceneChangeDetection()
    fontStyle?: FontStyle;

    @SceneChangeDetection()
    fontWeight?: FontWeight;

    @SceneChangeDetection()
    fontSize: number = Text.defaultFontSize;

    @SceneChangeDetection()
    fontFamily?: string = 'sans-serif';

    @SceneChangeDetection()
    textAlign: CanvasTextAlign = 'start';

    @SceneChangeDetection()
    textBaseline: CanvasTextBaseline = 'alphabetic';

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

    static computeBBox(
        lines: string | string[],
        x: number,
        y: number,
        opts: MeasureOptions,
        useGlyphIndependentMeasurements: boolean = true
    ): BBox {
        const {
            font,
            font: { fontSize },
            textAlign,
            textBaseline,
            lineHeight = useGlyphIndependentMeasurements ? TextUtils.getLineHeight(fontSize) : undefined,
        } = opts;
        const {
            width,
            alphabeticBaseline,
            offsetLeft: exactOffsetLeft,
            offsetTop: exactOffsetTop,
            height: exactHeight,
        } = CachedTextMeasurerPool.measureLines(
            lines,
            useGlyphIndependentMeasurements ? { font, lineHeight, textAlign: 'start', textBaseline: 'top' } : opts
        );
        const height = lineHeight == null ? exactHeight : lineHeight * lines.length;

        let offsetTop: number;
        if (lineHeight == null) {
            offsetTop = exactOffsetTop;
        } else if (textBaseline === 'alphabetic') {
            const padding = (lineHeight - fontSize) / 2;
            offsetTop = padding - alphabeticBaseline;
        } else {
            offsetTop = TextUtils.getVerticalModifier(textBaseline) * height;
        }

        const offsetLeft = useGlyphIndependentMeasurements
            ? width * TextUtils.getHorizontalModifier(textAlign)
            : exactOffsetLeft;

        return new BBox(x - offsetLeft, y - offsetTop, width, height);
    }

    protected override computeBBox(
        useGlyphIndependentMeasurements: boolean = externUseGlyphIndependentMeasurements
    ): BBox {
        this.generateTextMap();
        if (this.textMap?.size) {
            const bbox = BBox.merge(this.textMap.values());
            bbox.x = this.x;
            bbox.y = this.y;
            return bbox;
        }
        const { x, y, lines, textBaseline, textAlign, lineHeight } = this;
        return Text.computeBBox(
            lines,
            x,
            y,
            { font: this, textBaseline, textAlign, lineHeight },
            useGlyphIndependentMeasurements
        );
    }

    override getBBox(useGlyphIndependentMeasurements: boolean = true): BBox {
        if (useGlyphIndependentMeasurements) {
            externUseGlyphIndependentMeasurements = true;
            const bbox = this.computeBBox(true);
            externUseGlyphIndependentMeasurements = false;
            return bbox;
        }
        return super.getBBox();
    }

    getTextMeasureBBox() {
        return this.computeBBox();
    }

    isPointInPath(x: number, y: number): boolean {
        const bbox = this.getBBox();

        return bbox ? bbox.containsPoint(x, y) : false;
    }

    getStyle(): Omit<TextSegment, 'text'> & { fontSize: number } {
        return {
            fontSize: this.fontSize,
            fontFamily: this.fontFamily,
            fontStyle: this.fontStyle,
            fontWeight: this.fontWeight,
            fill: this.fill,
            fillOpacity: this.fillOpacity,
            stroke: this.stroke as string,
            strokeWidth: this.strokeWidth,
            strokeOpacity: this.strokeOpacity,
        };
    }

    override setScene(scene?: IScene) {
        this.richText?.setScene(scene);
        super.setScene(scene);
    }

    private generateTextMap() {
        if (!isArray(this.text) || this.textMap?.size) return;

        this.textMap ??= new Map();

        let index = 0;
        let totalWidth = 0;
        let offsetY = this.y;
        const mainStyle = this.getStyle();

        for (const textNode of this.richText!.children() as Iterable<Text>) {
            const { color, ...textSegment } = this.text[index++];
            textSegment.fill = color;
            textNode.x = 0;
            textNode.y = 0;
            textNode.setProperties(mergeDefaults(textSegment, mainStyle));
            const textBBox = textNode.getBBox();
            this.textMap.set(textNode, textBBox);
            offsetY = Math.max(offsetY, textNode.lineHeight ?? TextUtils.getLineHeight(textNode.fontSize));
            totalWidth += textBBox.x + textBBox.width;
        }
        let offsetX = this.x - totalWidth / 2;
        for (const [textNode, bbox] of this.textMap) {
            textNode.x += offsetX;
            textNode.y += offsetY;
            offsetX += bbox.width;
        }
    }

    override render(renderCtx: RenderContext): void {
        const { ctx, stats } = renderCtx;

        if (!this.text || !this.layerManager) {
            if (stats) stats.nodesSkipped += 1;
            return super.render(renderCtx);
        }

        if (isArray(this.text)) {
            this.generateTextMap();
            ctx.save();
            ctx.translate(0, this.y);
            this.richText!.render(renderCtx);
            ctx.restore();
        } else {
            this.renderText(renderCtx);
        }

        if (Text.debug.check() && !this.textMap?.size) {
            const bbox = this.getBBox(true);
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 1;
            ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);
        }

        super.render(renderCtx);
    }

    override markDirty(property?: string) {
        this.textMap?.clear();
        return super.markDirty(property);
    }

    private renderText(renderCtx: RenderContext): void {
        const { fill, stroke, strokeWidth } = this;

        if ((!fill && !(stroke && strokeWidth)) || !this.layerManager) {
            // Short circuit early if nothing will be rendered.
            return super.render(renderCtx);
        }

        const { ctx } = renderCtx;
        const { globalAlpha } = ctx;
        const font = TextUtils.toFontString(this);
        // Try to avoid this assignment, which typically always incurs a font switch cost.
        if (ctx.font !== font) {
            ctx.font = font;
        }

        const { fontSize, lineHeight = TextUtils.getLineHeight(fontSize), textAlign, textBaseline } = this;

        const lines = this.lines.length;
        const lineOriginY =
            textBaseline === 'alphabetic' ? 0 : -TextUtils.getVerticalModifier(textBaseline) * lineHeight * (lines - 1);

        ctx.textAlign = textAlign;
        ctx.textBaseline = textBaseline;

        if (this.boxing) {
            // Use the static version of computeBBox instead of dynamic version. The `boxing: Rect` shape is drawn using
            // the same matrix transformation of the text, so we want to ignore translation/rotation/scale
            // transformations from derived classes. We only need to measure the width/height of the untransformed text
            const opts: MeasureOptions = { font: this, textBaseline, textAlign, lineHeight };
            const textBBox = Text.computeBBox(this.lines, this.x, this.y, opts);
            if (textBBox.width !== 0 && textBBox.height !== 0) {
                const { x, y, width, height } = textBBox.grow(this.boxPadding);
                this.boxing.x = x;
                this.boxing.y = y;
                this.boxing.width = width;
                this.boxing.height = height;
                this.boxing.preRender(renderCtx);
                this.boxing.render(renderCtx);
            }
        }

        if (fill) {
            this.applyFillAndAlpha(ctx);
            this.applyShadow(ctx);
            this.renderLines(lineOriginY, lineHeight, (line, x, y) => ctx.fillText(line, x, y));

            ctx.globalAlpha = globalAlpha;
        }

        if (stroke && strokeWidth) {
            this.applyStrokeAndAlpha(ctx);
            ctx.lineWidth = strokeWidth;

            const { lineDash, lineDashOffset, lineCap, lineJoin } = this;

            if (lineDash) {
                ctx.setLineDash(lineDash as number[]);
            }

            if (lineDashOffset) {
                ctx.lineDashOffset = lineDashOffset;
            }

            if (lineCap) {
                ctx.lineCap = lineCap;
            }

            if (lineJoin) {
                ctx.lineJoin = lineJoin;
            }

            this.renderLines(lineOriginY, lineHeight, (line, x, y) => ctx.strokeText(line, x, y));

            ctx.globalAlpha = globalAlpha;
        }
    }

    protected override executeStroke(ctx: CanvasRenderingContext2D) {
        const { fontSize, lineHeight = TextUtils.getLineHeight(fontSize), textBaseline, lines } = this;
        const lineOriginY =
            textBaseline === 'alphabetic'
                ? 0
                : -TextUtils.getVerticalModifier(textBaseline) * lineHeight * (lines.length - 1);
        this.renderLines(lineOriginY, lineHeight, (line, x, y) => ctx.strokeText(line, x, y));
    }

    private renderLines(
        offsetY: number,
        lineHeight: number,
        renderCallback: (line: string, x: number, y: number) => void
    ): void {
        const { lines, x, y } = this;

        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(offsetY) || !Number.isFinite(lineHeight)) {
            return;
        }

        for (const line of lines) {
            renderCallback(line, x, y + offsetY);
            offsetY += lineHeight;
        }
    }

    setFont(props: TextSizeProperties) {
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
        if (props.fill != null || props.border?.stroke != null) {
            this.boxing ??= new Rect();
            this.boxing.fill = props.fill;
            this.boxing.fillOpacity = props.fillOpacity ?? 1;
            this.boxing.cornerRadius = props.cornerRadius ?? 0;
            this.boxing.stroke = props.border?.stroke;
            this.boxing.strokeWidth = props.border?.strokeWidth ?? 0;
            this.boxing.strokeOpacity = props.border?.strokeOpacity ?? 1;
            this.boxPadding = props.padding ?? 0;
        } else if (this.boxing) {
            this.boxing.destroy();
            this.boxing = undefined;
        }
    }

    getBoxingProperties(): TextBoxingProperties {
        const {
            fill = undefined,
            fillOpacity = undefined,
            cornerRadius = undefined,
            stroke = undefined,
            strokeWidth = undefined,
            strokeOpacity = undefined,
        } = this.boxing ?? {};

        return {
            border: { stroke, strokeWidth, strokeOpacity },
            cornerRadius,
            fill,
            fillOpacity,
            padding: this.boxPadding,
        } satisfies RequireOptional<TextBoxingProperties>;
    }

    override toSVG(): { elements: SVGElement[]; defs?: SVGElement[] } | undefined {
        if (!this.visible || !this.text) return;

        const element = createSvgElement('text');

        if (isString(this.text)) {
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

            element.textContent = this.text;
        } else {
            for (const segment of this.text) {
                const segmentElement = createSvgElement('tspan');

                setSvgFontAttributes(segmentElement, {
                    fontSize: segment.fontSize ?? this.fontSize,
                    fontFamily: segment.fontFamily ?? this.fontFamily,
                    fontWeight: segment.fontWeight ?? this.fontWeight,
                    fontStyle: segment.fontStyle ?? this.fontStyle,
                });
                this.applySvgFillAttributes(segmentElement);

                segmentElement.textContent = segment.text;
                element.append(segmentElement);
            }
        }

        return { elements: [element] };
    }
}

export class RotatableText extends Rotatable(Text) {}
export class TransformableText extends Rotatable(Translatable(Text)) {}
