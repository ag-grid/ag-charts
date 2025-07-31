import {
    type BoxBounds,
    type FontOptions,
    type RequireOptional,
    cachedTextMeasurer,
    calcLineHeight,
    createSvgElement,
    isArray,
    isString,
    toFontString,
    toPlainText,
} from 'ag-charts-core';
import type { FontStyle, FontWeight, Opacity, Padding, PixelSize, TextSegment } from 'ag-charts-types';

import { Debug } from '../../util/debug';
import { mergeDefaults } from '../../util/object';
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
    static readonly className = 'Text';

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
        opts: { font: string | FontOptions; textAlign: CanvasTextAlign; textBaseline: CanvasTextBaseline }
    ): BBox {
        const { font, textAlign, textBaseline } = opts;
        const { width, height, lineBounds } = cachedTextMeasurer(font).measureLines(lines);
        const offsetTop =
            textBaseline === 'alphabetic' ? lineBounds[0].ascent : Text.getVerticalModifier(textBaseline) * height;
        const offsetLeft = width * Text.getHorizontalModifier(textAlign);

        return new BBox(x - offsetLeft, y - offsetTop, width, height);
    }

    private static getHorizontalModifier(textAlign?: CanvasTextAlign): number {
        switch (textAlign) {
            case 'center':
                return 0.5;
            case 'right':
            case 'end':
                return 1;
            default:
                return 0;
        }
    }

    private static getVerticalModifier(textBaseline?: CanvasTextBaseline): number {
        switch (textBaseline) {
            case 'middle':
                return 0.5;
            case 'bottom':
                return 1;
            default:
                return 0;
        }
    }

    protected override computeBBox(): BBox {
        this.generateTextMap();
        if (this.textMap?.size) {
            const bbox = BBox.merge(this.textMap.values());
            bbox.x = this.x;
            bbox.y = this.y;
            return bbox;
        }
        const { x, y, lines, textBaseline, textAlign } = this;
        const measuredTextBounds = Text.computeBBox(lines, x, y, { font: this, textBaseline, textAlign });
        if (this.boxing != null) measuredTextBounds.grow(this.boxPadding);
        return measuredTextBounds;
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

        let index = 0;
        let totalWidth = 0;
        let offsetY = 0;
        const mainStyle = {
            fill: this.fill,
            fontSize: this.fontSize,
            fontFamily: this.fontFamily,
            fontStyle: this.fontStyle,
            fontWeight: this.fontWeight,
        };

        for (const textNode of this.richText!.children() as Iterable<Text>) {
            const { color, ...textSegment } = this.text[index++];
            textNode.x = 0;
            textNode.y = 0;
            textNode.setProperties(mergeDefaults({ fill: color }, textSegment, mainStyle));
            const textBBox = textNode.getBBox();
            this.textMap.set(textNode, textBBox);
            offsetY = Math.max(
                offsetY,
                textBBox.y + textBBox.height / 2 + (textNode.lineHeight ?? calcLineHeight(textNode.fontSize))
            );
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
            const { width } = this.richText!.getBBox();

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

            ctx.save();
            ctx.translate(translateX, this.y);
            this.richText!.render(renderCtx);
            ctx.restore();
        } else {
            this.renderText(renderCtx);
        }

        if (Text.debug.check() && !this.textMap?.size) {
            const bbox = this.getBBox();
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
        const font = toFontString(this);
        // Try to avoid this assignment, which typically always incurs a font switch cost.
        if (ctx.font !== font) {
            ctx.font = font;
        }

        const { textAlign, textBaseline } = this;

        ctx.textAlign = textAlign;
        ctx.textBaseline = textBaseline;

        if (this.boxing) {
            // Use the static version of computeBBox instead of dynamic version. The `boxing: Rect` shape is drawn using
            // the same matrix transformation of the text, so we want to ignore translation/rotation/scale
            // transformations from derived classes. We only need to measure the width/height of the untransformed text
            const textBBox = Text.computeBBox(this.lines, this.x, this.y, { font: this, textBaseline, textAlign });
            if (textBBox.width !== 0 && textBBox.height !== 0) {
                const { x, y, width, height } = textBBox.grow(this.boxPadding);
                this.boxing.opacity = this.opacity;
                this.boxing.x = x;
                this.boxing.y = y;
                this.boxing.width = width;
                this.boxing.height = height;
                this.boxing.preRender(renderCtx);
                this.boxing.render(renderCtx);
            }
        }

        this.fillStroke(ctx);
    }

    protected override executeFill(ctx: CanvasRenderingContext2D) {
        this.renderLines((line, x, y) => ctx.fillText(line, x, y));
    }

    protected override executeStroke(ctx: CanvasRenderingContext2D) {
        this.renderLines((line, x, y) => ctx.strokeText(line, x, y));
    }

    private renderLines(renderCallback: (line: string, x: number, y: number) => void): void {
        const { x, y } = this;
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        const { lines, fontSize, lineHeight = calcLineHeight(fontSize) } = this;

        let offsetY =
            lines.length > 1 ? Text.getVerticalModifier(this.textBaseline) * (lineHeight * (1 - lines.length)) : 0;
        for (const line of lines) {
            renderCallback(line, x, y + offsetY);
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
