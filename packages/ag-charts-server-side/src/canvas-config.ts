import * as SkiaCanvas from 'skia-canvas';
import { Canvas, DOMMatrix } from 'skia-canvas';

// skia-canvas exports CanvasRenderingContext2D as a class but TypeScript types don't reflect this
const { CanvasRenderingContext2D } = SkiaCanvas as typeof SkiaCanvas & {
    CanvasRenderingContext2D: { prototype: CanvasRenderingContext2D & { outlineText(text: string): Path2D } };
};

export class NodeCanvas extends Canvas {
    constructor(width: number, height: number) {
        super(width, height);
        this.gpu = false;
    }

    override toBuffer(format: SkiaCanvas.ExportFormat, options?: SkiaCanvas.RenderOptions): Promise<Buffer> {
        // @ts-expect-error Incorrect types
        return super.toBuffer(format, { ...options, msaa: false });
    }

    transferToImageBitmap(): Canvas {
        const { width, height } = this;
        const bitmap = new NodeCanvas(Math.max(1, width), Math.max(1, height));
        if (width > 0 && height > 0) {
            try {
                bitmap.getContext('2d').drawCanvas(this, 0, 0, width, height);
            } catch {
                // Skia-canvas can throw dimensionless errors even when width/height checks pass
            }
        }
        Object.defineProperty(bitmap, 'close', {
            // no-op
            value: () => {},
        });
        return bitmap;
    }
}

let patchesApplied = false;
export function applySkiaPatches(): void {
    if (patchesApplied) return;
    patchesApplied = true;

    // https://github.com/samizdatco/skia-canvas/issues/241
    const superCreateConicGradient = CanvasRenderingContext2D.prototype.createConicGradient.bind(
        CanvasRenderingContext2D.prototype
    );
    Object.defineProperty(CanvasRenderingContext2D.prototype, 'createConicGradient', {
        value: function (this: CanvasRenderingContext2D, angle: number, x: number, y: number) {
            return superCreateConicGradient.call(this, angle + Math.PI / 2, x, y);
        },
        writable: true,
        configurable: true,
    });

    // skia-canvas Path2D has a transform method that returns a transformed copy
    type SkiaPath2D = Path2D & { transform(matrix: DOMMatrix): SkiaPath2D };

    Object.defineProperty(CanvasRenderingContext2D.prototype, 'fillText', {
        value: function (
            this: CanvasRenderingContext2D & { outlineText(text: string): SkiaPath2D },
            text: string,
            x: number,
            y: number
        ) {
            let path2d = this.outlineText(text);
            path2d = path2d.transform(new DOMMatrix([1, 0, 0, 1, x, y]));
            this.fill(path2d);
        },
        writable: true,
        configurable: true,
    });
}

// Apply patches on module load
applySkiaPatches();
