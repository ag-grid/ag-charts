import type { EventsHub, HighlightNodeDatum } from '../../core/eventsHub';
import { debouncedCallback } from '../../util/render';
import { StateTracker } from '../../util/stateTracker';

/**
 * Manages the actively highlighted series/datum for a chart. Tracks the requested highlights from
 * distinct dependents and handles conflicting highlight requests.
 */
export class HighlightManager {
    private readonly highlightStates = new StateTracker<HighlightNodeDatum>();

    // Track pending unhighlights per caller
    private readonly pendingUnhighlights = new Map<string, { scheduler: ReturnType<typeof debouncedCallback> }>();

    // Configurable delay (hardcoded for POC, will be user-configurable later)
    public unhighlightDelay: number = 100; // milliseconds

    private static readonly HIGHLIGHT_CHANGE_EVENT = 'highlight:change';

    constructor(private readonly eventsHub: EventsHub) {}

    public updateHighlight(callerId: string, highlightedDatum?: HighlightNodeDatum, delayed: boolean = false): void {
        if (highlightedDatum != null && highlightedDatum.series?.isHighlightEnabled?.() === false) {
            highlightedDatum = undefined;
        }

        const previousHighlight = this.getActiveHighlight();

        // Case 1: Highlighting something (datum is not null/undefined)
        if (highlightedDatum == null) {
            // Case 2: Unhighlighting (datum is null/undefined)
            // Sub-case 2a: Delayed unhighlight requested
            if (delayed && this.unhighlightDelay > 0) {
                // Only schedule if we don't already have a pending unhighlight for this caller
                // This prevents resetting the countdown on repeated calls during continuous mouse movement
                const existingPending = this.pendingUnhighlights.get(callerId);
                if (!existingPending) {
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

            // Sub-case 2b: Immediate unhighlight (default)
            // Cancel any pending delayed unhighlight
            const pending = this.pendingUnhighlights.get(callerId);
            if (pending) {
                pending.scheduler.cancel();
                this.pendingUnhighlights.delete(callerId);
            }

            // Apply unhighlight immediately
            this.highlightStates.delete(callerId);
            this.maybeEmitChange(callerId, previousHighlight);
            return;
        }

        // Cancel any pending delayed unhighlight for THIS caller only - we're highlighting something new
        const pending = this.pendingUnhighlights.get(callerId);
        if (pending) {
            pending.scheduler.cancel();
            this.pendingUnhighlights.delete(callerId);
        }

        // Apply the highlight immediately (always instant visual feedback)
        this.highlightStates.set(callerId, highlightedDatum);
        this.maybeEmitChange(callerId, previousHighlight);
    }

    private maybeEmitChange(callerId: string, previousHighlight: HighlightNodeDatum | undefined): void {
        const currentHighlight = this.getActiveHighlight();

        if (!this.isEqual(currentHighlight, previousHighlight)) {
            this.eventsHub.emit(HighlightManager.HIGHLIGHT_CHANGE_EVENT, {
                callerId,
                currentHighlight,
                previousHighlight,
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

        // Actually clear the highlight for this caller
        this.highlightStates.delete(callerId);

        const currentHighlight = this.getActiveHighlight();

        // Only emit if something actually changed
        if (!this.isEqual(currentHighlight, previousHighlight)) {
            this.eventsHub.emit(HighlightManager.HIGHLIGHT_CHANGE_EVENT, {
                callerId,
                currentHighlight,
                previousHighlight,
            });
        }
    }

    public getActiveHighlight(): HighlightNodeDatum | undefined {
        return this.highlightStates.stateValue();
    }

    public destroy(): void {
        // Cancel all pending unhighlights when manager is destroyed
        for (const { scheduler } of this.pendingUnhighlights.values()) {
            scheduler.cancel();
        }
        this.pendingUnhighlights.clear();
    }

    private isEqual(a?: HighlightNodeDatum, b?: HighlightNodeDatum): boolean {
        return (
            a === b ||
            (a != null && b != null && a?.series === b?.series && a?.itemId === b?.itemId && a?.datum === b?.datum)
        );
    }
}
