import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LicenseManager } from './licenseManager';

// The suite-wide mock stands in for this module everywhere else; these tests need the real one.
vi.unmock('./licenseManager');

type FakeWindow = { location?: { hostname: string }; top?: FakeWindow | null };

function documentIn(win: FakeWindow | null): Document {
    return { defaultView: win } as unknown as Document;
}

function windowAt(hostname: string, top?: FakeWindow): FakeWindow {
    const win: FakeWindow = { location: { hostname } };
    win.top = top ?? win;
    return win;
}

// `location` on a cross-origin window throws on access.
function crossOriginWindow(): FakeWindow {
    return {
        get location(): { hostname: string } {
            throw new DOMException('Blocked a frame from accessing a cross-origin frame.', 'SecurityError');
        },
    };
}

describe('LicenseManager', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        LicenseManager.setLicenseKey();
    });

    afterEach(() => {
        LicenseManager.setLicenseKey();
        vi.restoreAllMocks();
    });

    describe('isDisplayWatermark', () => {
        const unlicensedManagerIn = (win: FakeWindow | null) => {
            const manager = new LicenseManager(documentIn(win));
            manager.validateLicense();
            return manager;
        };

        it.each([
            { host: 'a customer host', win: windowAt('app.example.com'), expected: true },
            { host: 'localhost', win: windowAt('localhost'), expected: false },
            { host: '127.0.0.1', win: windowAt('127.0.0.1'), expected: false },
            { host: 'the website', win: windowAt('www.ag-grid.com'), expected: false },
            { host: 'a former e2e allowlist address', win: windowAt('172.17.0.1'), expected: true },
            { host: 'a former e2e allowlist name', win: windowAt('host.docker.internal'), expected: true },
            {
                host: 'a frame with no host under the website',
                win: windowAt('', windowAt('ag-grid.com')),
                expected: false,
            },
            {
                host: 'a frame with no host under a customer host',
                win: windowAt('', windowAt('app.example.com')),
                expected: true,
            },
            {
                host: 'a frame with no host under a cross-origin top',
                win: windowAt('', crossOriginWindow()),
                expected: true,
            },
            { host: 'a top-level document with no host', win: windowAt(''), expected: true },
            { host: 'a document without a window', win: null, expected: true },
        ])('watermarks an unlicensed chart hosted on $host: $expected', ({ win, expected }) => {
            expect(unlicensedManagerIn(win).isDisplayWatermark()).toBe(expected);
        });

        it('watermarks when the manager has no document at all', () => {
            const manager = new LicenseManager();
            manager.validateLicense();
            expect(manager.isDisplayWatermark()).toBe(true);
        });
    });

    describe('validateLicense', () => {
        afterEach(() => {
            LicenseManager.setGridContext(false);
        });

        it('re-validates when the grid context changes', () => {
            const manager = new LicenseManager(documentIn(windowAt('app.example.com')));
            const getLicenseDetails = vi.spyOn(manager, 'getLicenseDetails');

            manager.validateLicense();
            LicenseManager.setGridContext(true);
            manager.validateLicense();
            expect(getLicenseDetails).toHaveBeenCalledTimes(2);
            expect(getLicenseDetails).toHaveBeenLastCalledWith(undefined, true);
        });

        it('re-validates only when the key changes', () => {
            const manager = new LicenseManager(documentIn(windowAt('app.example.com')));
            const getLicenseDetails = vi.spyOn(manager, 'getLicenseDetails');

            manager.validateLicense();
            manager.validateLicense();
            expect(getLicenseDetails).toHaveBeenCalledTimes(1);
            expect(manager.getWatermarkMessage()).toBe('For Trial Use Only');

            LicenseManager.setLicenseKey('not-a-key');
            manager.validateLicense();
            expect(getLicenseDetails).toHaveBeenCalledTimes(2);
            expect(manager.getWatermarkMessage()).toBe('Invalid License');
        });

        it('clears the watermark once a valid key is supplied', () => {
            const manager = new LicenseManager(documentIn(windowAt('app.example.com')));
            manager.validateLicense();
            expect(manager.isDisplayWatermark()).toBe(true);

            vi.spyOn(manager, 'getLicenseDetails').mockReturnValue({ valid: true } as any);
            LicenseManager.setLicenseKey('a-valid-key');
            manager.validateLicense();
            expect(manager.getWatermarkMessage()).toBe('');
            expect(manager.isDisplayWatermark()).toBe(false);
            expect(manager.getWatermarkForegroundConfigForBrowser()).toBeUndefined();
        });
    });
});
