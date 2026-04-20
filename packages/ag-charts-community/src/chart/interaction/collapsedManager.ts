import { type MementoOriginator } from 'ag-charts-core';

import type { EventsHub } from '../../core/eventsHub';

type CollapsedMemento = string[];

export class CollapsedManager implements MementoOriginator<CollapsedMemento> {
    mementoOriginatorKey: string = 'collapsed';

    // Optimised for quick lookup since that will occur more often than mutation.
    private collapsedIds: Record<string, boolean> = {};

    constructor(private readonly eventsHub: EventsHub) {}

    createMemento(): CollapsedMemento {
        return Object.keys(this.collapsedIds);
    }

    guardMemento(blob: unknown): blob is CollapsedMemento | undefined {
        return blob == null || Array.isArray(blob);
    }

    restoreMemento(_version: string, _mementoVersion: string, blob: CollapsedMemento | undefined) {
        if (blob) {
            this.collapse(blob);
        }
        this.eventsHub.emit('collapsed:restore', { collapsed: this.createMemento() });
    }

    collapse(ids: string[]) {
        let changed = false;
        const after: Record<string, boolean> = {};
        for (const id of ids) {
            changed ||= !this.collapsedIds[id];
            after[id] = true;
        }
        this.collapsedIds = after;
        return changed;
    }

    collapseAppend(ids: string[]) {
        let changed = false;
        for (const id of ids) {
            changed ||= !this.collapsedIds[id];
            this.collapsedIds[id] = true;
        }
        return changed;
    }

    expand(ids: string[]) {
        let changed = false;
        for (const id of ids) {
            changed ||= Boolean(this.collapsedIds[id]);
            delete this.collapsedIds[id];
        }
        return changed;
    }

    isCollapsed(id: string) {
        return Boolean(this.collapsedIds[id]);
    }
}
