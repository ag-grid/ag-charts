import type { EventsHub, HighlightNodeDatum } from '../../core/eventsHub';
import { StateTracker } from '../../util/stateTracker';

/**
 * Manages the actively highlighted series/datum for a chart. Tracks the requested highlights from
 * distinct dependents and handles conflicting highlight requests.
 */
export class HighlightManager {
    private readonly highlightStates = new StateTracker<HighlightNodeDatum>();

    constructor(private readonly eventsHub: EventsHub) {}

    public updateHighlight(callerId: string, highlightedDatum?: HighlightNodeDatum): void {
        const previousHighlight = this.getActiveHighlight();
        this.highlightStates.set(callerId, highlightedDatum);
        const currentHighlight = this.getActiveHighlight();
        if (!this.isEqual(currentHighlight, previousHighlight)) {
            this.eventsHub.emit('highlight:change', { callerId, currentHighlight, previousHighlight });
        }
    }

    public getActiveHighlight(): HighlightNodeDatum | undefined {
        return this.highlightStates.stateValue();
    }

    private isEqual(a?: HighlightNodeDatum, b?: HighlightNodeDatum): boolean {
        return (
            a === b ||
            (a != null && b != null && a?.series === b?.series && a?.itemId === b?.itemId && a?.datum === b?.datum)
        );
    }
}
