import type { AgSelectionItemIds } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import { type AreExact } from 'ag-charts-core';

import type { DataSelectionChangeMap } from './dataSelectionChangeMap';
import type { DataSetSelection } from './dataSetSelection';

type SelectionChangesWithItems = { countDelta: number; items: DataSelectionChangeMap };
type SelectionChangesDeltaOnly = { countDelta: number; items?: never };
type Changes = SelectionChanges;

type Series = NonNullable<ClickedNode['series']>;
type DataSet = _ModuleSupport.DataSet<unknown>;
type Group = _ModuleSupport.Group<unknown>;

type ClickedNode = NonNullable<_ModuleSupport.SeriesAreaClickEvent['clickedNode']>;
type DragWidgetEvent = _ModuleSupport.DragWidgetEvent;

type Service = {
    clearSelection(): void;
    enableSelection(seriesId: string, dataSet: DataSet): DataSetSelection;
    iterateDataSetSelections(): Iterable<DataSetSelectionsIterator>;
};

export type DataSetSelectionsIterator = {
    seriesId: string;
    dataSet: DataSet;
    selection: DataSetSelection;
};

export type SelectionChanges = SelectionChangesWithItems | SelectionChangesDeltaOnly;

export function toStartAndLength(start: number, end: number): [number, number] {
    if (start > end) {
        [start, end] = [end, start];
    }
    return [start, end - start];
}

export function toCanvasBBox(seriesRoot: Group, event1: DragWidgetEvent, event2: DragWidgetEvent): _ModuleSupport.BBox {
    const [x, width] = toStartAndLength(event1.currentX, event2.currentX);
    const [y, height] = toStartAndLength(event1.currentY, event2.currentY);
    const seriesBounds = new _ModuleSupport.BBox(x, y, width, height);
    return _ModuleSupport.Transformable.toCanvas(seriesRoot, seriesBounds);
}

export function hasAddToSelectionModifier(event: { sourceEvent: { ctrlKey: boolean; metaKey: boolean } }): boolean {
    return event.sourceEvent.ctrlKey || event.sourceEvent.metaKey;
}

export function rollbackChanges(changes: SelectionChangesWithItems, service: Service): void {
    type K = Series['id'];
    type V = { dataSet: DataSet; selection: DataSetSelection };
    const seriesMap = new Map<K, V>();
    for (const { seriesId, dataSet, selection } of service.iterateDataSetSelections()) {
        seriesMap.set(seriesId, { dataSet, selection });
    }

    for (const change of changes.items.toAdded()) {
        const entry = seriesMap.get(change.seriesId);
        if (entry === undefined) return undefined;

        const datumIndex = entry.dataSet.getIndexFromItemId(change.itemId);
        if (datumIndex === undefined) continue;

        entry.selection.deselect(datumIndex);
    }

    for (const change of changes.items.toRemoved()) {
        const entry = seriesMap.get(change.seriesId);
        if (entry === undefined) continue;

        const datumIndex = entry.dataSet.getIndexFromItemId(change.itemId);
        if (datumIndex === undefined) continue;

        entry.selection.select(datumIndex);
    }
}

export function toggleSelection(changes: Changes, series: Series, srv: Service, datumIndex: number): void {
    const data = series.data;
    if (!data || !series.isDatumSelectable(datumIndex)) return;

    const selections = srv.enableSelection(series.id, data);
    const wasSelected = selections.isSelected(datumIndex);
    if (changes?.items !== undefined) {
        if (wasSelected) {
            changes.items.markRemoved(series.id, data, datumIndex);
        } else {
            changes.items.markAdded(series.id, data, datumIndex);
        }
    }
    changes.countDelta += selections.toggle(datumIndex);
}

export function setSelected(changes: Changes, series: Series, srv: Service, datumIndex: number): void {
    const data = series.data;
    if (!data || !series.isDatumSelectable(datumIndex)) return;

    const selections = srv.enableSelection(series.id, data);
    const wasSelected = selections.isSelected(datumIndex);
    if (changes.items !== undefined && !wasSelected) {
        changes.items.markAdded(series.id, data, datumIndex);
    }
    changes.countDelta += selections.select(datumIndex);
}

export function setSelectedRange(changes: Changes, series: Series, srv: Service, start: number, end: number): void {
    const data = series.data;
    if (!data) return;

    const selection = srv.enableSelection(series.id, data);
    changes.countDelta += selection.selectRange(start, end);
}

export function clearAllSelections(changes: Changes, srv: Service): void {
    if (changes.items !== undefined) {
        for (const { dataSet, seriesId, selection } of srv.iterateDataSetSelections()) {
            const n = selection.getLength();
            for (let datumIndex = 0; datumIndex < n; datumIndex++) {
                if (selection.isSelected(datumIndex)) {
                    changes.items.markRemoved(seriesId, dataSet, datumIndex);
                }
            }
        }
    }
    srv.clearSelection();
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
