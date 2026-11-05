<script lang="ts">
import type { GridApi, IRowNode, ValueFormatterParams } from 'ag-grid-community';

import { fmtDate } from '../format';
import type { TrackedShipment } from '../types';

const dateFormatter = ({ value }: ValueFormatterParams<TrackedShipment, number>) =>
    value == null ? '' : fmtDate(value);

/** Brings the grid's row selection into line with the shared shipment selection. */
function mirrorSelection(api: GridApi<TrackedShipment>, selectedShipmentIds: string[]) {
    const selected = new Set(selectedShipmentIds);
    const toSelect: IRowNode<TrackedShipment>[] = [];
    const toDeselect: IRowNode<TrackedShipment>[] = [];
    api.forEachNode((node) => {
        const wanted = node.data != null && selected.has(node.data.shipmentId);
        if (wanted && !node.isSelected()) toSelect.push(node);
        if (!wanted && node.isSelected()) toDeselect.push(node);
    });
    if (toSelect.length > 0) api.setNodesSelected({ nodes: toSelect, newValue: true, source: 'api' });
    if (toDeselect.length > 0) api.setNodesSelected({ nodes: toDeselect, newValue: false, source: 'api' });
}
</script>

<script setup lang="ts">
import type {
    ColDef,
    GetRowIdParams,
    GridReadyEvent,
    RowSelectionOptions,
    SelectionChangedEvent,
} from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';
import { shallowRef, watch } from 'vue';

import { fmtCurrencyCompact } from '../format';
import { baseColDef, compactGridTheme } from '../grid';
import StatusCell from './StatusCell.vue';

/**
 * The arrival schedule's tabular twin: one row per shipment with the figures the schedule's bars
 * and tooltips carry, soonest required first as the schedule's axis is. Selecting a row selects its
 * shipment, exactly as clicking its bar does.
 */
const props = defineProps<{
    shipments: TrackedShipment[];
    /** The shipments currently selected; empty when none is. */
    selectedShipmentIds: string[];
}>();

const emit = defineEmits<{
    /** The user changed the selection on the grid. */
    selectionChange: [added: string[], removed: string[]];
}>();

// The grid's API, which React reaches through the component ref.
const gridApi = shallowRef<GridApi<TrackedShipment>>();
const defaultColDef = { ...baseColDef<TrackedShipment>(), filter: false };

const columnDefs: ColDef<TrackedShipment>[] = [
    { field: 'shipmentId', headerName: 'Shipment', maxWidth: 80, pinned: 'left' },
    {
        field: 'status',
        headerName: 'Status',
        maxWidth: 80,
        pinned: 'left',
        cellClass: 'pc-cell-centred',
        cellRenderer: StatusCell,
    },
    {
        colId: 'lane',
        headerName: 'Lane',
        minWidth: 200,
        flex: 2,
        valueGetter: ({ data }) => (data == null ? '' : `${data.supplierName} → ${data.plantName}`),
    },
    { field: 'material', headerName: 'Cargo', minWidth: 120 },
    {
        field: 'value',
        headerName: 'Value',
        minWidth: 90,
        type: 'rightAligned',
        valueFormatter: ({ value }) => (value == null ? '' : fmtCurrencyCompact(value)),
    },
    { field: 'departDate', headerName: 'Dispatched', minWidth: 110, valueFormatter: dateFormatter },
    {
        field: 'projectedDate',
        headerName: 'Projected arrival',
        minWidth: 130,
        valueFormatter: dateFormatter,
    },
    {
        field: 'requiredDate',
        headerName: 'Required by',
        minWidth: 110,
        sort: 'asc',
        valueFormatter: dateFormatter,
    },
];

// Click selects one shipment, Ctrl/Cmd-click adds or removes one — as on the schedule.
const rowSelection: RowSelectionOptions<TrackedShipment> = {
    mode: 'multiRow',
    checkboxes: false,
    headerCheckbox: false,
    enableClickSelection: true,
};

const getRowId = ({ data }: GetRowIdParams<TrackedShipment>) => data.shipmentId;

watch(
    [() => props.selectedShipmentIds, () => props.shipments],
    ([selectedShipmentIds]) => {
        const api = gridApi.value;
        if (api != null) mirrorSelection(api, selectedShipmentIds);
    },
    { flush: 'post' }
);

function onGridReady({ api }: GridReadyEvent<TrackedShipment>) {
    gridApi.value = api;
    mirrorSelection(api, props.selectedShipmentIds);
}

function onSelectionChanged({ api, source }: SelectionChangedEvent<TrackedShipment>) {
    // Our own mirroring echoes back as an api change; reacting to it would loop.
    if (source.startsWith('api') || source === 'rowDataChanged' || source === 'gridInitializing') return;
    const now = new Set(api.getSelectedRows().map((row) => row.shipmentId));
    const before = new Set(props.selectedShipmentIds);
    emit(
        'selectionChange',
        [...now].filter((id) => !before.has(id)),
        [...before].filter((id) => !now.has(id))
    );
}
</script>

<template>
    <div class="pc-grid-host pc-grid-host--fill">
        <AgGridVue
            :theme="compactGridTheme"
            :row-data="shipments"
            :column-defs="columnDefs"
            :default-col-def="defaultColDef"
            :get-row-id="getRowId"
            :row-selection="rowSelection"
            :row-height="36"
            :header-height="38"
            :style="{ height: '100%', width: '100%' }"
            @grid-ready="onGridReady"
            @selection-changed="onSelectionChanged"
        />
    </div>
</template>
