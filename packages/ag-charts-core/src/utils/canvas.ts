import { getOffscreenCanvas } from './dom/globalsProxy';

export function createCanvasContext(width = 0, height = 0) {
    const OffscreenCanvasCtor = getOffscreenCanvas();
    return new OffscreenCanvasCtor(width, height).getContext('2d') as unknown as CanvasRenderingContext2D;
}
