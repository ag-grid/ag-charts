import type { AgSelectionChangeEvent, AgSelectionItem, AgSelectionItemIds } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import { type AreExact, Logger } from 'ag-charts-core';

type ClickedNode = NonNullable<_ModuleSupport.SeriesAreaClickEvent['clickedNode']>;
type Series = NonNullable<ClickedNode['series']>;
type DataSet = _ModuleSupport.DataSet<unknown>;
type ChartService = _ModuleSupport.ChartRegistry['chartService'];
type DragWidgetEvent = _ModuleSupport.DragWidgetEvent;

export type BufferMap = Map<string, Uint8Array>;
export type BufferDiff = Pick<AgSelectionChangeEvent<unknown, never>, 'added' | 'removed'>;

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

export function copySelectionBuffers(chartService: ChartService): BufferMap | undefined {
    if (!chartService.hasListener('selectionChange')) return undefined;

    const result: BufferMap = new Map();
    for (const series of chartService.series) {
        const { data } = series;
        if (data === undefined) continue;

        const selection = data.enableSelection(series.id);
        const buffer = selection.copyBuffer();
        result.set(series.id, buffer);
    }
    return result;
}

export function restoreSelectionBuffers(chartService: ChartService, bufferMap: BufferMap): void {
    for (const series of chartService.series) {
        const data = series.data;
        if (data === undefined) continue;

        const buffer = bufferMap.get(series.id);
        if (buffer === undefined) continue;

        const selection = data.enableSelection(series.id);
        selection.restoreBuffer(buffer);
    }
}

export function diffSelectionBuffers(chartService: ChartService, bufferMap: BufferMap): BufferDiff {
    const added: AgSelectionItem<unknown>[] = [];
    const removed: AgSelectionItem<unknown>[] = [];

    function makeAgSelectionItem(seriesId: string, index: number, data: DataSet): AgSelectionItem<unknown> {
        const datum = data.data[index];
        const itemId = data.getIdArray()?.[index] ?? index;
        return { seriesId, datum, itemId };
    }

    for (const series of chartService.series) {
        const data = series.data;
        if (data === undefined) continue;

        const oldBuffer = bufferMap.get(series.id);
        if (oldBuffer === undefined) continue;

        const selection = data.enableSelection(series.id);
        const newBuffer = selection.getSelection();

        if (oldBuffer.length !== newBuffer.length) {
            Logger.error(`length mismatch (seriesId: ${series.id}): ${oldBuffer.length} !== ${newBuffer.length}`);
            continue;
        }

        for (let i = 0; i < oldBuffer.length; i++) {
            if (oldBuffer[i] && !newBuffer[i]) {
                removed.push(makeAgSelectionItem(series.id, i, data));
            } else if (!oldBuffer[i] && newBuffer[i]) {
                added.push(makeAgSelectionItem(series.id, i, data));
            }
        }
    }
    return { added, removed };
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

export function toggleSelection(series: Series, data: DataSet, datumIndex: number): void {
    const selections = data.enableSelection(series.id);
    selections.toggle(datumIndex);
}

export function setSelected(series: Series, data: DataSet, datumIndex: number): void {
    const selections = data.enableSelection(series.id);
    selections.select(datumIndex);
}

export function clearAllSelections(allSeries: Series[]): void {
    const dataSets = getAllDataSets(allSeries);
    for (const data of dataSets) {
        data.selections.clear();
    }
    for (const series of allSeries) {
        series.events.emit('data-selection-change', null);
    }
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
