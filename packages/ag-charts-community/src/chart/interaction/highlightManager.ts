import { BaseManager } from '../../util/baseManager';
import { StateTracker } from '../../util/stateTracker';
import type { PickFocusOutputs } from '../series/pickFocus';
import type { SeriesNodeDatum } from '../series/seriesTypes';

export interface HighlightNodeDatum extends SeriesNodeDatum {
    readonly xKey?: string;
    readonly yKey?: string;
    readonly colorValue?: number;
    readonly cumulativeValue?: number;
    readonly aggregatedValue?: number;
    readonly domain?: [number, number];
}

export interface HighlightChangeEvent {
    type: 'highlight-change';
    previousHighlight?: HighlightNodeDatum;
    currentHighlight?: HighlightNodeDatum;
    callerId: string;
}

/**
 * Manages the actively highlighted series/datum for a chart. Tracks the requested highlights from
 * distinct dependents and handles conflicting highlight requests.
 */
export class HighlightManager extends BaseManager<'highlight-change', HighlightChangeEvent> {
    private readonly highlightStates = new StateTracker<HighlightNodeDatum>();
    private activeHighlight?: HighlightNodeDatum;
    private pannedFocus?: PickFocusOutputs;

    public updateHighlight(callerId: string, highlightedDatum?: HighlightNodeDatum) {
        const { activeHighlight: previousHighlight } = this;
        this.highlightStates.set(callerId, highlightedDatum);
        this.activeHighlight = this.highlightStates.stateValue();
        if (!this.isEqual(this.activeHighlight, previousHighlight)) {
            this.listeners.dispatch('highlight-change', {
                type: 'highlight-change',
                currentHighlight: this.activeHighlight,
                previousHighlight,
                callerId,
            });
        }
    }

    public requestPanRefresh(pickedFocus: PickFocusOutputs) {
        this.pannedFocus = pickedFocus;
    }

    public refreshPannedHighlight(nodeData: HighlightNodeDatum[] | undefined) {
        const callerId = this.highlightStates.stateId();
        if (nodeData != null && callerId != null && this.pannedFocus != null) {
            const newHighlight: HighlightNodeDatum | undefined = nodeData[this.pannedFocus.datumIndex];
            this.updateHighlight(callerId, newHighlight);
            this.pannedFocus = undefined;
        }
    }

    public getActiveHighlight(): HighlightNodeDatum | undefined {
        return this.activeHighlight;
    }

    private isEqual(a?: SeriesNodeDatum, b?: SeriesNodeDatum) {
        return (
            a === b ||
            (a != null && b != null && a?.series === b?.series && a?.itemId === b?.itemId && a?.datum === b?.datum)
        );
    }
}
