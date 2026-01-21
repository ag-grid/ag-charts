import { objectsEqual } from 'ag-charts-core';
import type { AgActiveItemState } from 'ag-charts-types';

import type { ActiveManager } from '../interaction/activeManager';
import type { PickFocusOutputs, PickedNode, PickedNodes, PickedSeries } from './seriesTypes';

function getItemId(node: PickedNode): NonNullable<AgActiveItemState['itemId']> {
    // FIXME: How to serialise/deserialise datums is still TBD.
    if (node.datum.itemId) return `${node.datum.itemId}`;
    return JSON.stringify(node.datum.datumIndex);
}

function pickedNodesEqual(a: PickedNode, b: PickedNode) {
    return a.series === b.series && objectsEqual(a.datumIndex, b.datumIndex);
}

function indexOf(candidates: PickedNode[], node: PickedNode | undefined): number {
    return node == undefined ? -1 : candidates.findIndex((c) => pickedNodesEqual(c, node));
}

type TooltipCandidate = { active?: PickedNode; paginationState?: { index: number; length: number } };

/**
 * IPickManager mediates the `active` node state between SeriesAreaManager and ActiveManager.
 *
 * It tracks the active node by:
 *
 *   1.  Listening for `setState` calls from ActiveManager
 *
 *   2.  Notifying ActiveManager of state change (so that `getState` receives the
 *       correct data)
 *
 *   3.  Track tooltip candidates (if pagination is enabled).
 */
export interface IPickManager {
    onPickedNodesHighlight(pickedNodes: PickedNodes | undefined): PickedNode | undefined;
    onPickedNodesTooltip(pickedNodes: PickedNodes | undefined): TooltipCandidate;
    onPickedNodesFocus(pickedFocus: PickFocusOutputs | undefined): void;
    onPickedNodesAPI(pickedNodes: PickedNodes): void;
    onPickedNodesAPIDebounced(): TooltipCandidate;

    onClearUI(): void;
    onClearAPI(): void;

    nextCandidate(): TooltipCandidate;
}

export class PickManager implements IPickManager {
    private candidates: PickedNode[] = [];

    private active: PickedNode | undefined;
    private pendingPickedNodes?: PickedNodes;

    constructor(
        private readonly activeManager: ActiveManager,
        private readonly tooltipProperties: { readonly pagination: boolean },
        private readonly focusState: { readonly series: PickedSeries | undefined }
    ) {}

    private clear(): void {
        this.active = undefined;
        this.candidates.length = 0;
        this.pendingPickedNodes = undefined;
    }

    private updateActive(active: PickedNode | undefined): PickedNode | undefined {
        this.active = active;
        if (this.active === undefined) {
            this.activeManager.update(undefined);
        } else {
            const seriesId: string = this.active.series.id;
            const itemId: string | number = getItemId(this.active);
            this.activeManager.update({ type: 'series-area', seriesId, itemId });
        }
        return this.active;
    }

    private popPendingPickedNodes(): PickedNodes | undefined {
        const result = this.pendingPickedNodes;
        this.pendingPickedNodes = undefined;
        return result;
    }

    // Some user interactive (e.g. mouseleave, blur) has cleared the active datum.
    onClearUI(): void {
        this.activeManager.update(undefined);
        this.clear();
    }

    // Active datum was cleared by ActiveManager (`setState` or legend).
    onClearAPI(): void {
        this.clear();
    }

    onPickedNodesHighlight(pickedNodes: PickedNodes | undefined): PickedNode | undefined {
        if (pickedNodes !== undefined) {
            const previousActive = this.active;
            if (this.tooltipProperties.pagination && previousActive !== undefined) {
                const tooltipMatch = pickedNodes.matches.find((m) => pickedNodesEqual(m, previousActive));
                if (tooltipMatch) {
                    return tooltipMatch;
                }
            }
        }

        return this.updateActive(pickedNodes?.matches[0]);
    }

    onPickedNodesTooltip(pickedNodes: PickedNodes | undefined): TooltipCandidate {
        if (pickedNodes !== undefined && this.tooltipProperties.pagination) {
            const previous = this.active;
            const nextCandidates = pickedNodes.matches;

            this.candidates = nextCandidates;

            let nextIndex = indexOf(nextCandidates, previous);
            if (nextIndex === -1) nextIndex = 0;
            this.updateActive(nextCandidates[nextIndex]);

            const paginationState = { index: nextIndex, length: nextCandidates.length };
            return { active: this.active, paginationState };
        }

        return { active: this.updateActive(pickedNodes?.matches[0]) };
    }

    onPickedNodesFocus(pickedFocus: PickFocusOutputs | undefined): void {
        const { series } = this.focusState;
        this.clear();
        if (series !== undefined && pickedFocus !== undefined) {
            const { datum, datumIndex } = pickedFocus;
            this.updateActive({ series, datum, datumIndex });
        }
    }

    onPickedNodesAPI(debouncedPickedNodes: PickedNodes): void {
        this.pendingPickedNodes = debouncedPickedNodes;
    }

    onPickedNodesAPIDebounced(): TooltipCandidate {
        return { active: this.onPickedNodesHighlight(this.popPendingPickedNodes()) };
    }

    nextCandidate(): TooltipCandidate {
        if (this.tooltipProperties.pagination) {
            const { candidates, active: previous } = this;
            const hoverIndex = previous == null ? -1 : candidates.findIndex((c) => pickedNodesEqual(c, previous));
            if (hoverIndex === -1) return { active: undefined, paginationState: undefined };

            let nextIndex = hoverIndex + 1;
            if (nextIndex >= candidates.length) {
                nextIndex = 0;
            }
            const nextActive = this.updateActive(candidates[nextIndex]);

            const paginationState = { index: nextIndex, length: this.candidates.length };
            return { active: nextActive, paginationState };
        }

        return { active: this.active };
    }
}
