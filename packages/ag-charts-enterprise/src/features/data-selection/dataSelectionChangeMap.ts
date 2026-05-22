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
    const datum = data.data[datumIndex];
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
        // The hash should be both fast and collision-free for our inputs.
        // While `JSON.stringify` guarantees uniqueness, it is slower and creates
        // unnecessary allocations compared to simple string concatenation.
        //
        // A naive `${seriesId}-${itemId}` approach is unsafe when `itemId` is a string.
        // For example:
        //   { seriesId: 'a',   itemId: '1-b' }  -> "a-1-b"
        //   { seriesId: 'a-1', itemId: 'b'   }  -> "a-1-b"
        //
        // In this code path, `datumIndex` is always a number, which removes that ambiguity.
        // However, using '-' as a delimiter is still unsafe due to negative numbers:
        //   { seriesId: 'a-', datumIndex: 1  }  -> "a--1"
        //   { seriesId: 'a',  datumIndex: -1 }  -> "a--1"
        //
        // Using a non-numeric delimiter like '|' avoids this issue.
        const hash = `${seriesId}|${datumIndex}` as Hash;

        // FIXME(2016-05-20): The `has()` calls serves to avoid the unnecessary object-memory allocation via
        // `makeChangeItem` which can cause GC memory churn. We could eventually switch to getOrInsertComputed()
        // (available since Feb 2026) some day.
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
