import type * as CanvasUtil from '../rendering/canvasUtil';

/**
 * `canvasUtil` with a canvas that measures every character 10px wide and every line 20px tall, since jsdom has
 * none. Return it from the `vi.mock` factory for `rendering/canvasUtil`, passing the factory's `importOriginal`.
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
