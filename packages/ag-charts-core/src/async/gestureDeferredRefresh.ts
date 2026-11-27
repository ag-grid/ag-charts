import { debounce } from './functions';

const BURST_WAIT_MS = 100;
const BURST_MAX_WAIT_MS = 500;
const WHEEL_END_MS = 150;

/**
 * Defers a costly refresh, such as rewriting DOM proxies, through bursts of updates and pointer gestures.
 * `flush` runs once the deferred refresh is due: when a burst pauses or reaches its maximum wait, or a gesture ends.
 */
export class GestureDeferredRefresh {
    private pending = false;
    private inBurst = false;
    private dragging = false;
    private wheeling = false;

    private readonly endBurst = debounce(
        () => {
            this.inBurst = false;
            this.flushUnlessGesture();
        },
        BURST_WAIT_MS,
        { maxWait: BURST_MAX_WAIT_MS }
    );

    // Neither a mouse wheel nor trackpad momentum signals its end, so a pause in wheel events ends the gesture.
    private readonly endWheel = debounce(() => {
        this.wheeling = false;
        this.flushUnlessGesture();
    }, WHEEL_END_MS);

    constructor(private readonly flush: () => void) {}

    /** Returns whether the caller should refresh now; otherwise `flush` runs once the refresh is due. */
    request(force = false): boolean {
        const refreshNow = force || (!this.inBurst && !this.isGestureActive());
        this.pending = !refreshNow;
        this.inBurst = true;
        this.endBurst();
        return refreshNow;
    }

    /** Runs `flush` now if a refresh is pending, even during a gesture. */
    flushNow() {
        if (!this.pending) return;
        this.pending = false;
        this.flush();
    }

    /** Ends the current burst, so the next `request` refreshes at once unless a gesture is in progress. */
    settle() {
        this.inBurst = false;
    }

    dragStart() {
        this.dragging = true;
    }

    dragEnd() {
        if (!this.dragging) return;
        this.dragging = false;
        this.flushUnlessGesture();
    }

    wheel() {
        this.wheeling = true;
        this.endWheel();
    }

    destroy() {
        this.endBurst.cancel();
        this.endWheel.cancel();
    }

    private isGestureActive() {
        return this.dragging || this.wheeling;
    }

    private flushUnlessGesture() {
        if (!this.isGestureActive()) this.flushNow();
    }
}
