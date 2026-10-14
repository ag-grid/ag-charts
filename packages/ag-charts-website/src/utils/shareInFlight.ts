/**
 * Wraps an async loader so that callers arriving while a run is pending share it, rather than each
 * starting their own. Nothing is retained once the run settles, so the next call loads afresh.
 */
export function shareInFlight<T>(load: () => Promise<T>): () => Promise<T> {
    let inFlight: Promise<T> | undefined;

    return () =>
        (inFlight ??= load().finally(() => {
            inFlight = undefined;
        }));
}
