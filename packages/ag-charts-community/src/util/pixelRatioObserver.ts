import type { AgDocument } from 'ag-charts-core';

/**
 * Chrome & FireFox reports devicePixelRatio as the pixel ratio of the screen multiplied by the browser zoom.
 * Safari reports this as just the screen pixel ratio.
 * There's not a reliable way get the browser zoom - outerWidth / innerWidth doesn't work in iframes, and no API gives this value.
 * Therefore, this works as intended in Chrome & FireFox, and doesn't make things worse in Safari.
 */

// Shared singleton registry — one MediaQueryList per Window, shared across observers.

type SharedCallback = (pixelRatio: number) => void;

interface SharedEntry {
    pixelRatio: number;
    mql: MediaQueryList | undefined;
    readonly subscribers: Set<SharedCallback>;
    readonly mqlListener: (e: MediaQueryListEvent) => void;
}

const sharedRegistry = new Map<Window, SharedEntry>();

function getOrCreateSharedEntry(win: Window, initialRatio: number): SharedEntry {
    let entry = sharedRegistry.get(win);
    if (entry == null) {
        // Named function so the listener is identifiable in flame graphs.
        function onPixelRatioChange(e: MediaQueryListEvent) {
            if (e.matches) return;
            entry!.pixelRatio = win.devicePixelRatio;
            detachMql(entry!);
            attachMql(win, entry!);
            for (const cb of entry!.subscribers) {
                cb(entry!.pixelRatio);
            }
        }
        entry = {
            pixelRatio: initialRatio,
            mql: undefined,
            subscribers: new Set(),
            mqlListener: onPixelRatioChange,
        };
        sharedRegistry.set(win, entry);
    }
    return entry;
}

function attachMql(win: Window, entry: SharedEntry) {
    const mql = win.matchMedia?.(`(resolution: ${entry.pixelRatio}dppx)`);
    entry.mql = mql;
    mql?.addEventListener('change', entry.mqlListener);
}

function detachMql(entry: SharedEntry) {
    entry.mql?.removeEventListener('change', entry.mqlListener);
    entry.mql = undefined;
}

function sharedSubscribe(win: Window, initialRatio: number, cb: SharedCallback): () => void {
    const entry = getOrCreateSharedEntry(win, initialRatio);
    if (entry.subscribers.size === 0) {
        attachMql(win, entry);
    }
    entry.subscribers.add(cb);
    return () => sharedUnsubscribe(win, cb);
}

function sharedUnsubscribe(win: Window, cb: SharedCallback) {
    const entry = sharedRegistry.get(win);
    if (entry == null) return;
    entry.subscribers.delete(cb);
    if (entry.subscribers.size === 0) {
        detachMql(entry);
        sharedRegistry.delete(win);
    }
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
