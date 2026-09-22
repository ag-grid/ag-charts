<script lang="ts">
import { type ColDef } from 'ag-grid-community';

import { fmtPrice } from '../format';
import { type MoverRow } from '../types';
import { formatOrBlank, signedPct, sparklineColDef, tickerColDef, upDownRules } from './grid';

const upDown = upDownRules<MoverRow>();

// "Most active" = the highest-volume names, ranked by traded volume; values stream live.
const columnDefs: ColDef<MoverRow>[] = [
    tickerColDef<MoverRow>('ticker', 'name'),
    { field: 'last', headerName: 'Last', type: 'rightAligned', valueFormatter: formatOrBlank<MoverRow>(fmtPrice) },
    {
        field: 'changePct',
        headerName: '% Chg',
        type: 'rightAligned',
        valueFormatter: formatOrBlank<MoverRow>(signedPct),
        cellClassRules: upDown,
    },
    {
        field: 'volume',
        headerName: 'Vol',
        type: 'rightAligned',
        valueFormatter: formatOrBlank<MoverRow>((value) => `${value.toFixed(1)}M`),
    },
    sparklineColDef<MoverRow>(),
];
</script>

<script setup lang="ts">
import TickerGrid from './TickerGrid.vue';

defineProps<{
    rows: MoverRow[];
    activeTicker: string;
}>();
const emit = defineEmits<{ select: [ticker: string] }>();
</script>

<template>
    <TickerGrid
        title="Most active"
        grid-class-name="fin-trending-grid"
        :column-defs="columnDefs"
        :row-data="rows"
        :active-ticker="activeTicker"
        @select="emit('select', $event)"
    />
</template>
