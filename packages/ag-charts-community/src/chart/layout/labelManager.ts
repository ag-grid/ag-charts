import {
    type BoxBounds,
    type CandidateStyleResolver,
    type LabelObstacle,
    type NormalisedPaddingOptions,
    type PlacedLabel,
    type PointLabelDatum,
    type PositionedCandidateResolver,
    type SeriesLabelDefaults,
    type SeriesLabels,
    isPointLabelDatum,
    placeLabels,
} from 'ag-charts-core';

import { BBox } from '../../scene/bbox';

/**
 * Anything taking part in a label solve. A source contributes obstacles whether or not it places
 * labels of its own, so a module owning fixed, user-authored labels can reserve their space without
 * pretending to be a series.
 *
 * `id` shares a namespace with series ids and keys the placement result, so a registered source must
 * qualify its own (e.g. `crossLines:<axisId>`).
 */
export interface LabelSource {
    readonly id: string;
    readonly usesPlacedLabels: boolean;
    /** Increments on every invalidation of the label inputs; lets placement skip unchanged ones. */
    readonly nodeDataVersion: number;
    /** `seriesRect` is the placement space's canvas origin; series already work in it and ignore it. */
    getLabelObstacles?(seriesRect: BBox): LabelObstacle[] | undefined;
}

/**
 * A source whose own labels the engine places. `ISeries` satisfies it structurally; a source reaches
 * this path only via {@link LabelSource.usesPlacedLabels}.
 */
export interface PlacedLabelSource<TLabel = unknown> extends LabelSource {
    getLabelData(seriesRect: BBox): PointLabelDatum[];
    getLabelDefaults?(): SeriesLabelDefaults | undefined;
    getLabelCandidateStyler?(): CandidateStyleResolver | undefined;
    getLabelCandidateResolver?(): PositionedCandidateResolver | undefined;
    updatePlacedLabelData?(labels: PlacedLabel<TLabel>[], seriesRect: BBox): void;
}

function placesLabels(source: LabelSource): source is PlacedLabelSource {
    return source.usesPlacedLabels;
}

/**
 * Identity of the placement inputs: each source's node-data version (label data and obstacles both
 * derive from node data) and the layout bounds. Unchanged between two updates means placement would
 * produce the same result.
 */
function placementSignature(sources: LabelSource[], bounds: BoxBounds): string {
    let ids = '';
    for (const source of sources) {
        ids += `${source.id}:${source.nodeDataVersion};`;
    }
    return `${ids}|${bounds.x},${bounds.y},${bounds.width},${bounds.height}`;
}

export class LabelManager {
    private labelData: Map<string, SeriesLabels> = new Map();
    private lastPlacementSignature?: string;
    private lastPlacedLabels?: Map<string, PlacedLabel[]>;
    private readonly sources = new Map<string, LabelSource>();

    registerSource(source: LabelSource) {
        this.sources.set(source.id, source);
    }

    /**
     * A recreated axis registers its replacement before the old one is destroyed, so a source may only
     * drop its own entry — deleting by id alone would unregister the live replacement.
     */
    unregisterSource(id: string, source?: LabelSource) {
        if (source != null && this.sources.get(id) !== source) return;
        this.sources.delete(id);
    }

    updateLabels(visibleSources: PlacedLabelSource[], padding: NormalisedPaddingOptions, seriesRect = BBox.zero) {
        const bounds = {
            x: -padding.left,
            y: -padding.top,
            width: seriesRect.width + padding.left + padding.right,
            height: seriesRect.height + padding.top + padding.bottom,
        };
        const allSources: LabelSource[] = [...this.sources.values(), ...visibleSources];
        const placedLabelSources = allSources.filter(placesLabels);

        // Nothing places labels, so gathering obstacles and running placement would be wasted work.
        if (placedLabelSources.length === 0) {
            this.labelData.clear();
            this.lastPlacementSignature = undefined;
            this.lastPlacedLabels = undefined;
            return;
        }

        // SERIES_UPDATE also fires on hover/highlight, where the placement inputs are unchanged, so
        // reuse the cached solve; it is still re-applied below to refresh per-datum highlight styling.
        const signature = placementSignature(allSources, bounds);
        let placedLabels = this.lastPlacedLabels;
        if (placedLabels == null || signature !== this.lastPlacementSignature) {
            placedLabels = this.computePlacement(placedLabelSources, allSources, bounds, seriesRect);
            this.lastPlacementSignature = signature;
            this.lastPlacedLabels = placedLabels;
        }

        for (const source of placedLabelSources) {
            source.updatePlacedLabelData?.(placedLabels.get(source.id) ?? [], seriesRect);
        }
    }

    private computePlacement(
        placedLabelSources: PlacedLabelSource[],
        allSources: LabelSource[],
        bounds: BoxBounds,
        seriesRect: BBox
    ): Map<string, PlacedLabel[]> {
        // Placement is greedy in iteration order, so the map must be rebuilt in source order rather
        // than mutated: a re-shown series has to reclaim its original slot, not land at the end.
        const previous = this.labelData;
        this.labelData = new Map();
        for (const source of placedLabelSources) {
            const labelData = source.getLabelData(seriesRect);
            if (labelData.every(isPointLabelDatum)) {
                this.labelData.set(source.id, {
                    datums: labelData,
                    defaults: source.getLabelDefaults?.(),
                    resolveCandidateStyle: source.getLabelCandidateStyler?.(),
                    resolveCandidate: source.getLabelCandidateResolver?.(),
                });
            } else {
                const carried = previous.get(source.id);
                if (carried != null) {
                    this.labelData.set(source.id, carried);
                }
            }
        }

        // Every visible series can contribute entity obstacles (bar rects, sectors, markers) that
        // any labels must avoid, even series that don't place labels of their own.
        const obstacles: LabelObstacle[] = [];
        for (const source of allSources) {
            const sourceObstacles = source.getLabelObstacles?.(seriesRect);
            if (sourceObstacles == null) continue;
            for (const obstacle of sourceObstacles) {
                obstacles.push(obstacle);
            }
        }

        return placeLabels(this.labelData, bounds, 5, obstacles);
    }
}
