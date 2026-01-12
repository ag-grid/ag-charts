import * as path from 'path';
import * as SkiaCanvas from 'skia-canvas';
import { Canvas, DOMMatrix, FontLibrary } from 'skia-canvas';

// Something is causing this to not be imported as a value
const { CanvasRenderingContext2D } = SkiaCanvas as any;

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
    const superCreateConicGradient = CanvasRenderingContext2D.prototype.createConicGradient;
    Object.defineProperty(CanvasRenderingContext2D.prototype, 'createConicGradient', {
        value: function (this: CanvasRenderingContext2D, angle: number, x: number, y: number) {
            return superCreateConicGradient.call(this, angle + Math.PI / 2, x, y);
        },
        writable: true,
        configurable: true,
    });

    Object.defineProperty(CanvasRenderingContext2D.prototype, 'fillText', {
        value: function (this: CanvasRenderingContext2D, text: string, x: number, y: number) {
            // @ts-expect-error Skia api
            let path2d = this.outlineText(text);
            path2d = path2d.transform(new DOMMatrix([1, 0, 0, 1, x, y]));
            this.fill(path2d);
        },
        writable: true,
        configurable: true,
    });
}

export function registerFallbackFonts(fontsDir: string): void {
    FontLibrary.use('Verdana', [path.resolve(fontsDir, 'Arimo-Regular.ttf'), path.resolve(fontsDir, 'Arimo-Bold.ttf')]);
}

// Apply patches on module load
applySkiaPatches();
