import type * as CanvasUtil from '../rendering/canvasUtil';

/**
 * `canvasUtil` with a canvas that measures every character 10px wide and every line 20px tall, since jsdom has
 * none. Use as `vi.mock('<path>/rendering/canvasUtil', async (importOriginal) => (await import('<path>/test/fixedWidthCanvas')).fixedWidthCanvasUtil(importOriginal))`.
 */
export async function fixedWidthCanvasUtil(importOriginal: <T>() => Promise<T>): Promise<typeof CanvasUtil> {
    const original = await importOriginal<typeof CanvasUtil>();
    return {
        ...original,
        createCanvasContext: (() => ({
            font: '',
            measureText: (text: string) => ({
                width: [...text].length * 10,
                fontBoundingBoxAscent: 16,
                fontBoundingBoxDescent: 4,
                emHeightAscent: 16,
                emHeightDescent: 4,
            }),
        })) as unknown as typeof CanvasUtil.createCanvasContext,
    };
}
