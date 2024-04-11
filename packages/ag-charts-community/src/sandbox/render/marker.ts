export class Marker {
    private canvas: OffscreenCanvas;
    protected ctx: CanvasRenderingContext2D; // OffscreenRenderingContext is buggy in TS 4.9.5

    constructor(size: number) {
        this.canvas = new OffscreenCanvas(size, size);
        this.ctx = this.canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
    }

    takeSnapshot() {}
}
