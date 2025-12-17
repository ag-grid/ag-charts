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
        const previousHighlight = this.getActiveHighlight();

        // Apply and clear all pending unhighlight state.
        const triggeringCallerIdToKeep = highlightedDatum == null ? callerId : undefined;
        this.clearPendingUnhighlights(triggeringCallerIdToKeep);

        // Case 1: Highlighting something (datum is not null/undefined)
        if (triggeringCallerIdToKeep) {
            // Case 2: Unhighlighting (datum is null/undefined)
            // Sub-case 2a: Delayed unhighlight requested
            if (delayed && this.unhighlightDelay > 0) {
                let pending = this.pendingUnhighlights.get(callerId);
                if (!pending) {
                    const scheduler = debouncedCallback(() => {
                        this.applyPendingUnhighlight(callerId);
                    });

                    pending = { scheduler };
                    // Schedule the unhighlight after a delay
                    this.pendingUnhighlights.set(callerId, pending);
                }
                pending.scheduler.schedule(this.unhighlightDelay);

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
            const currentHighlight = this.getActiveHighlight();

            if (!this.isEqual(currentHighlight, previousHighlight)) {
                this.eventsHub.emit(HighlightManager.HIGHLIGHT_CHANGE_EVENT, {
                    callerId,
                    currentHighlight,
                    previousHighlight,
                });
            }
            return;
        }

        // Cancel any pending delayed unhighlight for THIS caller only - we're highlighting something new
        this.pendingUnhighlights.get(callerId)?.scheduler.cancel();

        // AG-16398: When a user interaction creates a highlight (not from sync),
        // clear any existing sync entries on this chart. This prevents stale sync entries
        // from persisting when focus returns to a chart that had received sync highlights.
        if (!callerId.endsWith('-sync')) {
            this.clearSyncEntries();
        }

        // Apply the highlight immediately (always instant visual feedback)
        this.highlightStates.set(callerId, highlightedDatum);
        const currentHighlight = this.getActiveHighlight();

        if (!this.isEqual(currentHighlight, previousHighlight)) {
            this.eventsHub.emit(HighlightManager.HIGHLIGHT_CHANGE_EVENT, {
                callerId,
                currentHighlight,
                previousHighlight,
            });
        }
    }

    private clearPendingUnhighlights(triggeringCallerIdToKeep?: string): void {
        for (const [callerId, pending] of this.pendingUnhighlights.entries()) {
            if (callerId === triggeringCallerIdToKeep) continue;
            if (!pending.scheduler.isPending()) continue;
            pending.scheduler.cancel();
            this.highlightStates.delete(callerId);
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

    public getActiveHighlightCallerId(): string | undefined {
        return this.highlightStates.stateId();
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

    /**
     * Clear all sync entries from this chart's highlight states.
     * This is called when a user interaction creates a new highlight, making any existing
     * sync entries stale.
     */
    private clearSyncEntries(): void {
        for (const stateId of this.highlightStates.keys()) {
            if (typeof stateId === 'string' && stateId.endsWith('-sync')) {
                // Cancel any pending unhighlight for this sync entry
                const pending = this.pendingUnhighlights.get(stateId);
                if (pending) {
                    pending.scheduler.cancel();
                    this.pendingUnhighlights.delete(stateId);
                }
                this.highlightStates.delete(stateId);
            }
        }
    }
}
