<script lang="ts">
import type { CellClassRules } from 'ag-grid-community';

import type { SupplierScorecard as Row } from '../types';

/** Below-target figures carry the same down-tone the cards gave them. */
const belowTarget = (target: number): CellClassRules<Row> => ({ 'pc-down': ({ value }) => value < target });

/** Cheaper than contract is good news, dearer is bad — the only two-sided figure on the row. */
const VARIANCE_RULES: CellClassRules<Row> = {
    'pc-down': ({ value }) => value > 0,
    'pc-up': ({ value }) => value <= 0,
};
</script>

<script setup lang="ts">
import type { ColDef, GetRowIdParams, ICellRendererParams, RowClassRules } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';
import { computed } from 'vue';

import { ON_TIME_TARGET, QUALITY_TARGET } from '../data';
import { fmtCurrencyCompact, fmtInt, fmtPct, fmtSignedPct } from '../format';
import { baseColDef, compactGridTheme } from '../grid';
import ContactActions from './ContactActions.vue';
import SupplierCell from './SupplierCell.vue';

/**
 * Her supplier roster: one row per supplier she owns, whether or not it has orders this period.
 * This is the literal definition of "my suppliers" — a supplier she does not own has no row here
 * to filter out, and one of hers never disappears for being quiet.
 *
 * Doubles as the accessible equivalent of the scatter beside it: every channel the scatter encodes
 * positionally is a sortable, labelled column here.
 */
const props = defineProps<{
    rows: Row[];
    supplierColors: Record<string, string>;
    /** The supplier currently selected, if any. */
    selectedSupplierId?: string;
}>();

const emit = defineEmits<{
    /** Selecting a row again clears it. */
    select: [supplierId: string];
}>();

// Wrapped headers let the figure columns be as narrow as their figures; "vs contract" sets the floor otherwise.
const defaultColDef: ColDef<Row> = { ...baseColDef<Row>(), wrapHeaderText: true, autoHeaderHeight: true };

const onSelect = (supplierId: string) => emit('select', supplierId);

// Rebuilt on a change of selection or colour, as React rebuilds it: the grid then refreshes the
// supplier cells with the new `cellRendererParams`.
const columnDefs = computed<ColDef<Row>[]>(() => [
    {
        field: 'supplier',
        headerName: 'Supplier',
        minWidth: 150,
        flex: 1.4,
        filter: false,
        cellRenderer: SupplierCell,
        cellRendererParams: {
            supplierColors: props.supplierColors,
            selectedSupplierId: props.selectedSupplierId,
            onSelect,
        },
    },
    {
        field: 'onTimeRate',
        headerName: 'On-time',
        minWidth: 62,
        type: 'rightAligned',
        filter: false,
        cellClassRules: belowTarget(ON_TIME_TARGET),
        // An HTML string rather than a component: the grid puts the text and the marker straight into the
        // cell, as React's fragment does, where a component would need a root element around them.
        cellRenderer: ({ data, value }: ICellRendererParams<Row, number>) =>
            `${fmtPct(value ?? 0)}${
                data?.rateIsContracted === true
                    ? '<abbr title="Contracted rate: too few deliveries this period to measure"> *</abbr>'
                    : ''
            }`,
    },
    {
        field: 'qualityScore',
        headerName: 'Quality',
        minWidth: 56,
        type: 'rightAligned',
        filter: false,
        cellClassRules: belowTarget(QUALITY_TARGET),
        valueFormatter: ({ value }) => fmtPct(value),
    },
    {
        field: 'rejectedValue',
        headerName: 'Rejected',
        minWidth: 66,
        type: 'rightAligned',
        filter: false,
        // Deliberately untoned: every supplier rejects something, so reddening non-zero figures means nothing.
        valueFormatter: ({ value }) => fmtCurrencyCompact(value),
    },
    {
        field: 'priceVariance',
        headerName: 'vs contract',
        minWidth: 62,
        type: 'rightAligned',
        filter: false,
        cellClassRules: VARIANCE_RULES,
        valueFormatter: ({ value }) => fmtSignedPct(value),
    },
    {
        field: 'orderCount',
        headerName: 'Order lines',
        minWidth: 56,
        type: 'rightAligned',
        filter: false,
        // A count, not a quantity: the commodity is bought in both tonnes and kilos.
        valueFormatter: ({ value }) => fmtInt(value),
    },
    {
        field: 'spend',
        headerName: 'Spend',
        minWidth: 58,
        type: 'rightAligned',
        filter: false,
        valueFormatter: ({ value }) => fmtCurrencyCompact(value),
    },
    {
        field: 'daysToRenewal',
        headerName: 'Renewal',
        minWidth: 62,
        type: 'rightAligned',
        filter: false,
        // Always signed days: `daysToRenewal` goes negative once a contract has lapsed, and the minus is the meaning.
        valueFormatter: ({ value }) => (value < 0 ? `−${fmtInt(Math.abs(value))}d` : `${fmtInt(value)}d`),
    },
    {
        colId: 'contact',
        headerName: 'Contact',
        minWidth: 84,
        maxWidth: 84,
        // Pinned: an action she has to scroll sideways to reach is an action she will not take.
        pinned: 'right',
        sortable: false,
        filter: false,
        resizable: false,
        cellRenderer: ContactActions,
    },
]);

/**
 * The selected supplier stays marked while she reads the charts beside it.
 *
 * A rule rather than `getRowClass`, because the grid only ever *adds* what that returns: it
 * marked the row on select and then had no way to unmark it. A rule is toggled, so deselecting
 * clears the treatment — and unlike keying the style off the button's `aria-pressed`, it reaches
 * the pinned contact column too, which lives in a row container of its own.
 */
const rowClassRules = computed<RowClassRules<Row>>(() => {
    // Read here, not inside the rule: a `computed` only tracks what its body reads, and the grid is
    // told of a new rules object only when this recomputes — React's `useMemo` names the dependency.
    const { selectedSupplierId } = props;
    return { 'is-selected': ({ data }) => data?.supplierId === selectedSupplierId };
});

const getRowId = ({ data }: GetRowIdParams<Row>) => data.supplierId;
</script>

<template>
    <div class="pc-grid-host">
        <AgGridVue
            :theme="compactGridTheme"
            :row-data="rows"
            :column-defs="columnDefs"
            :default-col-def="defaultColDef"
            :get-row-id="getRowId"
            row-class="pc-supplier"
            :row-class-rules="rowClassRules"
            :row-height="46"
            dom-layout="autoHeight"
        />
    </div>
</template>
