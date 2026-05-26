import type { AgDocument } from 'ag-charts-core';

import { type PerWindowEntry, createPerWindowRegistry } from './perWindowRegistry';

/**
 * Chrome & FireFox reports devicePixelRatio as the pixel ratio of the screen multiplied by the browser zoom.
 * Safari reports this as just the screen pixel ratio.
 * There's not a reliable way get the browser zoom - outerWidth / innerWidth doesn't work in iframes, and no API gives this value.
 * Therefore, this works as intended in Chrome & FireFox, and doesn't make things worse in Safari.
 */

type SharedCallback = (pixelRatio: number) => void;

interface SharedEntry extends PerWindowEntry<SharedCallback> {
    window: Window;
    pixelRatio: number;
    mediaQuery: MediaQueryList | undefined;
    mediaQueryListener: (e: MediaQueryListEvent) => void;
}

function attachMediaQuery(entry: SharedEntry) {
    const mediaQuery = entry.window.matchMedia?.(`(resolution: ${entry.pixelRatio}dppx)`);
    entry.mediaQuery = mediaQuery;
    mediaQuery?.addEventListener('change', entry.mediaQueryListener);
}

function detachMediaQuery(entry: SharedEntry) {
    entry.mediaQuery?.removeEventListener('change', entry.mediaQueryListener);
    entry.mediaQuery = undefined;
}

const sharedRegistry = createPerWindowRegistry<SharedCallback, SharedEntry>(
    (window) => {
        const entry: SharedEntry = {
            window,
            pixelRatio: window.devicePixelRatio,
            mediaQuery: undefined,
            subscribers: new Set(),
            // Named function so the listener is identifiable in flame graphs.
            mediaQueryListener: function onPixelRatioChange(e: MediaQueryListEvent) {
                if (e.matches) return;
                entry.pixelRatio = window.devicePixelRatio;
                detachMediaQuery(entry);
                attachMediaQuery(entry);
                for (const cb of sharedRegistry.snapshot(entry)) {
                    cb(entry.pixelRatio);
                }
            },
        };
        attachMediaQuery(entry);
        return entry;
    },
    detachMediaQuery,
    'PixelRatioObserver.shared'
);

function sharedSubscribe(window: Window, currentRatio: number, cb: SharedCallback): () => void {
    // Late-arriving subscribers may see a different DPR than the entry was created with
    // (e.g. user zoom between charts). Refresh the entry + MQL before adding.
    const existing = sharedRegistry.get(window);
    if (existing != null && existing.pixelRatio !== currentRatio) {
        existing.pixelRatio = currentRatio;
        detachMediaQuery(existing);
        attachMediaQuery(existing);
    }
    return sharedRegistry.subscribe(window, cb);
}

export class PixelRatioObserver {
    get pixelRatio(): number {
        return this.devicePixelRatio;
    }

    private devicePixelRatio: number;
    private devicePixelRatioMediaQuery: MediaQueryList | undefined = undefined;
    private sharedUnsubscribe: (() => void) | undefined = undefined;

    private readonly devicePixelRatioListener = (e: MediaQueryListEvent) => {
        if (e.matches) return;

        this.devicePixelRatio = this.agDocument.devicePixelRatio;
        this.unregisterDevicePixelRatioListener();
        this.registerDevicePixelRatioListener();
        this.callback(this.pixelRatio);
    };

    constructor(
        private readonly agDocument: AgDocument,
        private readonly callback: (pixelRatio: number) => void,
        private readonly shared: boolean = false
    ) {
        this.devicePixelRatio = agDocument.devicePixelRatio;
    }

    observe() {
        if (this.shared) {
            this.observeShared();
        } else {
            this.registerDevicePixelRatioListener();
        }
    }

    disconnect() {
        if (this.shared) {
            this.sharedUnsubscribe?.();
            this.sharedUnsubscribe = undefined;
        } else {
            this.unregisterDevicePixelRatioListener();
        }
    }

    private observeShared() {
        if (this.sharedUnsubscribe != null) return;
        const { window } = this.agDocument;
        this.sharedUnsubscribe = sharedSubscribe(window, this.devicePixelRatio, (ratio) => {
            this.devicePixelRatio = ratio;
            this.callback(ratio);
        });
    }

    private unregisterDevicePixelRatioListener() {
        this.devicePixelRatioMediaQuery?.removeEventListener('change', this.devicePixelRatioListener);
        this.devicePixelRatioMediaQuery = undefined;
    }

    private registerDevicePixelRatioListener() {
        const devicePixelRatioMediaQuery = this.agDocument.matchMedia(`(resolution: ${this.pixelRatio}dppx)`);
        devicePixelRatioMediaQuery?.addEventListener('change', this.devicePixelRatioListener);
        this.devicePixelRatioMediaQuery = devicePixelRatioMediaQuery;
    }
}
