import type { FontFamily, FontSize, FontStyle, FontWeight } from '../../options/chart/types';
import { createElement } from '../../util/dom';
import { memoizeFunction } from '../../util/memo';
import { isString } from '../../util/type-guards';
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

function SceneFontChangeDetection(opts?: { redraw?: RedrawType; changeCb?: (t: any) => any }) {
    const { redraw = RedrawType.MAJOR, changeCb } = opts ?? {};

    return SceneChangeDetection({ redraw, type: 'font', changeCb });
}

export class Text extends Shape {
    static readonly className = 'Text';

    static override defaultStyles = Object.assign({}, Shape.defaultStyles, {
        textAlign: 'start' as CanvasTextAlign,
        fontStyle: undefined,
        fontWeight: undefined,
        fontSize: 10,
        fontFamily: 'sans-serif',
        textBaseline: 'alphabetic' as CanvasTextBaseline,
    });

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

    private _dirtyFont: boolean = true;
    private _font?: string;
    get font(): string {
        if (this._font == null || this._dirtyFont) {
            this._dirtyFont = false;
            this._font = getFont(this);
        }

        return this._font;
    }

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
        const { x, y, lines, lineHeight, textBaseline, textAlign } = this;
        const { top, left, width, height } = Text.getTextSizeMultiline(
            lines,
            getFont(this),
            textBaseline,
            textAlign,
            lineHeight
        );

        return new BBox(x - left, y - top, width, height);
    }

    private getLineHeight(line: string): number {
        if (this.lineHeight) {
            return this.lineHeight;
        }

        const metrics: any = Text.measureText(line, this.font, this.textBaseline, this.textAlign);
        return (
            // Fallback to emHeightAscent + emHeightDescent is needed for server-side rendering.
            (metrics.fontBoundingBoxAscent ?? metrics.emHeightAscent) +
            (metrics.fontBoundingBoxDescent ?? metrics.emHeightDescent)
        );
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

        ctx.font = this.font;
        ctx.textAlign = this.textAlign;
        ctx.textBaseline = this.textBaseline;

        const pixelRatio = this.layerManager.canvas.pixelRatio || 1;
        const { globalAlpha } = ctx;

        if (fill) {
            ctx.fillStyle = fill;
            ctx.globalAlpha = globalAlpha * this.opacity * this.fillOpacity;

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
            ctx.globalAlpha = globalAlpha * this.opacity * this.strokeOpacity;

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
        const lineHeights = lines.map((line) => this.getLineHeight(line));
        const totalHeight = lineHeights.reduce((a, b) => a + b, 0);
        let offsetY: number = (lineHeights[0] - totalHeight) * Text.getVerticalModifier(this.textBaseline);

        for (let i = 0; i < lines.length; i++) {
            renderCallback(lines[i], x, y + offsetY);

            offsetY += lineHeights[i];
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

    protected static getVerticalModifier(textBaseline: CanvasTextBaseline): number {
        switch (textBaseline) {
            case 'top':
            case 'hanging':
                return 0;
            case 'bottom':
            case 'alphabetic':
            case 'ideographic':
                return 1;
            case 'middle':
                return 0.5;
        }
    }

    // 2D canvas context used for measuring text.
    private static _textContext: CanvasRenderingContext2D;

    private static get textContext() {
        if (!this._textContext) {
            const canvasElement = createElement('canvas');
            canvasElement.width = 0;
            canvasElement.height = 0;
            this._textContext = canvasElement.getContext('2d')!;
        }
        return this._textContext;
    }

    private static _measureText = memoizeFunction(
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
        }) => {
            const ctx = this.textContext;

            // optimisation, don't simplify
            if (ctx.font !== font) {
                ctx.font = font;
            }
            if (ctx.textBaseline !== textBaseline) {
                ctx.textBaseline = textBaseline;
            }
            if (ctx.textAlign !== textAlign) {
                ctx.textAlign = textAlign;
            }

            return ctx.measureText(text);
        }
    );

    private static _getTextSize = memoizeFunction(({ text, font }: { text: string; font: string }) => {
        const ctx = this.textContext;
        // optimisation, don't simplify
        if (ctx.font !== font) {
            ctx.font = font;
        }
        const metrics = ctx.measureText(text);

        return {
            width: metrics.width,
            height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
        };
    });

    static measureText(
        text: string,
        font: string,
        textBaseline: CanvasTextBaseline,
        textAlign: CanvasTextAlign
    ): TextMetrics {
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
        textAlign: CanvasTextAlign = Text.defaultStyles.textAlign,
        lineHeight?: number
    ): { top: number; left: number; width: number; height: number } {
        let top = 0;
        let left = 0;
        let width = 0;
        let height = 0;

        // Distance between first and last baselines.
        let baselineDistance = 0;

        for (const [i, text] of lines.entries()) {
            const metrics: any = this._measureText({ text, font, textBaseline, textAlign });

            left = Math.max(left, metrics.actualBoundingBoxLeft);
            width = Math.max(width, metrics.width);

            if (i == 0) {
                top += metrics.actualBoundingBoxAscent;
                height += metrics.actualBoundingBoxAscent;
            } else {
                // Fallback to emHeightAscent + emHeightDescent is needed for server-side rendering.
                baselineDistance += metrics.fontBoundingBoxAscent ?? metrics.emHeightAscent;
            }

            if (i == lines.length - 1) {
                height += metrics.actualBoundingBoxDescent;
            } else {
                // Fallback to emHeightAscent + emHeightDescent is needed for server-side rendering.
                baselineDistance += metrics.fontBoundingBoxDescent ?? metrics.emHeightDescent;
            }
        }

        if (lineHeight != null) {
            baselineDistance = (lines.length - 1) * lineHeight;
        }
        height += baselineDistance;

        top += baselineDistance * Text.getVerticalModifier(textBaseline);

        return { top, left, width, height };
    }
}

export class TextMeasurer {
    protected font: string;

    constructor(font: string | TextSizeProperties) {
        this.font = isString(font) ? font : getFont(font);
    }

    size(text: string) {
        return text.includes('\n')
            ? Text.getTextSizeMultiline(
                  text.split('\n').map((s) => s.trim()),
                  this.font
              )
            : Text.getTextSize(text, this.font);
    }

    width(text: string): number {
        const { width } = this.size(text);
        return width;
    }
}

export function getFont(fontProps: TextSizeProperties): string {
    const { fontFamily, fontSize, fontStyle, fontWeight } = fontProps;
    return [fontStyle ?? '', fontWeight ?? '', fontSize + 'px', fontFamily].join(' ').trim();
}
