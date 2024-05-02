export function createCanvasContext(width = 0, height = 0) {
    return new OffscreenCanvas(width, height).getContext('2d') as unknown as CanvasRenderingContext2D;
}
