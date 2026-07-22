import { type MementoOriginator } from 'ag-charts-core';
import type { AgCollapsedChangeEventSource } from 'ag-charts-types';

import type { EventsHub } from '../../core/eventsHub';
import type { ChartService } from '../chartService';

type CollapsedItemID = string | number;
type CollapsedMemento = CollapsedItemID[];

export class CollapsedManager implements MementoOriginator<CollapsedMemento> {
    mementoOriginatorKey: string = 'collapsed';

    // Optimised for quick lookup since that will occur more often than mutation.
    private collapsedIds: Set<CollapsedItemID> = new Set();

    private getDatum: Record<string, (id: CollapsedItemID) => unknown> = {};

    constructor(
        private readonly eventsHub: EventsHub,
        private readonly chartService: ChartService
    ) {}

    createMemento(): CollapsedMemento {
        return Array.from(this.collapsedIds);
    }

    guardMemento(blob: unknown): blob is CollapsedMemento | undefined {
        return blob == null || Array.isArray(blob);
    }

    restoreMemento(_version: string, _mementoVersion: string, blob: CollapsedMemento | undefined) {
        if (blob) {
            const defaultGetDatumSeriesId = Object.keys(this.getDatum).at(0);
            this.collapse(blob, defaultGetDatumSeriesId, 'api-call');
        }
        this.eventsHub.emit('collapsed:restore', { collapsed: this.createMemento() });
    }

    setSeriesGetDatumCallback(seriesId: string, getDatum: (id: CollapsedItemID) => unknown) {
        this.getDatum[seriesId] = getDatum;
        return () => {
            delete this.getDatum[seriesId];
        };
    }

    collapse(ids: CollapsedItemID[], seriesId: string | undefined, source: AgCollapsedChangeEventSource) {
        let changed = false;

        const after: Set<CollapsedItemID> = new Set();
        const justCollapsed: CollapsedItemID[] = [];
        const justExpanded: CollapsedItemID[] = [];

        for (const id of ids) {
            const just = !this.collapsedIds.has(id);
            if (just) justCollapsed.push(id);
            changed ||= just;
            after.add(id);
        }

        // Detect implicit expansions: previous map ids missing from `after` are now expanded.
        for (const prevId of this.collapsedIds) {
            const just = !after.has(prevId);
            if (just) justExpanded.push(prevId);
            changed ||= just;
        }

        const defaultPrevented = this.callListener(justCollapsed, justExpanded, seriesId, source);
        if (defaultPrevented) return false;

        return this.applyChange(after, changed);
    }

    collapseAppend(ids: CollapsedItemID[], seriesId: string | undefined, source: AgCollapsedChangeEventSource) {
        let changed = false;

        const after = new Set(this.collapsedIds);
        const justCollapsed: CollapsedItemID[] = [];

        for (const id of ids) {
            const just = !after.has(id);
            if (just) justCollapsed.push(id);
            changed ||= just;
            after.add(id);
        }

        const defaultPrevented = this.callListener(justCollapsed, [], seriesId, source);
        if (defaultPrevented) return false;

        return this.applyChange(after, changed);
    }

    expand(ids: CollapsedItemID[], seriesId: string | undefined, source: AgCollapsedChangeEventSource) {
        let changed = false;

        const after = new Set(this.collapsedIds);
        const justExpanded: CollapsedItemID[] = [];

        for (const id of ids) {
            const just = after.has(id);
            if (just) justExpanded.push(id);
            changed ||= just;
            after.delete(id);
        }

        const defaultPrevented = this.callListener([], justExpanded, seriesId, source);
        if (defaultPrevented) return false;

        return this.applyChange(after, changed);
    }

    isCollapsed(id: CollapsedItemID) {
        return this.collapsedIds.has(id);
    }

    private callListener(
        justCollapsed: CollapsedItemID[],
        justExpanded: CollapsedItemID[],
        seriesId: string | undefined,
        source: AgCollapsedChangeEventSource
    ) {
        if (justCollapsed.length === 0 && justExpanded.length === 0) return;

        let defaultPrevented = false;
        const preventDefault = () => {
            defaultPrevented = true;
        };

        const getDatum = seriesId ? this.getDatum[seriesId] : undefined;

        this.chartService.callListener({
            type: 'collapsedChange',
            source,
            preventDefault,
            collapsed: justCollapsed.map((id) => ({
                itemId: id,
                datum: getDatum ? getDatum(id) : null,
            })),
            expanded: justExpanded.map((id) => ({
                itemId: id,
                datum: getDatum ? getDatum(id) : null,
            })),
        });

        return defaultPrevented;
    }

    private applyChange(collapsedIds: Set<CollapsedItemID>, changed: boolean) {
        if (!changed) return false;

        this.collapsedIds = collapsedIds;
        this.eventsHub.emit('collapsed:change', null);

        return true;
    }
}
