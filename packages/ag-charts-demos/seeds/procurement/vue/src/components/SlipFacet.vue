<script lang="ts">
import type { AgPieSeriesOptions, AgPolarChartOptions } from 'ag-charts-community';

import { NEUTRAL, THEME } from '../chartTheme';
import { fmtInt, fmtPct } from '../format';
import type { SlipDistribution } from '../types';
import { stylerOwnedSelection } from './chartSelection';

const BARS_SERIES_ID = 'slips';
const SPLIT_SERIES_ID = 'split';
/** The split's slices, which are also its selection item ids. */
const SPLIT_OUTCOMES = ['Late', 'On time'] as const;

/** One slice of a facet's split: how many deliveries landed either side of the promised date. */
interface Slice {
    outcome: (typeof SPLIT_OUTCOMES)[number];
    deliveries: number;
    fill: string;
    /** Recedes the ground slice. Omitted is solid — a sector only takes what `itemStyler` returns. */
    fillOpacity?: number;
}

/**
 * The same deliveries as the histogram beside it, as one proportion.
 *
 * The histogram says how late; this says how often, which is the figure she quotes in a supplier
 * conversation. Two slices only — the promised date splits them, exactly as the bands over the
 * histogram do, so the two charts can never disagree about what counts as late.
 *
 * The late slice carries the supplier's own colour, tying it to that supplier's bars, and the
 * remainder is a pale ground so the coloured arc is the reading. Late is not marked in the status red
 * here: the row already names the count in words, and a supplier's identity colour cannot double as a
 * severity signal without one meaning undermining the other.
 */
function splitOptions(
    row: SlipDistribution,
    lateCount: number,
    color: string,
    listeners: NonNullable<AgPolarChartOptions<Slice>['listeners']>
): AgPolarChartOptions<Slice> {
    const series: AgPieSeriesOptions<Slice> = {
        type: 'pie',
        id: SPLIT_SERIES_ID,
        angleKey: 'deliveries',
        angleName: 'Deliveries',
        calloutLabelKey: 'outcome',
        calloutLabel: { enabled: false },
        sectorLabel: { enabled: false },
        strokeWidth: 0,
        itemStyler: ({ datum }) => ({ fill: datum.fill, fillOpacity: datum.fillOpacity ?? 1 }),
        selection: stylerOwnedSelection(0),
        tooltip: {
            renderer: ({ datum }) => ({
                title: `${row.supplier} · ${datum.outcome}`,
                data: [
                    { label: 'Deliveries', value: fmtInt(datum.deliveries) },
                    { label: 'Share', value: fmtPct(datum.deliveries / row.slips.length) },
                ],
            }),
        },
    };

    return {
        theme: THEME,
        data: [
            { outcome: 'Late', deliveries: lateCount, fill: color },
            {
                outcome: 'On time',
                deliveries: row.slips.length - lateCount,
                fill: NEUTRAL,
                fillOpacity: 0.3,
            },
        ],
        dataIdKey: 'outcome',
        series: [series],
        legend: { enabled: false },
        // Below the 300px chart minimum; a chart that will not shrink overflows its box and swallows clicks.
        minWidth: 0,
        minHeight: 0,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        selection: { enabled: true },
        listeners,
    };
}
</script>

<script setup lang="ts">
import { computed } from 'vue';

import type { AgBarSeriesOptions, AgCartesianChartOptions, AgSelectionItemIds } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-vue3';

import type { Bar } from './DeliverySlipHistograms.vue';
import { useSupplierSelection } from './useSupplierSelection';

/** One supplier's row: its late share and its histogram, each a chart that selects the supplier as a whole. */
const props = defineProps<{
    row: SlipDistribution;
    bars: Bar[];
    maxCount: number;
    isLast: boolean;
    color: string;
    selectedSupplierId?: string;
}>();

const emit = defineEmits<{
    selectedSupplierChange: [supplierId: string | undefined];
}>();

const onSelectedSupplierChange = (supplierId: string | undefined) => emit('selectedSupplierChange', supplierId);
const supplierIdOf = () => props.row.supplierId;

const barItemsFor = (supplierId: string): AgSelectionItemIds[] =>
    supplierId === props.row.supplierId ? props.bars.map((bar) => ({ seriesId: BARS_SERIES_ID, itemId: bar.day })) : [];
