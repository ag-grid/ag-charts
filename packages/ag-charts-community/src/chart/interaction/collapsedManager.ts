import { type MementoOriginator } from 'ag-charts-core';
import type { AgCollapsedChangeEventSource } from 'ag-charts-types';

import type { EventsHub } from '../../core/eventsHub';
import type { ChartService } from '../chartService';

type CollapsedMemento = string[];

export class CollapsedManager implements MementoOriginator<CollapsedMemento> {
    mementoOriginatorKey: string = 'collapsed';

    // Optimised for quick lookup since that will occur more often than mutation.
    private collapsedIds: Record<string, boolean> = {};

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
            this.collapse(blob, 'api-call', () => null);
        }
        this.eventsHub.emit('collapsed:restore', { collapsed: this.createMemento() });
    }

    collapse(ids: (string | number)[], source: AgCollapsedChangeEventSource, getDatum: (id: string) => unknown) {
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

        const defaultPrevented = this.callListener(change, source, getDatum);
        if (defaultPrevented) return false;

        return this.applyChange(change);
    }

    collapseAppend(ids: (string | number)[], source: AgCollapsedChangeEventSource, getDatum: (id: string) => unknown) {
        let changed = false;
        const after = { ...this.collapsedIds };
        for (const id of ids) {
            const key = String(id);
            changed ||= !after[key];
            after[key] = true;
        }

        const change = { collapsedIds: after, changed };

        const defaultPrevented = this.callListener(change, source, getDatum);
        if (defaultPrevented) return false;

        return this.applyChange(change);
    }

    expand(ids: (string | number)[], source: AgCollapsedChangeEventSource, getDatum: (id: string) => unknown) {
        let changed = false;

        const after = { ...this.collapsedIds };
        for (const id of ids) {
            const key = String(id);
            changed ||= Boolean(after[key]);
            delete after[key];
        }

        const change = { collapsedIds: after, changed };

        const defaultPrevented = this.callListener(change, source, getDatum);
        if (defaultPrevented) return false;

        return this.applyChange(change);
    }

    isCollapsed(id: string | number) {
        return Boolean(this.collapsedIds[String(id)]);
    }

    private callListener(
        { collapsedIds, changed }: { collapsedIds: Record<string, boolean>; changed: boolean },
        source: AgCollapsedChangeEventSource,
        getDatum: (id: string) => unknown
    ) {
        if (!changed) return;

        let defaultPrevented = false;
        const preventDefault = () => {
            defaultPrevented = true;
        };

        this.chartService.callListener({
            type: 'collapsedChange',
            source,
            preventDefault,
            collapsed: Object.keys(collapsedIds).map((id) => ({
                itemId: id,
                datum: getDatum(id),
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
