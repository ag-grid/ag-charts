import { StateTracker } from '../../util/stateTracker';
import { BaseManager } from '../baseManager';
import type { CategoryLegendDatum } from '../legendDatum';
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
}

/**
 * Manages the actively highlighted series/datum for a chart. Tracks the requested highlights from
 * distinct dependents and handles conflicting highlight requests.
 */
export class HighlightManager extends BaseManager<'highlight-change', HighlightChangeEvent> {
    private readonly highlightStates = new StateTracker<HighlightNodeDatum>();
    private readonly pickedStates = new StateTracker<SeriesNodeDatum>();
    private readonly legendItemStates = new StateTracker<CategoryLegendDatum>();

    private activeHighlight?: HighlightNodeDatum;
    private activePicked?: SeriesNodeDatum;
    private activeLegendItem?: CategoryLegendDatum;

    public updateHighlight(callerId: string, highlightedDatum?: HighlightNodeDatum) {
        const { activeHighlight: previousHighlight } = this;
        this.highlightStates.set(callerId, highlightedDatum);
        this.activeHighlight = this.highlightStates.stateValue();
        if (!this.isEqual(this.activeHighlight, previousHighlight)) {
            this.listeners.dispatch('highlight-change', {
                type: 'highlight-change',
                currentHighlight: this.activeHighlight,
                previousHighlight,
            });
        }
    }

    public getActiveHighlight(): HighlightNodeDatum | undefined {
        return this.activeHighlight;
    }

    public updatePicked(callerId: string, clickableDatum?: SeriesNodeDatum) {
        this.pickedStates.set(callerId, clickableDatum);
        this.activePicked = this.pickedStates.stateValue();
    }

    public getActivePicked(): SeriesNodeDatum | undefined {
        return this.activePicked;
    }

    public updateLegendItem(callerId: string, clickableLegendItem?: CategoryLegendDatum) {
        this.legendItemStates.set(callerId, clickableLegendItem);
        this.activeLegendItem = this.legendItemStates.stateValue();
    }

    public getActiveLegendItem(): CategoryLegendDatum | undefined {
        return this.activeLegendItem;
    }

    private isEqual(a?: SeriesNodeDatum, b?: SeriesNodeDatum) {
        return a === b || (a?.series === b?.series && a?.itemId === b?.itemId && a?.datum === b?.datum);
    }
}
