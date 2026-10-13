<script setup lang="ts" generic="T extends { ticker: string }">
import {
    type CellKeyDownEvent,
    type ColDef,
    type FirstDataRenderedEvent,
    type FullWidthCellKeyDownEvent,
    type GridApi,
    type GridReadyEvent,
    type RowClickedEvent,
    type RowSelectionOptions,
} from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';
import { watch } from 'vue';

import { baseColDef, getRowId, gridTheme, rowValuesEqual } from './grid';

// A titled watchlist-style grid: a fixed row set whose values stream in place,
// with the active ticker highlighted and rows selectable.
const props = defineProps<{
    title: string;
    gridClassName: string;
    columnDefs: ColDef<T>[];
    rowData: T[];
    activeTicker: string;
}>();
const emit = defineEmits<{ select: [ticker: string] }>();

// Selection carries the active highlight, so moving it must never tear down a row's cell renderers.
const rowSelection: RowSelectionOptions = { mode: 'singleRow', checkboxes: false };

const defaultColDef = baseColDef<T>();

// The grid hands its API over once ready, a tick after mount.
let api: GridApi<T> | undefined;
const onGridReady = (event: GridReadyEvent<T>) => {
    api = event.api;
};

// OPTIMIZATION: the row set never changes shape, so seed once and stream only the changed rows
// as transactions — the grid refreshes those cells in place instead of diffing a fresh array.
const initialRowData = props.rowData;
const seenRows = new Map<string, T>(props.rowData.map((row) => [row.ticker, row]));
watch(
    () => props.rowData,
    (rowData) => {
        if (!api) return;
        const update: T[] = [];
        for (const row of rowData) {
            const previous = seenRows.get(row.ticker);
            if (!previous || !rowValuesEqual(previous, row)) update.push(row);
            seenRows.set(row.ticker, row);
        }
        if (update.length > 0) api.applyTransactionAsync({ update });
    }
);

// No API before the grid signals ready, so the first sync takes the one the grid hands it.
function syncSelection(readyApi: GridApi<T> | undefined = api) {
    if (!readyApi) return;
    const node = readyApi.getRowNode(props.activeTicker);
    // A ticker belongs to one list, so the lists without it clear theirs and one row stays selected.
    if (node) readyApi.setNodesSelected({ nodes: [node], newValue: true });
    else readyApi.deselectAll();
}
watch(
    () => props.activeTicker,
    () => syncSelection()
);
const onFirstDataRendered = ({ api: readyApi }: FirstDataRenderedEvent<T>) => syncSelection(readyApi);

const onRowClicked = ({ data }: RowClickedEvent<T>) => data && emit('select', data.ticker);

const onCellKeyDown = ({ event, data }: CellKeyDownEvent<T> | FullWidthCellKeyDownEvent<T>) => {
    if (!data || !(event instanceof KeyboardEvent)) return;
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        emit('select', data.ticker);
    }
};
</script>

<template>
    <div class="fin-section">
        <h3 class="fin-section-title">{{ title }}</h3>
        <div :class="gridClassName">
            <AgGridVue
                :theme="gridTheme"
                :row-data="initialRowData"
                :get-row-id="getRowId"
                :column-defs="columnDefs"
                :default-col-def="defaultColDef"
                :row-selection="rowSelection"
                dom-layout="autoHeight"
                :row-height="28"
                :header-height="30"
                @grid-ready="onGridReady"
                @first-data-rendered="onFirstDataRendered"
                @row-clicked="onRowClicked"
                @cell-key-down="onCellKeyDown"
            />
        </div>
    </div>
</template>
