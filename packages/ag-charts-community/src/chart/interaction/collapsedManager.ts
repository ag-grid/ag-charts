import { type MementoOriginator } from 'ag-charts-core';
import type { AgCollapsedChangeEventSource } from 'ag-charts-types';

import type { EventsHub } from '../../core/eventsHub';
import type { ChartService } from '../chartService';

type CollapsedMemento = string[];
type CollapsedItemID = string | number;

export class CollapsedManager implements MementoOriginator<CollapsedMemento> {
    mementoOriginatorKey: string = 'collapsed';

    // Optimised for quick lookup since that will occur more often than mutation.
    private collapsedIds: Record<string, boolean> = {};

    private getDatum: Record<string, (id: CollapsedItemID) => unknown> = {};

    constructor(
        private readonly eventsHub: EventsHub,
        private readonly chartService: ChartService
    ) {}

    createMemento(): CollapsedMemento {
        return Object.keys(this.collapsedIds);
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
        const after: Record<string, boolean> = {};
        for (const id of ids) {
            const key = String(id);
            changed ||= !this.collapsedIds[key];
            after[key] = true;
        }

        // Detect implicit expansions: previous map ids missing from `after` are now expanded.
        if (!changed) {
            for (const prevId of Object.keys(this.collapsedIds)) {
                if (!after[prevId]) {
                    changed = true;
                    break;
                }
            }
        }

        const change = { collapsedIds: after, changed };

        const defaultPrevented = this.callListener(change, seriesId, source);
        if (defaultPrevented) return false;

        return this.applyChange(change);
    }

    collapseAppend(ids: CollapsedItemID[], seriesId: string | undefined, source: AgCollapsedChangeEventSource) {
        let changed = false;
        const after = { ...this.collapsedIds };
        for (const id of ids) {
            const key = String(id);
            changed ||= !after[key];
            after[key] = true;
        }

        const change = { collapsedIds: after, changed };

        const defaultPrevented = this.callListener(change, seriesId, source);
        if (defaultPrevented) return false;

        return this.applyChange(change);
    }

    expand(ids: CollapsedItemID[], seriesId: string | undefined, source: AgCollapsedChangeEventSource) {
        let changed = false;

        const after = { ...this.collapsedIds };
        for (const id of ids) {
            const key = String(id);
            changed ||= Boolean(after[key]);
            delete after[key];
        }

        const change = { collapsedIds: after, changed };

        const defaultPrevented = this.callListener(change, seriesId, source);
        if (defaultPrevented) return false;

        return this.applyChange(change);
    }

    isCollapsed(id: CollapsedItemID) {
        return Boolean(this.collapsedIds[String(id)]);
    }

    private callListener(
        { collapsedIds, changed }: { collapsedIds: Record<string, boolean>; changed: boolean },
        seriesId: string | undefined,
        source: AgCollapsedChangeEventSource
    ) {
        if (!changed) return;

        let defaultPrevented = false;
        const preventDefault = () => {
            defaultPrevented = true;
        };

        const getDatum = seriesId ? this.getDatum[seriesId] : undefined;

        this.chartService.callListener({
            type: 'collapsedChange',
            source,
            preventDefault,
            collapsed: Object.keys(collapsedIds).map((id) => ({
                itemId: id,
                datum: getDatum ? getDatum(id) : null,
            })),
        });

        return defaultPrevented;
    }

    private applyChange({ collapsedIds, changed }: { collapsedIds: Record<string, boolean>; changed: boolean }) {
        if (!changed) return false;

        this.collapsedIds = collapsedIds;
        this.eventsHub.emit('collapsed:change', null);

        return true;
    }
}
