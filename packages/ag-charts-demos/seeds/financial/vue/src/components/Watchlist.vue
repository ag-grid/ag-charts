<script lang="ts">
import { type ColDef } from 'ag-grid-community';

import { fmtPrice } from '../format';
import { type Quote } from '../types';
import { formatOrBlank, signed, signedPct, sparklineColDef, tickerColDef, upDownRules } from './grid';

const upDown = upDownRules<Quote>();

const columnDefs: ColDef<Quote>[] = [
    tickerColDef<Quote>('ticker', 'name'),
    { field: 'last', headerName: 'Last', type: 'rightAligned', valueFormatter: formatOrBlank<Quote>(fmtPrice) },
    {
        field: 'change',
        headerName: 'Chg',
        type: 'rightAligned',
        valueFormatter: formatOrBlank<Quote>(signed),
        cellClassRules: upDown,
    },
    {
        field: 'changePct',
        headerName: '% Chg',
        type: 'rightAligned',
        valueFormatter: formatOrBlank<Quote>(signedPct),
        cellClassRules: upDown,
    },
    sparklineColDef<Quote>(),
];
</script>

<script setup lang="ts">
import TickerGrid from './TickerGrid.vue';

defineProps<{
    quotes: Quote[];
    activeTicker: string;
}>();
const emit = defineEmits<{ select: [ticker: string] }>();
</script>

<template>
    <TickerGrid
        title="Watchlist"
        grid-class-name="fin-watchlist-grid"
        :column-defs="columnDefs"
        :row-data="quotes"
        :active-ticker="activeTicker"
        @select="emit('select', $event)"
    />
</template>
