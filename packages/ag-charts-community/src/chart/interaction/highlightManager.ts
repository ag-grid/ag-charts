import { type DynamicContext, type Point, objectsEqual } from 'ag-charts-core';

import type { HighlightNodeDatum } from '../../core/eventsHub';
import type { ChartRegistry } from '../../module/moduleContext';
import { debouncedCallback } from '../../util/render';
import { StateTracker } from '../../util/stateTracker';
import type { ErrorBoundSeriesNodeDatum } from '../series/seriesTypes';

/**
 * Manages the actively highlighted series/datum for a chart. Tracks the requested highlights from
 * distinct dependents and handles conflicting highlight requests.
 */
export class HighlightManager {
    private readonly highlightStates = new StateTracker<HighlightNodeDatum>();

    /**
     * Part of the highlighted node under the pointer, per caller (see `Series.getHighlightPart`). Kept
     * beside the highlight rather than on it: the highlighted datum rolls up unchanged, so consumers
     * that don't care about parts are unaffected, and only a caller supplying a part makes the
     * highlight sensitive to it.
     */
    private readonly highlightParts = new Map<string, string>();

    // Track pending unhighlights per caller
    private readonly pendingUnhighlights = new Map<string, { scheduler: ReturnType<typeof debouncedCallback> }>();

    // Configurable delay (hardcoded for POC, will be user-configurable later)
    public unhighlightDelay: number = 100; // milliseconds

    private static readonly HIGHLIGHT_CHANGE_EVENT = 'highlight:change';

    constructor(private readonly ctx: DynamicContext<ChartRegistry>) {}

    private highlightInViewport: boolean = true;

    public updateHighlight(
        callerId: string,
        highlightedDatum?: HighlightNodeDatum,
        delayed: boolean = false,
        inViewport?: boolean,
        highlightPart?: string
    ): void {
        const previousHighlight = this.getActiveHighlight();
        const previousHighlightPart = this.getActiveHighlightPart();

        if (highlightedDatum == null && delayed && this.unhighlightDelay > 0) {
            // Only schedule if we don't already have a pending unhighlight for this caller
            // This prevents resetting the countdown on repeated calls during continuous mouse movement
            if (!this.pendingUnhighlights.has(callerId)) {
                // First call for this caller - start the countdown
                const scheduler = debouncedCallback(() => {
                    this.applyPendingUnhighlight(callerId);
                });

                // Schedule the unhighlight after a delay
                this.pendingUnhighlights.set(callerId, { scheduler });
                scheduler.schedule(this.unhighlightDelay);
            }
            // If already pending for same caller, do nothing - let the countdown continue
            return;
        }

        // Cancel any pending delayed unhighlight for THIS caller only - we're highlighting something new
        const pending = this.pendingUnhighlights.get(callerId);
        if (pending) {
            pending.scheduler.cancel();
            this.pendingUnhighlights.delete(callerId);
        }

        if (highlightedDatum) {
            this.highlightStates.set(callerId, highlightedDatum);
        } else {
            this.highlightStates.delete(callerId);
        }

        if (highlightedDatum && highlightPart != null) {
            this.highlightParts.set(callerId, highlightPart);
        } else {
            this.highlightParts.delete(callerId);
        }

        this.maybeEmitChange(callerId, previousHighlight, inViewport, previousHighlightPart);
    }

    private maybeEmitChange(
        callerId: string,
        previousHighlight: HighlightNodeDatum | undefined,
        inViewport?: boolean,
        previousHighlightPart?: string
    ): void {
        const currentHighlight = this.getActiveHighlight();
        const currentHighlightPart = this.getActiveHighlightPart();
        const highlightChanged =
            !this.isEqual(currentHighlight, previousHighlight) || currentHighlightPart !== previousHighlightPart;
        // Callers that don't know the viewport state omit `inViewport`; resetting the flag to `true`
        // there would re-show crosshairs for a datum since panned off-screen.
        const highlightInViewport: boolean = inViewport ?? (highlightChanged ? true : this.highlightInViewport);

        if (highlightChanged || this.highlightInViewport !== highlightInViewport) {
            const highlightSuppressed = currentHighlight?.series?.isHighlightEnabled() === false;
            this.highlightInViewport = highlightInViewport;
            this.ctx.chartState.setValue('highlight', currentHighlight);
            this.ctx.eventsHub.emit(HighlightManager.HIGHLIGHT_CHANGE_EVENT, {
                callerId,
                currentHighlight,
                previousHighlight,
                currentHighlightPart,
                previousHighlightPart,
                highlightSuppressed,
                highlightInViewport,
            });
        }
    }

    private applyPendingUnhighlight(callerId: string): void {
        // Check if this caller still has a pending unhighlight (might have been cancelled)
        if (!this.pendingUnhighlights.has(callerId)) {
            return; // No pending unhighlight for this caller
        }

        // Remove from pending map before clearing state
        this.pendingUnhighlights.delete(callerId);

        const previousHighlight = this.getActiveHighlight();
        const previousHighlightPart = this.getActiveHighlightPart();

        // Actually clear the highlight for this caller
        this.highlightStates.delete(callerId);
        this.highlightParts.delete(callerId);

        this.maybeEmitChange(callerId, previousHighlight, true, previousHighlightPart);
    }

    public getActiveHighlight(): HighlightNodeDatum | undefined {
        return this.highlightStates.stateValue();
    }

    /** Part of the active highlight, as reported by the caller that owns it. */
    public getActiveHighlightPart(): string | undefined {
        const callerId = this.highlightStates.stateId();
        return callerId == null ? undefined : this.highlightParts.get(callerId);
    }

    public destroy(): void {
        // Cancel all pending unhighlights when manager is destroyed
        for (const { scheduler } of this.pendingUnhighlights.values()) {
            scheduler.cancel();
        }
        this.pendingUnhighlights.clear();
        this.highlightParts.clear();
    }

    private isEqual(a?: HighlightNodeDatum, b?: HighlightNodeDatum): boolean {
        if (a === b) return true;

        return (
            a != null && a.series === b?.series && this.idsMatch(a, b) && this.pointsMatch(a, b) && a.datum === b.datum
        );
    }

    private idsMatch(a: HighlightNodeDatum, b: HighlightNodeDatum): boolean {
        return (
            (a.itemId != null && b.itemId != null && a.itemId === b.itemId) ||
            (a.datumIndex != null && b.datumIndex != null && objectsEqual(a.datumIndex, b.datumIndex))
        );
    }

    private pointsMatch(
        a: HighlightNodeDatum & Partial<ErrorBoundSeriesNodeDatum>,
        b: HighlightNodeDatum & Partial<ErrorBoundSeriesNodeDatum>
    ): boolean {
        return (
            this.pointsAreEqual(a.point, b.point) &&
            this.pointsAreEqual(a.midPoint, b.midPoint) &&
            this.pointsAreEqual(a.xBar?.lowerPoint, b.xBar?.lowerPoint) &&
            this.pointsAreEqual(a.xBar?.upperPoint, b.xBar?.upperPoint) &&
            this.pointsAreEqual(a.yBar?.lowerPoint, b.yBar?.lowerPoint) &&
            this.pointsAreEqual(a.yBar?.upperPoint, b.yBar?.upperPoint)
        );
    }

    private pointsAreEqual(a: Point | undefined, b: Point | undefined): boolean {
        return a === b || (a !== undefined && a.x === b?.x && a.y === b.y);
    }
}
