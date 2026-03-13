import { objectsEqual } from 'ag-charts-core';
import type { AgActiveItemState } from 'ag-charts-types';

import type { ActiveManager } from '../interaction/activeManager';
import type { DatumIndexType, SeriesNodeDatum } from './seriesTypes';

// Strict `ActiveManager.update` args (both defined, or both undefined):
type ActivationArgs =
    | [NonNullable<Parameters<ActiveManager['update']>[0]>, NonNullable<Parameters<ActiveManager['update']>[1]>]
    | [undefined, undefined];

type ActivationOptsNoArg = { defaultCbArg?: never };
type ActivationOptsWithArg<A> = { defaultCbArg: A };
type ActivationOpts<A> = ActivationOptsNoArg | ActivationOptsWithArg<A>;

export type PickedNode = SeriesNodeDatum<DatumIndexType>;

export type PickedNodes = {
    matches: PickedNode[];
    distance: number;
};

export function getItemId(node: PickedNode, dataIdKey?: string): NonNullable<AgActiveItemState['itemId']> {
    if (node.itemId !== undefined) {
        return node.itemId;
    }
    if (dataIdKey !== undefined) {
        const idValue = (node.datum as any)?.[dataIdKey];
        if (idValue != null) {
            return typeof idValue === 'number' ? idValue : String(idValue);
        }
    }
    if (typeof node.datumIndex === 'number') {
        return node.datumIndex;
    }
    return JSON.stringify(node.datumIndex);
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
    private active: PickedNode | undefined;
    private candidates: PickedNode[] = [];
    private pendingPickedNodes?: PickedNodes;
    private blockEntrance = false;
    private deactivationPrevented = false;

    constructor(
        private readonly activeManager: ActiveManager,
        private readonly tooltipProperties: { readonly pagination: boolean }
    ) {}

    private clear(): void {
        this.candidates.length = 0;
        this.pendingPickedNodes = undefined;
    }

    private popPendingPickedNodes(): PickedNodes | undefined {
        const result = this.pendingPickedNodes;
        this.pendingPickedNodes = undefined;
        return result;
    }

    private getActivationArgs(desiredActive: PickedNode | undefined): ActivationArgs {
        if (desiredActive === undefined) {
            return [undefined, undefined];
        } else {
            const seriesId: string = desiredActive.series.id;
            const itemId: string | number = getItemId(desiredActive, desiredActive.series.data?.dataIdKey);
            return [{ type: 'series-node', seriesId, itemId }, desiredActive];
        }
    }

    /**
     * Dispatch a preventable `'activeChange'` event.
     * If `AgActiveChangeEvent.preventDefault()` was not called, then run `defaultCb(opts.defaultCbArg)`.
     *
     * Reentrance is not allowed. Example:
     *
     *     pickManager.maybeActivate(myNode, () => {
     *         if (isValid(myNode)) {
     *             renderHighlight();
     *         } else {
     *             // !!! DO NOT DO THIS !!!
     *             // It will incorrectly broadcast 2 activeChange API events!
     *             // Either `myNode` OR `undefined` should be broadcast but not both.
     *             pickManager.maybeActivate(undefined, () => clearHighlight());
     *         }
     *     });
     */
    maybeActivate(node: PickedNode | undefined, defaultCb: () => void, opts?: ActivationOptsNoArg): void;
    maybeActivate<A>(node: PickedNode | undefined, defaultCb: (a: A) => void, opts: ActivationOptsWithArg<A>): void;
    maybeActivate<A>(node: PickedNode | undefined, defaultCb: (a?: A) => void, opts?: ActivationOpts<A>): void {
        if (this.blockEntrance) throw new Error('PickManager.maybeActivate is not re-entrant');
        try {
            this.deactivationPrevented = false;
            this.blockEntrance = true;
            const [newItemState, nodeDatum]: ActivationArgs = this.getActivationArgs(node);
            const defaultPrevented: boolean = this.activeManager.update(newItemState, nodeDatum);
            if (defaultPrevented) {
                this.deactivationPrevented = node === undefined;
            } else {
                this.active = node;
                defaultCb(opts?.defaultCbArg);
            }
        } finally {
            this.blockEntrance = false;
        }
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
            const previousActive = this.active;
            if (this.tooltipProperties.pagination && previousActive !== undefined) {
                const tooltipMatch = pickedNodes.matches.find((m) => pickedNodesEqual(m, previousActive));
                if (tooltipMatch) {
                    return tooltipMatch;
                }
            }
        }

        const node = pickedNodes?.matches[0];
        return node;
    }

    onPickedNodesTooltip(pickedNodes: PickedNodes | undefined): TooltipCandidate {
        if (pickedNodes !== undefined && this.tooltipProperties.pagination) {
            const previous = this.active;
            const nextCandidates = pickedNodes.matches;

            this.candidates = nextCandidates;

            let nextIndex = indexOf(nextCandidates, previous);
            if (nextIndex === -1) nextIndex = 0;

            const node = nextCandidates[nextIndex];
            const paginationState = { index: nextIndex, length: nextCandidates.length };
            return { active: node, paginationState };
        }

        const node = pickedNodes?.matches[0];
        return { active: node };
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
            const previous = this.active;
            const hoverIndex = previous == null ? -1 : candidates.findIndex((c) => pickedNodesEqual(c, previous));
            if (hoverIndex === -1) return { active: undefined, paginationState: undefined };

            let nextIndex = hoverIndex + 1;
            if (nextIndex >= candidates.length) {
                nextIndex = 0;
            }
            const node = candidates[nextIndex];
            const paginationState = { index: nextIndex, length: this.candidates.length };
            return { active: node, paginationState };
        }

        return { active: this.active };
    }

    wasDeactivationPrevented(): boolean {
        return this.deactivationPrevented;
    }
}
