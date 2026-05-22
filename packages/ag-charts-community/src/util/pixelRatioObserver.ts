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
    win: Window;
    pixelRatio: number;
    mql: MediaQueryList | undefined;
    mqlListener: (e: MediaQueryListEvent) => void;
}

function attachMql(entry: SharedEntry) {
    const mql = entry.win.matchMedia?.(`(resolution: ${entry.pixelRatio}dppx)`);
    entry.mql = mql;
    mql?.addEventListener('change', entry.mqlListener);
}

function detachMql(entry: SharedEntry) {
    entry.mql?.removeEventListener('change', entry.mqlListener);
    entry.mql = undefined;
}

const sharedRegistry = createPerWindowRegistry<SharedCallback, SharedEntry>((win) => {
    const entry: SharedEntry = {
        win,
        pixelRatio: win.devicePixelRatio,
        mql: undefined,
        subscribers: new Set(),
        // Named function so the listener is identifiable in flame graphs.
        mqlListener: function onPixelRatioChange(e: MediaQueryListEvent) {
            if (e.matches) return;
            entry.pixelRatio = win.devicePixelRatio;
            detachMql(entry);
            attachMql(entry);
            for (const cb of sharedRegistry.snapshot(entry)) {
                cb(entry.pixelRatio);
            }
        },
    };
    attachMql(entry);
    return entry;
}, detachMql);

function sharedSubscribe(win: Window, currentRatio: number, cb: SharedCallback): () => void {
    // Late-arriving subscribers may see a different DPR than the entry was created with
    // (e.g. user zoom between charts). Refresh the entry + MQL before adding.
    const existing = sharedRegistry.get(win);
    if (existing != null && existing.pixelRatio !== currentRatio) {
        existing.pixelRatio = currentRatio;
        detachMql(existing);
        attachMql(existing);
    }
    return sharedRegistry.subscribe(win, cb);
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
        const win = this.agDocument.window;
        this.sharedUnsubscribe = sharedSubscribe(win, this.devicePixelRatio, (ratio) => {
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
