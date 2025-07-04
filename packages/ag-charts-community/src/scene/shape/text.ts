import { createSvgElement, isDefined } from 'ag-charts-core';
import type { CssColor, FontFamily, FontSize, FontStyle, FontWeight, Opacity, PixelSize, Ratio } from 'ag-charts-types';

import { objectsEqual } from '../../module-support';
import { Debug } from '../../util/debug';
import { CachedTextMeasurerPool, type MeasureOptions, TextUtils } from '../../util/textMeasurer';
import { BBox } from '../bbox';
import { SceneObjectChangeDetection } from '../changeDetectable';
import type { RenderContext } from '../node';
import { SceneChangeDetection } from '../node';
import { DebugSelectors } from '../sceneDebug';
import { Rotatable, Translatable } from '../transformable';
import { Shape, type ShapeColor } from './shape';

export interface TextSizeProperties {
    fontFamily?: FontFamily;
    fontSize?: FontSize;
    fontStyle?: FontStyle;
    fontWeight?: FontWeight;
    lineHeight?: number;
    textBaseline?: CanvasTextBaseline;
    textAlign?: CanvasTextAlign;
}

// @todo() - Workaround for subclassing
let externUseGlyphIndependentMeasurements = false;

export class Text<D = any> extends Shape<D> {
    static readonly className = 'Text';

    private static readonly debug = Debug.create(true, DebugSelectors.SCENE_TEXT);

    private static readonly defaultFontSize = 10;

    @SceneChangeDetection()
    x: number = 0;

    @SceneChangeDetection()
    y: number = 0;

    private lines: string[] = [];
    private onTextChange() {
        this.lines = this.text?.split('\n').map((s) => s.trim()) ?? [];
    }

    @SceneChangeDetection({
        convertor: (value) => (isDefined(value) ? String(value) : value),
        changeCb: (o: Text) => o.onTextChange(),
    })
    text?: string = undefined;

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

    @SceneChangeDetection()
    boxCornerRadius?: Ratio;

    @SceneChangeDetection()
    boxPadding?: PixelSize;

    @SceneObjectChangeDetection({ equals: objectsEqual, changeCb: (t: Text) => t.onFillChange() })
    boxFill?: ShapeColor;

    @SceneChangeDetection()
    boxFillOpacity?: Opacity;

    @SceneChangeDetection()
    boxStroke?: CssColor;

    @SceneChangeDetection()
    boxStrokeWidth?: PixelSize;

    @SceneChangeDetection()
    boxStrokeOpacity?: Opacity;

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
            textBaseline = 'alphabetic',
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
        const { x, y, lines, textBaseline, textAlign, lineHeight } = this;
        const bbox = Text.computeBBox(
            lines,
            x,
            y,
            { font: this, textBaseline, textAlign, lineHeight },
            useGlyphIndependentMeasurements
        );
        return bbox;
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

    override render(renderCtx: RenderContext): void {
        const { ctx, stats } = renderCtx;

        if (!this.lines.length || !this.layerManager) {
            if (stats) stats.nodesSkipped += 1;
            return super.render(renderCtx);
        }

        const {
            fill,
            stroke,
            strokeWidth,
            boxFill,
            boxFillOpacity = 1,
            boxCornerRadius,
            boxStroke,
            boxStrokeWidth = 1,
            boxStrokeOpacity = 1,
            boxPadding = 0,
        } = this;
        const { globalAlpha } = ctx;
        const { pixelRatio } = this.layerManager.canvas;

        if (!fill && !(stroke != null && strokeWidth > 0)) {
            // Short circuit early if nothing will be rendered.
            return super.render(renderCtx);
        }

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

        if (boxFill != null || boxStroke != null) {
            const { x, y, width, height } = this.getBBox(true).grow(boxPadding);
            const maxRadius = Math.min(width, height) / 2;
            const radius = Math.min(boxCornerRadius ?? 0, maxRadius);

            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.arcTo(x + width, y, x + width, y + radius, radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
            ctx.lineTo(x + radius, y + height);
            ctx.arcTo(x, y + height, x, y + height - radius, radius);
            ctx.lineTo(x, y + radius);
            ctx.arcTo(x, y, x + radius, y, radius);
            ctx.closePath();

            if (boxFill) {
                ctx.fillStyle = boxFill as string; // TODO: gradients, images and etc..
                ctx.globalAlpha = boxFillOpacity;
                ctx.fill();
            }

            if (boxStroke) {
                ctx.strokeStyle = boxStroke;
                ctx.lineWidth = boxStrokeWidth;
                ctx.globalAlpha = boxStrokeOpacity;
                ctx.stroke();
            }

            ctx.globalAlpha = globalAlpha;
        }

        if (fill) {
            this.applyFillAndAlpha(ctx);

            const { fillShadow } = this;

            if (fillShadow?.enabled) {
                ctx.shadowColor = fillShadow.color;
                ctx.shadowOffsetX = fillShadow.xOffset * pixelRatio;
                ctx.shadowOffsetY = fillShadow.yOffset * pixelRatio;
                ctx.shadowBlur = fillShadow.blur * pixelRatio;
            }

            this.renderLines(lineOriginY, lineHeight, (line, x, y) => ctx.fillText(line, x, y));

            ctx.globalAlpha = globalAlpha;
        }

        if (stroke && strokeWidth) {
            this.applyStrokeAndAlpha(ctx);
            ctx.lineWidth = strokeWidth;

            const { lineDash, lineDashOffset, lineCap, lineJoin } = this;

            if (lineDash) {
                ctx.setLineDash([...lineDash]);
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

        if (Text.debug.check()) {
            const bbox = this.getBBox(true);
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 1;
            ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);
        }

        super.render(renderCtx);
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
        this.fontSize = props.fontSize ?? Text.defaultFontSize;
        this.fontStyle = props.fontStyle;
        this.fontWeight = props.fontWeight;
    }

    setAlign(props: { textAlign: CanvasTextAlign; textBaseline: CanvasTextBaseline }) {
        this.textAlign = props.textAlign;
        this.textBaseline = props.textBaseline;
    }

    override toSVG(): { elements: SVGElement[]; defs?: SVGElement[] } | undefined {
        if (!this.visible || !this.text) return;

        const element = createSvgElement('text');

        this.applySvgFillAttributes(element);
        element.setAttribute('font-family', this.fontFamily?.split(',')[0] ?? '');
        element.setAttribute('font-size', String(this.fontSize));
        element.setAttribute('font-style', this.fontStyle ?? '');
        element.setAttribute('font-weight', String(this.fontWeight ?? ''));
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
        element.setAttribute(
            'alignment-baseline',
            {
                alphabetic: 'alphabetic',
                top: 'top',
                bottom: 'bottom',
                hanging: 'hanging',
                middle: 'middle',
                ideographic: 'ideographic',
            }[this.textBaseline ?? 'alphabetic']
        );
        element.setAttribute('x', String(this.x));
        element.setAttribute('y', String(this.y));

        element.textContent = this.text ?? '';

        return { elements: [element] };
    }
}

export class RotatableText extends Rotatable(Text) {}
export class TransformableText extends Rotatable(Translatable(Text)) {}
