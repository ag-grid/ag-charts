import { getDocument, getOffscreenCanvas } from './dom/globalsProxy';

const FONT_PROBE = '16px system-ui, -apple-system, sans-serif';
const FONT_PROBE_TEXT = 'Hamburgefonstiv 0123456789';

let textOffscreenSupported: boolean | undefined;

/**
 * Whether an OffscreenCanvas handles text identically to a document canvas. Firefox resolves the system
 * font keywords against the document, so it does not: text measures narrower than it draws, and text
 * drawn offscreen uses a different face to the rest of the scene.
 */
export function canRenderTextOffscreen(): boolean {
    textOffscreenSupported ??= probeOffscreenFont();
    return textOffscreenSupported;
}

function probeOffscreenFont(): boolean {
    const documentContext = createDocumentContext(0, 0);
    // Without a document there is nothing to diverge from, and nothing else to measure on.
    if (documentContext == null) return true;
    if (typeof getOffscreenCanvas() !== 'function') return false;

    const offscreenContext = createOffscreenContext(0, 0);
    documentContext.font = FONT_PROBE;
    offscreenContext.font = FONT_PROBE;
    return documentContext.measureText(FONT_PROBE_TEXT).width === offscreenContext.measureText(FONT_PROBE_TEXT).width;
}

export function createCanvasContext(width = 0, height = 0): CanvasRenderingContext2D {
    const documentContext = canRenderTextOffscreen() ? null : createDocumentContext(width, height);
    return documentContext ?? createOffscreenContext(width, height);
}

function createDocumentContext(width: number, height: number) {
    const canvasElement = getDocument()?.createElement('canvas');
    if (canvasElement == null) return null;

    canvasElement.width = width;
    canvasElement.height = height;
    // A document can exist without canvas support.
    return canvasElement.getContext('2d');
}

function createOffscreenContext(width: number, height: number): CanvasRenderingContext2D {
    const OffscreenCanvasCtor = getOffscreenCanvas();
    return new OffscreenCanvasCtor(width, height).getContext('2d') as unknown as CanvasRenderingContext2D;
}
