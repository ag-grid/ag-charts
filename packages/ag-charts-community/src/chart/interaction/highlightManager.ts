import type { SeriesNodeDatum } from '../series/seriesTypes';
import { BaseManager } from './baseManager';

interface HighlightNodeDatum extends SeriesNodeDatum {
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
    private readonly states: Map<string, HighlightNodeDatum> = new Map();
    private activeHighlight?: HighlightNodeDatum;

    public updateHighlight(callerId: string, highlightedDatum?: HighlightNodeDatum) {
        this.states.delete(callerId);
        if (highlightedDatum != null) {
            this.states.set(callerId, highlightedDatum);
        }
        this.applyStates();
    }

    public getActiveHighlight(): HighlightNodeDatum | undefined {
        return this.activeHighlight;
    }

    private applyStates() {
        // Last added entry wins.
        const { activeHighlight: previousHighlight } = this;
        this.activeHighlight = Array.from(this.states.values()).pop();
        if (!this.isEqual(this.activeHighlight, previousHighlight)) {
            this.listeners.dispatch('highlight-change', {
                type: 'highlight-change',
                currentHighlight: this.activeHighlight,
                previousHighlight,
            });
        }
    }

    private isEqual(a?: HighlightNodeDatum, b?: HighlightNodeDatum) {
        return a === b || (a?.series === b?.series && a?.itemId === b?.itemId && a?.datum === b?.datum);
    }
}
