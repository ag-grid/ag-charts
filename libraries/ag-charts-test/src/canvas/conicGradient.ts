import { Canvas, type CanvasRenderingContext2D as NodeCanvasRenderingContext2D } from 'canvas';

interface ColorStop {
    offset: number;
    color: string;
}

function parseColor(input: string): number[] {
    if (input.startsWith('#')) {
        const parts: number[] = [];

        const delta = input.length < 6 ? 1 : 2;
        for (let i = 1; i < input.length; i += delta) {
            const part = input.slice(i, i + delta);
            const value = parseInt(part, 16);
            if (delta === 1) {
                parts.push(value + value * 16);
            } else {
                parts.push(value);
            }
        }

        return parts;
    } else if (input.startsWith('rgb')) {
        const rgba = Array.from(input.matchAll(/[\d.]+/g), (match) => Number(match[0]));

        if (rgba.length === 3) {
            return [rgba[0], rgba[1], rgba[2]];
        } else if (rgba.length === 4) {
            return [rgba[0], rgba[1], rgba[2], rgba[3]];
        }
    }

    throw new Error(`Failed to parse "${input}"`);
}

export class ConicGradient {
    colorStops: ColorStop[] = [];

    constructor(
        private ctx: NodeCanvasRenderingContext2D,
        private startAngle: number,
        private cx: number,
        private cy: number
    ) {}

    addColorStop(offset: number, color: string) {
        this.colorStops.push({ offset, color });
    }

    createPattern() {
        const { ctx, colorStops, startAngle, cx, cy } = this;
        const { width, height } = ctx.canvas;

        const externalCanvas = new Canvas(width, height);
        const externalCtx = externalCanvas.getContext('2d');
        const imageData = externalCtx.getImageData(0, 0, width, height);

        const resolvedColors = colorStops.map(({ offset, color }) => {
            const [r, g, b] = parseColor(color);
            return { offset, r, g, b };
        });

        for (let x = 0; x < imageData.width; x += 1) {
            for (let y = 0; y < imageData.height; y += 1) {
                const i = (y * imageData.width + x) * 4;

                const angle = Math.atan2(y - cy, x - cx);
                let offset = (angle - startAngle) / (2 * Math.PI);
                offset = ((offset % 1) + 1) % 1;
                const colorStopBefore = resolvedColors.findLast((c) => c.offset < offset) ?? resolvedColors.at(0)!;
                const colorStopAfter = resolvedColors.find((c) => c.offset > offset) ?? resolvedColors.at(-1)!;

                const offsetRange = colorStopAfter.offset - colorStopBefore.offset;
                const delta =
                    offsetRange > 0
                        ? (offset - colorStopBefore.offset) / (colorStopAfter.offset - colorStopBefore.offset)
                        : 0;
                const r = colorStopBefore.r * (1 - delta) + colorStopAfter.r * delta;
                const g = colorStopBefore.g * (1 - delta) + colorStopAfter.g * delta;
                const b = colorStopBefore.b * (1 - delta) + colorStopAfter.b * delta;

                imageData.data[i + 0] = r;
                imageData.data[i + 1] = g;
                imageData.data[i + 2] = b;
                imageData.data[i + 3] = 255;
            }
        }

        externalCtx.putImageData(imageData, 0, 0);

        return ctx.createPattern(externalCanvas, 'repeat');
    }
}
