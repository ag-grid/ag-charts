<script lang="ts">
import type { ColDef, GetRowIdParams, ICellRendererParams } from 'ag-grid-community';

import { fmtCurrency, fmtPct } from '../format';
import { baseColDef } from '../grid';
import type { SpendNode } from '../types';

/** One supplier's spend on one material: a leaf of the spend tree, with the rings above it as columns. */
interface SpendRow {
    subcategory: string;
    material: string;
    supplierId: string;
    supplier: string;
    spend: number;
    shareOfTotal: number;
}

/** Flattens the tree to its supplier leaves; the grid regroups them by the ring each one sits in. */
function toRows(tree: SpendNode): SpendRow[] {
    const rows: SpendRow[] = [];
    const visit = (node: SpendNode) => {
        if (node.supplierId != null) {
            const [subcategory, material] = node.path;
            rows.push({
                subcategory,
                material,
                supplierId: node.supplierId,
                supplier: node.name,
                spend: node.spend,
                shareOfTotal: node.shareOfTotal,
            });
        }
        node.children?.forEach(visit);
    };
    visit(tree);
    return rows;
}

/** The grid sets a string `innerRenderer` result as HTML, so text going into it is escaped. */
const escapeHtml = (text: string) =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const columnDefs: ColDef<SpendRow>[] = [
    { field: 'subcategory', rowGroup: true, hide: true },
    { field: 'material', rowGroup: true, hide: true },
    {
        field: 'spend',
        headerName: 'Total spend',
        minWidth: 110,
        type: 'rightAligned',
        aggFunc: 'sum',
        sort: 'desc',
        valueFormatter: ({ value, node }) => {
            if (value == null) return '';
            // A supplier kept in the ring with no spend reads as such, as its sector does.
            if (value === 0 && node?.group !== true) return 'No spend';
            return fmtCurrency(value);
        },
    },
    {
        field: 'shareOfTotal',
        headerName: 'Total share',
        minWidth: 80,
        type: 'rightAligned',
        aggFunc: 'sum',
        valueFormatter: ({ value }) => (value == null ? '' : fmtPct(value)),
    },
];

const getRowId = ({ data }: GetRowIdParams<SpendRow>) => `${data.subcategory}/${data.material}/${data.supplierId}`;
</script>

<script setup lang="ts">
import { AgGridVue } from 'ag-grid-vue3';
import { computed } from 'vue';

import { compactGridTheme } from '../grid';

/**
 * The sunburst's tabular twin: subcategory and material as row groups, suppliers as the leaves,
 * with spend and share summed up each level. Every figure the sunburst puts in a tooltip is a
 * sortable column here.
 */
const props = defineProps<{
    tree: SpendNode;
    /** Per-supplier colours, so a supplier's row carries the same swatch as its sector. */
    supplierColors: Record<string, string>;
}>();

const rowData = computed(() => toRows(props.tree));
const defaultColDef = { ...baseColDef<SpendRow>(), filter: false };

// An HTML string rather than a component, so a group row's cell is its bare text as in React.
const autoGroupColumnDef = computed<ColDef<SpendRow>>(() => {
    const { supplierColors } = props;
    return {
        headerName: 'Subcategory › Material › Supplier',
        // Leaves show their supplier in the group column, so the hierarchy reads as one column.
        field: 'supplier',
        minWidth: 220,
        flex: 2,
        cellRendererParams: {
            suppressCount: true,
            innerRenderer: ({ node, value, data }: ICellRendererParams<SpendRow>) =>
                node.group || data == null
                    ? escapeHtml(String(value ?? ''))
                    : `<span class="pc-spend-supplier"><span class="pc-supplier-swatch" style="background: ${supplierColors[data.supplierId]};" aria-hidden="true"></span>${escapeHtml(String(value ?? ''))}</span>`,
        },
    };
});
</script>

<template>
    <AgGridVue
        :theme="compactGridTheme"
        :row-data="rowData"
        :column-defs="columnDefs"
        :default-col-def="defaultColDef"
        :auto-group-column-def="autoGroupColumnDef"
        :get-row-id="getRowId"
        :group-default-expanded="1"
        grand-total-row="pinnedBottom"
        :suppress-agg-func-in-header="true"
        :row-height="36"
        :header-height="38"
        :style="{ height: '100%', width: '100%' }"
    />
</template>
