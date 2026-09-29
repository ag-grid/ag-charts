<script lang="ts">
import type { ValueFormatterParams } from 'ag-grid-community';

import { fmtDate } from '../format';
import type { PurchaseOrder } from '../types';

const dateFormatter = ({ value }: ValueFormatterParams<PurchaseOrder, number | null>) =>
    value == null ? '—' : fmtDate(value);
</script>

<script setup lang="ts">
import type { ColDef } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';
import { computed } from 'vue';

import { fmtCurrency, fmtInt, fmtPrice } from '../format';
import { DATE_FILTER_PARAMS, NUMBER_FILTER_PARAMS, baseColDef, gridTheme } from '../grid';
import type { PoActionKind } from '../types';
import PurchaseOrderActionCell from './PurchaseOrderActionCell.vue';
import StatusCell from './StatusCell.vue';

const props = defineProps<{
    orders: PurchaseOrder[];
    /** What she has already recorded against a line, by PO id. */
    poActions: Record<string, PoActionKind>;
}>();

const emit = defineEmits<{
    action: [poId: string, kind: PoActionKind];
}>();

const defaultColDef = baseColDef<PurchaseOrder>();

const onAction = (poId: string, kind: PoActionKind) => emit('action', poId, kind);

// Rebuilt when a decision is recorded, as React rebuilds it: the grid then refreshes the action
// cells with the new `cellRendererParams`.
const columnDefs = computed<ColDef<PurchaseOrder>[]>(() => [
    { field: 'poId', headerName: 'PO #', minWidth: 120, filter: 'agTextColumnFilter', sort: 'desc' },
    { field: 'supplierName', headerName: 'Supplier', minWidth: 150, filter: 'agSetColumnFilter' },
    { field: 'material', headerName: 'Material', minWidth: 150, filter: 'agSetColumnFilter' },
    {
        field: 'quantity',
        headerName: 'Quantity',
        minWidth: 120,
        type: 'rightAligned',
        // Unfilterable: quantity is only comparable within one unit of measure, and the grid mixes them.
        filter: false,
        valueFormatter: ({ value, data }) => (value == null ? '' : `${fmtInt(value)} ${data?.unit ?? ''}`),
    },
    {
        field: 'unitCost',
        headerName: 'Unit cost',
        minWidth: 110,
        type: 'rightAligned',
        filter: 'agNumberColumnFilter',
        filterParams: NUMBER_FILTER_PARAMS,
        valueFormatter: ({ value }) => (value == null ? '' : fmtPrice(value)),
    },
    {
        field: 'totalCost',
        headerName: 'Cost',
        minWidth: 120,
        type: 'rightAligned',
        filter: 'agNumberColumnFilter',
        filterParams: NUMBER_FILTER_PARAMS,
        valueFormatter: ({ value }) => (value == null ? '' : fmtCurrency(value)),
    },
    {
        field: 'orderDate',
        headerName: 'Order date',
        minWidth: 130,
        filter: 'agDateColumnFilter',
        filterParams: DATE_FILTER_PARAMS,
        // The filter compares Dates, so the epoch value has to be lifted to one.
        filterValueGetter: ({ data }) => (data ? new Date(data.orderDate) : null),
        valueFormatter: dateFormatter,
    },
    {
        field: 'expectedDate',
        headerName: 'Expected delivery',
        minWidth: 150,
        filter: 'agDateColumnFilter',
        filterParams: DATE_FILTER_PARAMS,
        filterValueGetter: ({ data }) => (data ? new Date(data.expectedDate) : null),
        valueFormatter: dateFormatter,
    },
    {
        field: 'status',
        headerName: 'Status',
        minWidth: 130,
        filter: 'agSetColumnFilter',
        cellRenderer: StatusCell,
    },
    {
        colId: 'action',
        headerName: 'Action',
        minWidth: 180,
        maxWidth: 200,
        // Pinned: the other columns overflow a laptop viewport, and an action she must scroll to reach is not taken.
        pinned: 'right',
        // A control column, so nothing to sort or filter on.
        sortable: false,
        filter: false,
        resizable: false,
        cellRenderer: PurchaseOrderActionCell,
        cellRendererParams: { poActions: props.poActions, onAction },
    },
]);
</script>

<template>
    <div class="pc-grid-host">
        <AgGridVue
            :theme="gridTheme"
            :row-data="orders"
            :column-defs="columnDefs"
            :default-col-def="defaultColDef"
            :row-height="36"
            :header-height="38"
            dom-layout="autoHeight"
            :pagination="true"
            :pagination-page-size="12"
            :pagination-page-size-selector="[12, 25, 50, 100]"
        />
    </div>
</template>
