import type {
    FillOptions,
    FontOptions,
    LineOptions,
    Ratio,
    StrokeOptions,
    TextOptions,
} from '../sandbox/types/commonTypes';

export interface CanvasContextOptions extends FillOptions, StrokeOptions, LineOptions, FontOptions, TextOptions {
    opacity?: Ratio;
}

export function createCanvasContext(width = 0, height = 0) {
    return new OffscreenCanvas(width, height).getContext('2d') as unknown as CanvasRenderingContext2D;
}

export function applyContextOptions(ctx: CanvasRenderingContext2D, options: CanvasContextOptions) {
    if (options.opacity != null) {
        ctx.globalAlpha *= options.opacity;
    }
    if (options.fill != null && ctx.fillStyle !== options.fill) {
        ctx.fillStyle = options.fill;
    }
    if (options.stroke != null && ctx.strokeStyle !== options.stroke) {
        ctx.strokeStyle = options.stroke;
    }
    if (options.strokeWidth != null && ctx.lineWidth !== options.strokeWidth) {
        ctx.lineWidth = options.strokeWidth;
    }
    if (options.lineDash != null && ctx.getLineDash() !== options.lineDash) {
        ctx.setLineDash(options.lineDash);
    }
    if (options.lineDashOffset != null && ctx.lineDashOffset !== options.lineDashOffset) {
        ctx.lineDashOffset = options.lineDashOffset;
    }
    if (options.lineCap != null && ctx.lineCap !== options.lineCap) {
        ctx.lineCap = options.lineCap;
    }
    if (options.lineJoin != null && ctx.lineJoin !== options.lineJoin) {
        ctx.lineJoin = options.lineJoin;
    }
    if (options.miterLimit != null && ctx.miterLimit !== options.miterLimit) {
        ctx.miterLimit = options.miterLimit;
    }
    if (options.textAlign != null && ctx.textAlign !== options.textAlign) {
        ctx.textAlign = options.textAlign;
    }
    if (options.textBaseline != null && ctx.textBaseline !== options.textBaseline) {
        ctx.textBaseline = options.textBaseline;
    }
    if (
        options.fontStyle != null ||
        options.fontWeight != null ||
        options.fontSize != null ||
        options.fontFamily != null
    ) {
        const font = toFont(options);
        if (ctx.font !== font) {
            ctx.font = font;
        }
    }
}

export function toFont(fontProps: FontOptions): string {
    const { fontStyle, fontWeight, fontSize, fontFamily } = fontProps;
    return [fontStyle, fontWeight, fontSize + 'px', fontFamily].filter(Boolean).join(' ').trim();
}
