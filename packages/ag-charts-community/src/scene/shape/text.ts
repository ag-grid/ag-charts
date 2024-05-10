import type {
    FontFamily,
    FontSize,
    FontStyle,
    FontWeight,
    OverflowStrategy,
    TextWrap,
} from '../../options/chart/types';
import { memoizeFunction } from '../../util/memo';
import { type LineMetrics, TextMeasurer } from '../../util/textMeasurer';
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
        const { x, y, lines, textBaseline, textAlign } = this;
        const { offsetTop, offsetLeft, width, height } = TextMeasurer.measureLines(lines, {
            font: getFont(this),
            textBaseline,
            textAlign,
        });
        return new BBox(x - offsetLeft, y - offsetTop, width, height);
    }

    private getLineHeight(line: string): number {
        return this.lineHeight ?? (TextMeasurer.measureText(line, this) as LineMetrics).lineHeight;
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

        ctx.font = this.font;
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
        const lineHeights = lines.map((line) => this.getLineHeight(line));
        const totalHeight = lineHeights.reduce((a, b) => a + b, 0);
        let offsetY: number = (lineHeights[0] - totalHeight) * Text.getVerticalModifier(this.textBaseline);

        for (let i = 0; i < lines.length; i++) {
            renderCallback(lines[i], x, y + offsetY);
            offsetY += lineHeights[i];
        }
    }

    static wrapLines(
        text: string,
        maxWidth: number,
        maxHeight: number,
        textProps: TextSizeProperties,
        wrapping: TextWrap,
        overflow: OverflowStrategy
    ): string[] | undefined {
        const result = TextMeasurer.wrapLines(text, {
            maxWidth,
            maxHeight,
            font: getFont(textProps),
            textAlign: textProps.textAlign,
            textBaseline: textProps.textBaseline,
            textWrap: wrapping,
        });
        if (overflow === 'hide' && result.some((l) => l.endsWith(TextMeasurer.EllipsisChar))) {
            return;
        }
        return result;
    }

    static wrap(
        text: string,
        maxWidth: number,
        maxHeight: number,
        textProps: TextSizeProperties,
        wrapping: TextWrap,
        overflow: OverflowStrategy = 'ellipsis'
    ): string {
        const lines = Text.wrapLines(text, maxWidth, maxHeight, textProps, wrapping, overflow);
        return lines?.join('\n').trim() ?? '';
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

export function getFont(fontProps: TextSizeProperties): string {
    const { fontFamily, fontSize, fontStyle, fontWeight } = fontProps;
    return [fontStyle ?? '', fontWeight ?? '', fontSize + 'px', fontFamily].join(' ').trim();
}
