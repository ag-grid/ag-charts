import type { FontFamily, FontSize, FontStyle, FontWeight } from 'ag-charts-types';

import { memoizeFunction } from '../../util/memo';
import { TextMeasurer } from '../../util/textMeasurer';
import { BBox } from '../bbox';
import type { RenderContext } from '../node';
import { RedrawType, SceneChangeDetection } from '../node';
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

const ellipsis = '\u2026';

function SceneFontChangeDetection(opts?: { redraw?: RedrawType; changeCb?: (t: any) => any }) {
    const { redraw = RedrawType.MAJOR, changeCb } = opts ?? {};

    return SceneChangeDetection({ redraw, type: 'font', changeCb });
}

export class Text extends Shape {
    static readonly className = 'Text';

    // The default line spacing for document editors is usually 1.15
    static defaultLineHeightRatio = 1.15;

    static override defaultStyles = Object.assign({}, Shape.defaultStyles, {
        textAlign: 'start' as CanvasTextAlign,
        fontStyle: undefined,
        fontWeight: undefined,
        fontSize: 10,
        fontFamily: 'sans-serif',
        textBaseline: 'alphabetic' as CanvasTextBaseline,
    });

    static ellipsis = ellipsis;

    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    x: number = 0;

    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    y: number = 0;

    private lines: string[] = [];
    private onTextChange() {
        this.lines = this.text?.split('\n').map((s) => s.trim()) ?? [];
    }

    @SceneChangeDetection({ redraw: RedrawType.MAJOR, changeCb: (o: Text) => o.onTextChange() })
    text?: string = undefined;

    @SceneFontChangeDetection()
    fontStyle?: FontStyle;

    @SceneFontChangeDetection()
    fontWeight?: FontWeight;

    @SceneFontChangeDetection()
    fontSize?: number = 10;

    @SceneFontChangeDetection()
    fontFamily?: string = 'sans-serif';

    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    textAlign: CanvasTextAlign = Text.defaultStyles.textAlign;

    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    textBaseline: CanvasTextBaseline = Text.defaultStyles.textBaseline;

    // TextMetrics are used if lineHeight is not defined.
    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    lineHeight?: number;

    override computeBBox(): BBox {
        const { x, y, lines, textBaseline, textAlign } = this;
        const { offsetTop, offsetLeft, width, height } = TextMeasurer.measureLines(lines, {
            font: this,
            textBaseline,
            textAlign,
        });
        return new BBox(x - offsetLeft, y - offsetTop, width, height);
    }

    isPointInPath(x: number, y: number): boolean {
        const point = this.transformPoint(x, y);
        const bbox = this.computeBBox();

        return bbox ? bbox.containsPoint(point.x, point.y) : false;
    }

    override render(renderCtx: RenderContext): void {
        const { ctx, forceRender, stats } = renderCtx;

        if (this.dirty === RedrawType.NONE && !forceRender) {
            if (stats) stats.nodesSkipped += this.nodeCount.count;
            return;
        }

        if (!this.lines.length || !this.layerManager) {
            if (stats) stats.nodesSkipped += this.nodeCount.count;
            return;
        }

        this.computeTransformMatrix();
        this.matrix.toContext(ctx);

        const { fill, stroke, strokeWidth } = this;
        const { pixelRatio } = this.layerManager.canvas;

        ctx.font = TextMeasurer.toFontString(this);
        ctx.textAlign = this.textAlign;
        ctx.textBaseline = this.textBaseline;

        if (fill) {
            ctx.fillStyle = fill;
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
        const lineHeight = this.lineHeight ?? TextMeasurer.getLineHeight(this.fontSize!);
        let offsetY = (lineHeight - lineHeight * lines.length) * TextMeasurer.getVerticalModifier(this.textBaseline);

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

    private static readonly _measureText = memoizeFunction(
        ({
            text,
            font,
            textBaseline,
            textAlign,
        }: {
            text: string;
            font: string;
            textBaseline: CanvasTextBaseline;
            textAlign: CanvasTextAlign;
        }) => TextMeasurer.measureText(text, { font, textBaseline, textAlign })
    );

    private static readonly _getTextSize = memoizeFunction(({ text, font }: { text: string; font: string }) =>
        TextMeasurer.measureText(text, { font })
    );

    static measureText(text: string, font: string, textBaseline: CanvasTextBaseline, textAlign: CanvasTextAlign) {
        return this._measureText({ text, font, textBaseline, textAlign });
    }

    /**
     * Returns the width and height of the measured text.
     * @param text The single-line text to measure.
     * @param font The font shorthand string.
     */
    static getTextSize(text: string, font: string) {
        return this._getTextSize({ text, font });
    }

    static getTextSizeMultiline(
        lines: string[],
        font: string,
        textBaseline: CanvasTextBaseline = Text.defaultStyles.textBaseline,
        textAlign: CanvasTextAlign = Text.defaultStyles.textAlign
    ): { top: number; left: number; width: number; height: number } {
        const r = TextMeasurer.measureLines(lines, { font, textBaseline, textAlign });
        return { top: r.offsetTop, left: r.offsetLeft, width: r.width, height: r.height };
    }
}
