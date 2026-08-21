import type { _ModuleSupport } from 'ag-charts-community';
import type { RequireOptional } from 'ag-charts-core';
import type { AgSelectionChangeEvent, AgSelectionItem, AgSelectionItemIds } from 'ag-charts-types';

type DataSet = _ModuleSupport.DataSet<unknown>;
type SeriesId = AgSelectionItemIds['seriesId'];
type ItemId = AgSelectionItemIds['itemId'];
type Hash = string & { __brand_stable_hash: never };
type Entry = AgSelectionItem<unknown>;

function makeChangeItem(seriesId: SeriesId, data: DataSet, datumIndex: number): Entry {
    const itemId: ItemId = data.getItemIdFromIndex(datumIndex);
    const datum = data.getDatumAt(datumIndex);
    type Rules1 = RequireOptional<AgSelectionChangeEvent<unknown, unknown>['added'][number]>;
    type Rules2 = RequireOptional<AgSelectionChangeEvent<unknown, unknown>['removed'][number]>;
    return { seriesId, itemId, datum } satisfies Rules1 satisfies Rules2;
}

export class DataSelectionChangeMap {
    private readonly added = new Set<Hash>();
    private readonly removed = new Set<Hash>();
    private readonly memory = new Map<Hash, Entry>();

    private difference(self: Set<Hash>, other: Set<Hash>): Entry[] {
        // FIXME(2026-05-20): Consider using `Set.difference` (available in June 2024) once es-target is upgraded.
        const result: Entry[] = [];
        for (const hash of self) {
            if (!other.has(hash)) {
                const entry = this.memory.get(hash);
                if (entry) {
                    result.push(entry);
                }
            }
        }
        return result;
    }

    private remember(seriesId: SeriesId, data: DataSet, datumIndex: number): Hash {
        // The delimiter must be non-numeric: with '-', seriesId 'a-' at index 1 and seriesId 'a' at
        // index -1 both hash to "a--1".
        const hash = `${seriesId}|${datumIndex}` as Hash;

        // FIXME(2016-05-20): `has()` avoids the `makeChangeItem` allocation and its GC churn; replace with
        // getOrInsertComputed() once that is targetable.
        if (!this.memory.has(hash)) {
            this.memory.set(hash, makeChangeItem(seriesId, data, datumIndex));
        }
        return hash;
    }

    markAdded(seriesId: SeriesId, data: DataSet, datumIndex: number): void {
        const hash = this.remember(seriesId, data, datumIndex);
        this.added.add(hash);
    }

    markRemoved(seriesId: SeriesId, data: DataSet, datumIndex: number): void {
        const hash = this.remember(seriesId, data, datumIndex);
        this.removed.add(hash);
    }

    toAdded(): Entry[] {
        return this.difference(this.added, this.removed);
    }

    toRemoved(): Entry[] {
        return this.difference(this.removed, this.added);
    }
}
