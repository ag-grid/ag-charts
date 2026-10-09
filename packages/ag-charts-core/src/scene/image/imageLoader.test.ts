import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ImageLoader } from './imageLoader';

// Stub the HTMLImageElement constructor so the test can control onload/onerror timing
// independently of the host (jsdom doesn't reliably fire error for non-resolvable URLs).
interface ImageStub {
    onload?: () => void;
    onerror?: () => void;
    src: string;
}

describe('ImageLoader', () => {
    let constructedImages: ImageStub[];
    let originalImage: typeof Image;

    beforeEach(() => {
        constructedImages = [];
        originalImage = globalThis.Image;
        (globalThis as any).Image = class implements ImageStub {
            onload?: () => void;
            onerror?: () => void;
            private _src = '';
            get src() {
                return this._src;
            }
            set src(value: string) {
                this._src = value;
                constructedImages.push(this);
            }
        };
    });

    afterEach(() => {
        (globalThis as any).Image = originalImage;
    });

    async function flushMicrotasks() {
        for (let i = 0; i < 5; i++) {
            await Promise.resolve();
        }
    }

    it('retries the fetch on a subsequent loadImage call when the previous load failed', async () => {
        const loader = new ImageLoader();
        const node1 = { markDirty: vi.fn() };

        loader.loadImage('https://example.test/icon.png', node1);
        await flushMicrotasks();
        expect(constructedImages).toHaveLength(1);

        // Simulate the network/decoding failure.
        constructedImages[0].onerror!();

        // A subsequent caller for the same URL should trigger a fresh fetch attempt, not
        // silently return `undefined` from a poisoned cache entry that can never resolve.
        const node2 = { markDirty: vi.fn() };
        loader.loadImage('https://example.test/icon.png', node2);
        await flushMicrotasks();

        expect(constructedImages).toHaveLength(2);
    });

    it('notifies the retry caller when the second attempt succeeds', async () => {
        const loader = new ImageLoader();
        const node1 = { markDirty: vi.fn() };

        loader.loadImage('https://example.test/icon.png', node1);
        await flushMicrotasks();
        constructedImages[0].onerror!();

        const node2 = { markDirty: vi.fn() };
        loader.loadImage('https://example.test/icon.png', node2);
        await flushMicrotasks();

        // Second attempt succeeds — the retry caller's node must be told to redraw.
        constructedImages[1].onload!();
        expect(node2.markDirty).toHaveBeenCalledTimes(1);
    });
});
