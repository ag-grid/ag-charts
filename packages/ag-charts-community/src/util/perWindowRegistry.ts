// Per-Window subscriber registry — one entry per Window, fanned out to many subscribers.
// Used by minimal-mode charts to share DOM listeners (scroll/resize/fullscreen) and the
// devicePixelRatio MediaQueryList across chart instances on the same Window.
//
// The caller owns the "what to attach" logic via `onFirstSubscribe` (called when the
// first subscriber arrives for a Window) and `onLastUnsubscribe` (called when the last
// subscriber leaves). The registry handles the lifecycle.
import { Debug } from 'ag-charts-core';

const registryDebug = Debug.create(true, 'perf', 'opts');

export interface PerWindowEntry<S> {
    subscribers: Set<S>;
}

export interface PerWindowRegistry<S, E extends PerWindowEntry<S>> {
    subscribe(win: Window, subscriber: S): () => void;
    /** Returns a snapshot copy so callers can iterate safely while subscribers self-unsubscribe. */
    snapshot(entry: E): S[];
    get(win: Window): E | undefined;
}

export function createPerWindowRegistry<S, E extends PerWindowEntry<S>>(
    onFirstSubscribe: (win: Window) => E,
    onLastUnsubscribe: (entry: E) => void,
    name = 'PerWindowRegistry'
): PerWindowRegistry<S, E> {
    const entries = new Map<Window, E>();

    return {
        subscribe(win, subscriber) {
            let entry = entries.get(win);
            if (entry == null) {
                entry = onFirstSubscribe(win);
                entries.set(win, entry);
                registryDebug(`[REGISTRY] ${name}`, 'first-subscribe');
            } else {
                registryDebug(`[REGISTRY] ${name}`, 'shared-subscribe');
            }
            entry.subscribers.add(subscriber);
            return () => {
                const e = entries.get(win);
                if (e == null) return;
                e.subscribers.delete(subscriber);
                if (e.subscribers.size === 0) {
                    entries.delete(win);
                    onLastUnsubscribe(e);
                    registryDebug(`[REGISTRY] ${name}`, 'last-unsubscribe');
                }
            };
        },
        snapshot(entry) {
            return [...entry.subscribers];
        },
        get(win) {
            return entries.get(win);
        },
    };
}
