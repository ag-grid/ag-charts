import type { FontFamily, FontSize, FontStyle, FontWeight } from 'ag-charts-types';

import { CachedTextMeasurerPool, type MeasureOptions, TextUtils } from '../../util/textMeasurer';
import { BBox } from '../bbox';
import { nodeCount } from '../debug.util';
import type { RenderContext } from '../node';
import {  SceneChangeDetection } from '../node';
import { Rotatable, Translatable } from '../transformable';
import { Shape } from './shape';

export interface TextSizeProperties {
    fontFamily?: FontFamily;
    fontSize?: FontSize;
    fontStyle?: FontStyle;
    fontWeight?: FontWeight;
    lineHeight?: number;
    textBaseline?: CanvasTextBaseline;
    textAlign?: CanvasTextAlign;
}

export class Text extends Shape {
    static readonly className = 'Text';

    static override readonly defaultStyles = {
        ...Shape.defaultStyles,
        textAlign: 'start' as CanvasTextAlign,
        fontStyle: undefined,
        fontWeight: undefined,
        fontSize: 10,
        fontFamily: 'sans-serif',
        textBaseline: 'alphabetic' as CanvasTextBaseline,
    };

    @SceneChangeDetection()
    x: number = 0;

    @SceneChangeDetection()
    y: number = 0;

    private lines: string[] = [];
    private onTextChange() {
        this.lines = this.text?.split('\n').map((s) => s.trim()) ?? [];
    }

    @SceneChangeDetection({ changeCb: (o: Text) => o.onTextChange() })
    text?: string = undefined;

    @SceneChangeDetection()
    fontStyle?: FontStyle;

    @SceneChangeDetection()
    fontWeight?: FontWeight;

    @SceneChangeDetection()
    fontSize?: number = 10;

    @SceneChangeDetection()
    fontFamily?: string = 'sans-serif';

    @SceneChangeDetection()
    textAlign: CanvasTextAlign = Text.defaultStyles.textAlign;

    @SceneChangeDetection()
    textBaseline: CanvasTextBaseline = Text.defaultStyles.textBaseline;

    // TextMetrics are used if lineHeight is not defined.
    @SceneChangeDetection()
    lineHeight?: number;

    static computeBBox(lines: string | string[], x: number, y: number, opts: MeasureOptions): BBox {
        const { offsetTop, offsetLeft, width, height } = CachedTextMeasurerPool.measureLines(lines, opts);
        return new BBox(x - offsetLeft, y - offsetTop, width, height);
    }

    protected override computeBBox(): BBox {
        const { x, y, lines, textBaseline, textAlign } = this;
        return Text.computeBBox(lines, x, y, { font: this, textBaseline, textAlign });
    }

    isPointInPath(x: number, y: number): boolean {
        const bbox = this.getBBox();

        return bbox ? bbox.containsPoint(x, y) : false;
    }

    override render(renderCtx: RenderContext): void {
        const { ctx, stats } = renderCtx;

        if (!this.lines.length || !this.layerManager) {
            if (stats) stats.nodesSkipped += nodeCount(this).count;
            return;
        }

        const { fill, stroke, strokeWidth } = this;
        const { pixelRatio } = this.layerManager.canvas;

        ctx.font = TextUtils.toFontString(this);
        ctx.textAlign = this.textAlign;
        ctx.textBaseline = this.textBaseline;

        if (fill) {
            this.applyFill(ctx);
            ctx.globalAlpha *= this.opacity * this.fillOpacity;

            const { fillShadow } = this;

            if (fillShadow?.enabled) {
                ctx.shadowColor = fillShadow.color;
                ctx.shadowOffsetX = fillShadow.xOffset * pixelRatio;
                ctx.shadowOffsetY = fillShadow.yOffset * pixelRatio;
                ctx.shadowBlur = fillShadow.blur * pixelRatio;
            }

            this.renderLines((line, x, y) => ctx.fillText(line, x, y));
        }

        if (stroke && strokeWidth) {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = strokeWidth;
            ctx.globalAlpha *= this.opacity * this.strokeOpacity;

            const { lineDash, lineDashOffset, lineCap, lineJoin } = this;

            if (lineDash) {
                ctx.setLineDash(lineDash);
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

            this.renderLines((line, x, y) => ctx.strokeText(line, x, y));
        }

        super.render(renderCtx);
    }

    private renderLines(renderCallback: (line: string, x: number, y: number) => void): void {
        const { lines, x, y } = this;
        const lineHeight = this.lineHeight ?? TextUtils.getLineHeight(this.fontSize!);
        let offsetY = (lineHeight - lineHeight * lines.length) * TextUtils.getVerticalModifier(this.textBaseline);

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

    override toSVG(): { elements: SVGElement[]; defs?: SVGElement[] } | undefined {
        if (!this.visible || !this.text) return;

        const element = document.createElementNS('http://www.w3.org/2000/svg', 'text');

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
