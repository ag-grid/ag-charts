import type { SeriesNodeDatum } from '../series/seriesTypes';
import { BaseManager } from './baseManager';

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
}

/**
 * Manages the actively highlighted series/datum for a chart. Tracks the requested highlights from
 * distinct dependents and handles conflicting highlight requests.
 */
export class HighlightManager extends BaseManager<'highlight-change', HighlightChangeEvent> {
    private readonly highlightStates: Map<string, HighlightNodeDatum> = new Map();
    private activeHighlight?: HighlightNodeDatum;
    private readonly pickedStates: Map<string, SeriesNodeDatum> = new Map();
    private activePicked?: SeriesNodeDatum;

    public updateHighlight(callerId: string, highlightedDatum?: HighlightNodeDatum) {
        this.highlightStates.delete(callerId);
        if (highlightedDatum != null) {
            this.highlightStates.set(callerId, highlightedDatum);
        }
        this.applyHighlightStates();
    }

    public getActiveHighlight(): HighlightNodeDatum | undefined {
        return this.activeHighlight;
    }

    public updatePicked(callerId: string, clickableDatum?: SeriesNodeDatum) {
        this.pickedStates.delete(callerId);
        if (clickableDatum != null) {
            this.pickedStates.set(callerId, clickableDatum);
        }
        this.applyPickedStates();
    }

    public getActivePicked(): SeriesNodeDatum | undefined {
        return this.activePicked;
    }

    private applyHighlightStates() {
        // Last added entry wins.
        const { activeHighlight: previousHighlight } = this;
        this.activeHighlight = Array.from(this.highlightStates.values()).pop();
        if (!this.isEqual(this.activeHighlight, previousHighlight)) {
            this.listeners.dispatch('highlight-change', {
                type: 'highlight-change',
                currentHighlight: this.activeHighlight,
                previousHighlight,
            });
        }
    }

    private applyPickedStates() {
        this.activePicked = Array.from(this.pickedStates.values()).pop();
    }

    private isEqual(a?: SeriesNodeDatum, b?: SeriesNodeDatum) {
        return a === b || (a?.series === b?.series && a?.itemId === b?.itemId && a?.datum === b?.datum);
    }
}