const {
    chartRef: barChartRef,
    onChartSelectionChange: onBarSelectionChange,
    onChartClick: onBarClick,
} = useSupplierSelection<Bar>({
    selectedSupplierId: () => props.selectedSupplierId,
    onSelectedSupplierChange,
    supplierIdOf,
    itemsFor: barItemsFor,
});

const splitItemsFor = (supplierId: string): AgSelectionItemIds[] =>
    supplierId === props.row.supplierId
        ? SPLIT_OUTCOMES.map((outcome) => ({ seriesId: SPLIT_SERIES_ID, itemId: outcome }))
        : [];
const {
    chartRef: splitChartRef,
    onChartSelectionChange: onSplitSelectionChange,
    onChartClick: onSplitClick,
} = useSupplierSelection<Slice>({
    selectedSupplierId: () => props.selectedSupplierId,
    onSelectedSupplierChange,
    supplierIdOf,
    itemsFor: splitItemsFor,
});

const dimmed = computed(() => props.selectedSupplierId != null && props.row.supplierId !== props.selectedSupplierId);
const color = computed(() => (dimmed.value ? NEUTRAL : props.color));
// Same boundary the bands draw: a delivery on its promised day is not late.
const lateCount = computed(() => props.row.slips.filter((slip) => slip > 0).length);

const options = computed<AgCartesianChartOptions<Bar>>(() => {
    const { row, bars, maxCount, isLast } = props;
    const series: AgBarSeriesOptions<Bar> = {
        type: 'bar',
        id: BARS_SERIES_ID,
        xKey: 'day',
        yKey: 'count',
        xName: 'Slip',
        yName: 'Deliveries',
        fill: color.value,
        fillOpacity: dimmed.value ? 0.3 : 0.85,
        cornerRadius: 2,
        selection: stylerOwnedSelection(0),
        tooltip: {
            renderer: ({ datum }) => ({
                heading: '',
                title: row.supplier,
                data: [
                    { label: 'Slip', value: datum.slipLabel },
                    { label: 'Deliveries', value: fmtInt(datum.count) },
                ],
            }),
        },
    };

    return {
        theme: THEME,
        data: bars,
        dataIdKey: 'day',
        series: [series],
        // Below the 300px chart minimum; a chart that will not shrink overflows its box and swallows clicks.
        minWidth: 0,
        minHeight: 0,
        axes: {
            x: {
                type: 'category',
                position: 'bottom',
                bandHighlight: { enabled: true },
                // Bars all but touching, so a run of days reads as one distribution.
                paddingInner: 0.12,
                paddingOuter: 0.05,
                label: { enabled: isLast },
                // Ticks and labels centred on the band rather than on the gap between two.
                interval: { placement: 'on' },
            },
            y: {
                type: 'number',
                position: 'left',
                min: 0,
                max: maxCount,
                nice: false,
                label: { enabled: false },
                // A facet this short has room only for the two ticks that bound the shared scale.
                interval: { values: [0, maxCount] },
            },
        },
        legend: { enabled: false },
        padding: { top: 4, right: 8, bottom: 0, left: 0 },
        selection: { enabled: true },
        listeners: {
            selectionChange: onBarSelectionChange,
            click: onBarClick,
        },
    };
});

const split = computed(() =>
    splitOptions(props.row, lateCount.value, color.value, {
        selectionChange: onSplitSelectionChange,
        click: onSplitClick,
    })
);
</script>

<template>
    <!-- The bottom facet is taller by its axis-label band, so every series area keeps the same height. -->
    <div :class="isLast ? 'pc-facet pc-facet--axis' : 'pc-facet'">
        <span class="pc-facet-head">
            <span class="pc-facet-name">{{ row.supplier }}</span>
            <span
                class="pc-facet-note"
                v-text="`${fmtInt(lateCount)} late out of ${fmtInt(row.slips.length)} deliveries`"
            />
        </span>
        <!-- The share of deliveries that ran late, against the shape of how late. The inner
             box is what the chart fills; the outer one spans the series area beside it, so the
             two stay centred on each other whatever height the facet takes. -->
        <div class="pc-facet-split">
            <div class="pc-facet-pie" data-keeps-selection="true">
                <AgCharts ref="splitChartRef" :options="split" :style="{ height: '100%', width: '100%' }" />
            </div>
        </div>
        <div class="pc-facet-chart" data-keeps-selection="true">
            <AgCharts ref="barChartRef" :options="options" :style="{ height: '100%', width: '100%' }" />
        </div>
    </div>
</template>
