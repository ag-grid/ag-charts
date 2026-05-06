import type { AgSelectionChangeEvent, AgSelectionItem, AgSelectionItemIds } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import { type AreExact, Logger, type RequireOptional } from 'ag-charts-core';

type ChangeItem = AgSelectionItem<unknown>;
type SelectionChangesWithItems = { countDelta: number; added: ChangeItem[]; removed: ChangeItem[] };
type SelectionChangesDeltaOnly = { countDelta: number; added?: never; removed?: never };
type Changes = SelectionChanges;

type Series = NonNullable<ClickedNode['series']>;
type DataSet = _ModuleSupport.DataSet<unknown>;
type State = _ModuleSupport.DataSelectionState;

type ClickedNode = NonNullable<_ModuleSupport.SeriesAreaClickEvent['clickedNode']>;
type DataSetSelection = _ModuleSupport.DataSetSelection;
type DragWidgetEvent = _ModuleSupport.DragWidgetEvent;

export type SelectionChanges = SelectionChangesWithItems | SelectionChangesDeltaOnly;

function makeChangeItem(seriesId: string, data: DataSet, datumIndex: number): ChangeItem {
    const itemId = data.getItemIdFromIndex(datumIndex);
    const datum = data.data[datumIndex];
    type Rules1 = RequireOptional<AgSelectionChangeEvent<unknown, unknown>['added'][number]>;
    type Rules2 = RequireOptional<AgSelectionChangeEvent<unknown, unknown>['removed'][number]>;
    return { seriesId, itemId, datum } satisfies Rules1 satisfies Rules2;
}

export function toStartAndLength(start: number, end: number): [number, number] {
    if (start > end) {
        [start, end] = [end, start];
    }
    return [start, end - start];
}

export function toBBox(event1: DragWidgetEvent, event2: DragWidgetEvent): _ModuleSupport.BBox {
    const [x, width] = toStartAndLength(event1.currentX, event2.currentX);
    const [y, height] = toStartAndLength(event1.currentY, event2.currentY);
    return new _ModuleSupport.BBox(x, y, width, height);
}

export function hasAddToSelectionModifier(event: { sourceEvent: { ctrlKey: boolean; metaKey: boolean } }): boolean {
    return event.sourceEvent.ctrlKey || event.sourceEvent.metaKey;
}

export function rollbackChanges(changes: SelectionChangesWithItems, allSeries: Series[]): void {
    type K = Series['id'];
    type V = { dataSet: DataSet; selection: DataSetSelection };
    const seriesMap = new Map<K, V>();
    for (const dataSet of getAllDataSets(allSeries)) {
        for (const [seriesId, selection] of dataSet.selections) {
            seriesMap.set(seriesId, { dataSet, selection });
        }
    }

    for (const change of changes.added) {
        const entry = seriesMap.get(change.seriesId);
        if (entry === undefined) return undefined;

        const datumIndex = entry.dataSet.getIndexFromItemId(change.itemId);
        if (datumIndex === undefined) continue;

        entry.selection.deselect(datumIndex);
    }

    for (const change of changes.removed) {
        const entry = seriesMap.get(change.seriesId);
        if (entry === undefined) continue;

        const datumIndex = entry.dataSet.getIndexFromItemId(change.itemId);
        if (datumIndex === undefined) continue;

        entry.selection.select(datumIndex);
    }
}

export function getAllDataSets(allSeries: Series[]): Set<DataSet> {
    const result = new Set<DataSet>();
    for (const series of allSeries) {
        if (series.data) {
            result.add(series.data);
        }
    }
    return result;
}

export function toggleSelection(changes: Changes, series: Series, data: DataSet, datumIndex: number): void {
    const selections = data.enableSelection(series.id);
    const wasSelected = selections.isSelected(datumIndex);
    if (changes?.removed !== undefined) {
        const item = makeChangeItem(series.id, data, datumIndex);
        if (wasSelected) {
            changes.removed.push(item);
        } else {
            changes.added.push(item);
        }
    }
    changes.countDelta += wasSelected ? -1 : 1;
    selections.toggle(datumIndex);
}

export function setSelected(changes: Changes, series: Series, data: DataSet, datumIndex: number): void {
    const selections = data.enableSelection(series.id);
    const wasSelected = selections.isSelected(datumIndex);
    if (changes.added !== undefined && !wasSelected) {
        changes.added.push(makeChangeItem(series.id, data, datumIndex));
    }
    changes.countDelta += Number(!wasSelected);
    selections.select(datumIndex);
}

export function setSelectedRange(changes: Changes, series: Series, data: DataSet, start: number, end: number): void {
    const selection = data.enableSelection(series.id);
    selection.selectRange(start, end);
    changes.countDelta += end - start; // TODO: incorrect - need to substract the current count within this range
}

export function clearAllSelections(changes: Changes, state: State, allSeries: Series[]): void {
    const dataSets = getAllDataSets(allSeries);
    if (changes.removed !== undefined) {
        for (const data of dataSets) {
            for (const [seriesId, selection] of data.selections) {
                const n = selection.getLength();
                for (let datumIndex = 0; datumIndex < n; datumIndex++) {
                    changes.removed.push(makeChangeItem(seriesId, data, datumIndex));
                }
            }
        }
    }
    for (const data of dataSets) {
        data.selections.clear();
    }
    state.selectedCount = 0;
}

export function isUnknownIterable(value: unknown): value is Iterable<unknown> {
    return (
        typeof value === 'object' &&
        value !== null &&
        Symbol.iterator in value &&
        typeof value[Symbol.iterator] === 'function'
    );
}

export function isAgSelectionItem(item: unknown): item is AgSelectionItemIds {
    if (
        typeof item === 'object' &&
        item !== null &&
        'seriesId' in item &&
        'itemId' in item &&
        typeof item['seriesId'] === 'string' &&
        (typeof item['itemId'] === 'number' || typeof item['itemId'] === 'string')
    ) {
        // Compile-time check that our if-statement condition results in types that assignable
        // to the expected `AgSelectionItemIds` type.
        type VerifiedType = { seriesId: typeof item.seriesId; itemId: typeof item.itemId };
        return true satisfies AreExact<VerifiedType, AgSelectionItemIds>;
    }
    return false;
}

export function asNumericDatumIndex(datumIndex: _ModuleSupport.DatumIndexType): datumIndex is number {
    if (typeof datumIndex === 'number') {
        return true;
    } else {
        Logger.errorOnce(`unsupported datumIndex type: ${typeof datumIndex}`);
        return false;
    }
}
