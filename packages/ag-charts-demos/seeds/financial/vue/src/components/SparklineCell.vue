<script lang="ts">
import { type AgSparklineOptions } from 'ag-charts-community';

// Literal (not var) — the sparkline canvas resolves colours at render time and
// does not read the --fin-* CSS custom properties.
const UP = '#10b981';
const DOWN = '#f43f5e';

// `x` is a monotonic sequence number rather than the array index, so a scrolling window is one
// appended plus one dropped point instead of every point's x shifting.
interface SparkPoint {
    x: number;
    y: number;
}

// A grid row carrying a trend history plus the baseline it is measured against.
interface SparkRow {
    history: number[];
    baseline: number;
}

function sparklineOptions(container: HTMLElement, points: SparkPoint[], baseline: number): AgSparklineOptions {
    // Split at the session baseline: green above, red below.
    return {
        type: 'line',
        container,
        data: points,
        xKey: 'x',
        yKey: 'y',
        minWidth: 0,
        minHeight: 0,
        background: { visible: false },
        padding: { top: 4, right: 2, bottom: 4, left: 2 },
        stroke: UP,
        strokeWidth: 1.25,
        segmentation: {
            enabled: true,
            key: 'y',
            segments: [{ stop: baseline, stroke: DOWN }],
        },
        tooltip: {
            enabled: false,
        },
    };
}

// eslint-disable-next-line no-console
const logError = (e: unknown) => console.error(e);

// Expresses `history` as a scroll of the current points: the dropped points plus the appended
// values. A window sharing no prefix still resolves, as a full replacement.
function scrollShift(points: SparkPoint[], history: number[]): { removed: SparkPoint[]; appended: number[] } {
    for (let shift = 0; shift < points.length; shift++) {
        const retained = points.length - shift;
        if (retained > history.length) continue;
        let matches = true;
        for (let i = 0; i < retained; i++) {
            if (points[shift + i].y !== history[i]) {
                matches = false;
                break;
            }
        }
        if (matches) {
            return { removed: points.slice(0, shift), appended: history.slice(retained) };
        }
    }
    return { removed: points.slice(), appended: history };
}
</script>

<script setup lang="ts">
import { type ICellRendererParams } from 'ag-grid-community';
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';

import { type AgChartInstance, AgCharts } from 'ag-charts-community';

type SparklineCellParams = ICellRendererParams<SparkRow>;

// Renders an AG Charts sparkline of a row's recent price history inside a grid cell.
const props = defineProps<{ params: SparklineCellParams }>();

// The grid streams a changed row in through `refresh` rather than new props (see TickerCell.vue).
const params = shallowRef(props.params);
function refresh(next: SparklineCellParams): boolean {
    params.value = next;
    return true;
}
defineExpose({ refresh });

const container = ref<HTMLDivElement>();
let chart: AgChartInstance<AgSparklineOptions> | undefined;
// Stable object identities, so a scroll can remove the dropped point by reference.
let points: SparkPoint[] = [];
let seq = 0;
let shownBaseline = 0;

const readRow = (data: SparkRow | undefined) => {
    const history = data?.history ?? [];
    return { history, baseline: data?.baseline ?? history[0] ?? 0 };
};

function seed(history: number[], baseline: number) {
    points = history.map((y, i) => ({ x: i, y }));
    seq = history.length;
    shownBaseline = baseline;
    return points;
}

onMounted(() => {
    const { history, baseline } = readRow(params.value.data);
    chart = AgCharts.__createSparkline(sparklineOptions(container.value!, seed(history, baseline), baseline));
});
onBeforeUnmount(() => chart?.destroy());

// Created once; data updates stream in here.
watch(
    () => params.value.data,
    (data) => {
        const { history, baseline } = readRow(data);
        // The baseline drives segmentation, which a transaction cannot change, so a shift in it
        // forces a full reseed.
        if (baseline !== shownBaseline) {
            chart?.update(sparklineOptions(container.value!, seed(history, baseline), baseline)).catch(logError);
            return;
        }

        const { removed, appended } = scrollShift(points, history);
        const added = appended.map((y) => ({ x: seq++, y }));
        points = [...points.slice(removed.length), ...added];
        if (removed.length || added.length) {
            chart?.applyTransaction({ remove: removed, add: added }).catch(logError);
        }
    }
);
</script>

<template>
    <!-- Decorative: the trend duplicates the row's visible % change, and the injected role="img" node
         churns every tick, so keep the whole subtree out of the a11y tree. -->
    <div ref="container" class="fin-sparkline-cell" aria-hidden="true" />
</template>
