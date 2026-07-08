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

    collapse(ids: (string | number)[]) {
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
        this.collapsedIds = after;
        if (changed) this.eventsHub.emit('collapsed:change', null);
        return changed;
    }

    collapseAppend(ids: (string | number)[]) {
        let changed = false;
        for (const id of ids) {
            const key = String(id);
            changed ||= !this.collapsedIds[key];
            this.collapsedIds[key] = true;
        }
        if (changed) this.eventsHub.emit('collapsed:change', null);
        return changed;
    }

    expand(ids: (string | number)[]) {
        let changed = false;
        for (const id of ids) {
            const key = String(id);
            changed ||= Boolean(this.collapsedIds[key]);
            delete this.collapsedIds[key];
        }
        if (changed) this.eventsHub.emit('collapsed:change', null);
        return changed;
    }

    isCollapsed(id: string | number) {
        return Boolean(this.collapsedIds[String(id)]);
    }
}
