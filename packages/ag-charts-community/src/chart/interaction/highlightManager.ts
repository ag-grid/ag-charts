import type { EventsHub } from '../../module/eventsHub';
import { StateTracker } from '../../util/stateTracker';
import type { SeriesNodeDatum } from '../series/seriesTypes';

export interface HighlightNodeDatum extends SeriesNodeDatum<unknown> {
    readonly xKey?: string;
    readonly yKey?: string;
    readonly angleKey?: string;
    readonly radiusKey?: string;
    readonly colorValue?: number;
    readonly cumulativeValue?: number;
    readonly aggregatedValue?: number;
    readonly domain?: [number, number];
}

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

    private isEqual(a?: SeriesNodeDatum<unknown>, b?: SeriesNodeDatum<unknown>): boolean {
        return (
            a === b ||
            (a != null && b != null && a?.series === b?.series && a?.itemId === b?.itemId && a?.datum === b?.datum)
        );
    }
}
