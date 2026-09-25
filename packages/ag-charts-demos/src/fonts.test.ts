import { afterEach, describe, expect, it, vi } from 'vitest';

import { FONT_LOAD_TIMEOUT_MS, beforeFirstRender, waitForDeclaredFonts } from './fonts';

// The tests run in Node, where there is no document: each case installs a stand-in for the
// FontFaceSet with the faces a stylesheet would have declared.
interface FakeFace {
    family: string;
    weight: string;
    style: string;
}

function installFonts(faces: FakeFace[], load: (spec: string) => Promise<unknown>) {
    const fonts = {
        forEach: (callback: (face: FakeFace) => void) => faces.forEach((face) => callback(face)),
        load: vi.fn(load),
    };
    vi.stubGlobal('document', { fonts });
    return fonts;
}

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.useRealTimers();
});

// The wait exists for the parity harness, which needs a first layout in the final fonts; a visitor
// gets the same chart once the font arrives, so a normal load must not be held back for it.
describe('beforeFirstRender', () => {
    const faces = [{ family: 'Urbanist', weight: '400', style: 'normal' }];

    it('never touches the fonts on a normal load', async () => {
        const fonts = installFonts(faces, () => new Promise(() => {}));
        vi.stubGlobal('window', { location: { search: '' } });
        await expect(beforeFirstRender()).resolves.toBeUndefined();
        expect(fonts.load).not.toHaveBeenCalled();
    });

    it('waits for the declared fonts with ?deterministic=1 in the URL', async () => {
        const fonts = installFonts(faces, () => Promise.resolve([]));
        vi.stubGlobal('window', { location: { search: '?deterministic=1' } });
        await beforeFirstRender();
        expect(fonts.load).toHaveBeenCalledWith('16px "Urbanist"');
    });

    it('waits for the declared fonts in a build with VITE_DEMO_DETERMINISTIC=1', async () => {
        const fonts = installFonts(faces, () => Promise.resolve([]));
        vi.stubEnv('VITE_DEMO_DETERMINISTIC', '1');
        await beforeFirstRender();
        expect(fonts.load).toHaveBeenCalledWith('16px "Urbanist"');
    });

    it('ignores the switch set to anything but 1 or true', async () => {
        const fonts = installFonts(faces, () => Promise.resolve([]));
        vi.stubGlobal('window', { location: { search: '?deterministic=0' } });
        await beforeFirstRender();
        expect(fonts.load).not.toHaveBeenCalled();
    });
});

describe('waitForDeclaredFonts', () => {
    it('resolves at once with no document, no FontFaceSet or no declared faces', async () => {
        await expect(waitForDeclaredFonts()).resolves.toBeUndefined();

        vi.stubGlobal('document', {});
        await expect(waitForDeclaredFonts()).resolves.toBeUndefined();

        const fonts = installFonts([], () => Promise.resolve([]));
        await expect(waitForDeclaredFonts()).resolves.toBeUndefined();
        expect(fonts.load).not.toHaveBeenCalled();
    });

    it('loads the default face of each declared family once, whatever its weights, styles and subsets', async () => {
        const fonts = installFonts(
            [
                { family: 'Urbanist', weight: '400 700', style: 'normal' },
                { family: 'Urbanist', weight: '400 700', style: 'normal' },
                { family: '"Red Hat Text"', weight: '300 700', style: 'italic' },
                { family: '"Red Hat Text"', weight: '300 700', style: 'normal' },
                { family: 'Inter', weight: '500', style: 'normal' },
                { family: 'Inter', weight: '600', style: 'normal' },
            ],
            () => Promise.resolve([])
        );
        await waitForDeclaredFonts();
        expect(fonts.load.mock.calls.map(([spec]) => spec)).toEqual([
            '16px "Urbanist"',
            '16px "Red Hat Text"',
            '16px "Inter"',
        ]);
    });

    it('waits for every load to settle, a failed load included', async () => {
        let settled = 0;
        installFonts(
            [
                { family: 'Urbanist', weight: '400', style: 'normal' },
                { family: 'Manrope', weight: '500', style: 'normal' },
            ],
            (spec) =>
                new Promise((resolve, reject) =>
                    setTimeout(() => {
                        settled++;
                        if (spec.includes('Manrope')) reject(new Error('offline'));
                        else resolve([]);
                    }, 10)
                )
        );
        await waitForDeclaredFonts();
        expect(settled).toBe(2);
    });

    it('gives up after the timeout when a font never arrives', async () => {
        vi.useFakeTimers();
        installFonts([{ family: 'Urbanist', weight: '400', style: 'normal' }], () => new Promise(() => {}));

        let resolved = false;
        void waitForDeclaredFonts().then(() => (resolved = true));
        await vi.advanceTimersByTimeAsync(FONT_LOAD_TIMEOUT_MS - 1);
        expect(resolved).toBe(false);
        await vi.advanceTimersByTimeAsync(1);
        expect(resolved).toBe(true);
    });
});
