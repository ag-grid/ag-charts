import { objectsEqual } from 'ag-charts-core';
import type { AgActiveItemState } from 'ag-charts-types';

import { StateTracker } from '../../util/stateTracker';
import type { ActiveManager } from '../interaction/activeManager';
import type { PickFocusOutputs, UnknownSeries } from './series';
import type { DatumIndexType, SeriesNodeDatum } from './seriesTypes';

type ActiveSource = 'highlight' | 'tooltip' | 'focus';

export type PickedNode = SeriesNodeDatum<DatumIndexType>;

export type PickedNodes = {
    matches: PickedNode[];
    distance: number;
};

function getItemId(node: PickedNode): NonNullable<AgActiveItemState['itemId']> {
    if (node.itemId !== undefined) {
        return node.itemId;
    } else if (typeof node.datumIndex === 'number') {
        return node.datumIndex;
    } else {
        return JSON.stringify(node.datumIndex);
    }
}

function pickedNodesEqual(a: PickedNode, b: PickedNode) {
    return a.series === b.series && objectsEqual(a.datumIndex, b.datumIndex);
}

function indexOf(candidates: PickedNode[], node: PickedNode | undefined): number {
    return node == undefined ? -1 : candidates.findIndex((c) => pickedNodesEqual(c, node));
}

type TooltipCandidate = { active?: PickedNode; paginationState?: { index: number; length: number } };

/**
 * PickManager mediates the `active` node state between SeriesAreaManager and ActiveManager.
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
export class PickManager {
    private candidates: PickedNode[] = [];

    private readonly activeState = new StateTracker<PickedNode, ActiveSource>();
    private lastNotifiedActive: PickedNode | undefined;
    private pendingPickedNodes?: PickedNodes;

    constructor(
        private readonly activeManager: ActiveManager,
        private readonly tooltipProperties: { readonly pagination: boolean },
        private readonly focusState: { readonly series: UnknownSeries | undefined }
    ) {}

    private getActive(): PickedNode | undefined {
        return this.activeState.stateValue();
    }

    private clear(): void {
        this.activeState.clear();
        this.lastNotifiedActive = undefined;
        this.candidates.length = 0;
        this.pendingPickedNodes = undefined;
    }

    private setSource(source: ActiveSource, node: PickedNode | undefined): void {
        if (node === undefined) {
            this.activeState.delete(source);
        } else {
            this.activeState.set(source, node);
        }
        this.syncActiveManager();
    }

    private syncActiveManager(): void {
        const resolved = this.getActive();
        const prev = this.lastNotifiedActive;
        if (resolved === prev) return;
        if (resolved !== undefined && prev !== undefined && pickedNodesEqual(resolved, prev)) return;

        this.lastNotifiedActive = resolved;
        if (resolved === undefined) {
            this.activeManager.clear();
        } else {
            const seriesId: string = resolved.series.id;
            const itemId: string | number = getItemId(resolved);
            this.activeManager.update({ type: 'series-node', seriesId, itemId }, resolved);
        }
    }

    private popPendingPickedNodes(): PickedNodes | undefined {
        const result = this.pendingPickedNodes;
        this.pendingPickedNodes = undefined;
        return result;
    }

    // Some user interactive (e.g. mouseleave, blur) has cleared the active datum.
    onClearUI(): void {
        this.activeManager.clear();
        this.clear();
    }

    // Active datum was cleared by ActiveManager (`setState` or legend).
    onClearAPI(): void {
        this.clear();
    }

    onPickedNodesHighlight(pickedNodes: PickedNodes | undefined): PickedNode | undefined {
        if (pickedNodes !== undefined) {
            const previousActive = this.getActive();
            if (this.tooltipProperties.pagination && previousActive !== undefined) {
                const tooltipMatch = pickedNodes.matches.find((m) => pickedNodesEqual(m, previousActive));
                if (tooltipMatch) {
                    return tooltipMatch;
                }
            }
        }

        const node = pickedNodes?.matches[0];
        this.setSource('highlight', node);
        return node;
    }

    onPickedNodesTooltip(pickedNodes: PickedNodes | undefined): TooltipCandidate {
        if (pickedNodes !== undefined && this.tooltipProperties.pagination) {
            const previous = this.getActive();
            const nextCandidates = pickedNodes.matches;

            this.candidates = nextCandidates;

            let nextIndex = indexOf(nextCandidates, previous);
            if (nextIndex === -1) nextIndex = 0;

            const node = nextCandidates[nextIndex];
            this.setSource('tooltip', node);

            const paginationState = { index: nextIndex, length: nextCandidates.length };
            return { active: node, paginationState };
        }

        const node = pickedNodes?.matches[0];
        this.setSource('tooltip', node);
        return { active: node };
    }

    onPickedNodesFocus(pickedFocus: PickFocusOutputs | undefined): void {
        const { series } = this.focusState;
        this.clear();
        if (series !== undefined && pickedFocus !== undefined) {
            this.setSource('focus', pickedFocus.datum);
        }
    }

    onPickedNodesAPI(debouncedPickedNodes: PickedNodes): PickedNode | undefined {
        this.pendingPickedNodes = debouncedPickedNodes;
        return debouncedPickedNodes.matches[0];
    }

    onPickedNodesAPIDebounced(): TooltipCandidate {
        return { active: this.onPickedNodesHighlight(this.popPendingPickedNodes()) };
    }

    nextCandidate(): TooltipCandidate {
        if (this.tooltipProperties.pagination) {
            const { candidates } = this;
            const previous = this.getActive();
            const hoverIndex = previous == null ? -1 : candidates.findIndex((c) => pickedNodesEqual(c, previous));
            if (hoverIndex === -1) return { active: undefined, paginationState: undefined };

            let nextIndex = hoverIndex + 1;
            if (nextIndex >= candidates.length) {
                nextIndex = 0;
            }
            const node = candidates[nextIndex];
            this.setSource('tooltip', node);

            const paginationState = { index: nextIndex, length: this.candidates.length };
            return { active: node, paginationState };
        }

        return { active: this.getActive() };
    }
}
