<script lang="ts">
import type { SlipDistribution } from '../types';

/** One day of slip, and how many deliveries landed on it. */
export interface Bar {
    /** The day held as a category, which is what puts the axis label under its own bar. */
    day: string;
    count: number;
    /** How the bar's span reads in a tooltip — a single day, or everything past the last one. */
    slipLabel: string;
}

/**
 * Days the axis draws one bar each for. Past this the record is a tail rather than a shape worth
 * resolving to the day, and a single outlier would otherwise set the category count on its own —
 * one delivery six months late draws a hundred and eighty near-empty bars in every facet.
 */
export const MAX_SLIP_DAYS = 14;

/** The terminal category, holding every slip past `MAX_SLIP_DAYS`. */
const OVERFLOW_DAY = `${MAX_SLIP_DAYS + 1}+`;

/** Days late, as a buyer would read the number. */
const fmtDays = (days: number) => `${days}d late`;

export interface Binned {
    /** Bars per supplier id: one per category, in the same order for everyone. */
    bars: Map<string, Bar[]>;
    /** The tallest bar any supplier puts up, which every facet's y axis then tops out at. */
    maxCount: number;
}

/**
 * One bar per day per supplier, over a range every supplier shares.
 *
 * Counted here rather than by a histogram series because a category axis is what puts each label
 * under its own bar, and a category axis needs the counts up front. Days nobody delivered on are kept
 * as empty categories: dropping them would put each supplier's bars at different positions, and
 * reading these rows against each other depends on them lining up.
 *
 * Only deliveries that ran late are counted. Early and on-time arrivals are the bulk of the record and
 * would flatten the tail this exists to show; the pie beside each row carries their share instead.
 *
 * The axis runs to the worst slip in the record or `MAX_SLIP_DAYS`, whichever is smaller, with
 * anything past that collected into one terminal bar. Folded rather than dropped: a second cluster
 * out in the tail is exactly what this chart exists to surface, and it has to stay visible.
 */
export function binned(rows: SlipDistribution[]): Binned {
    const worst = rows.reduce((high, row) => Math.max(high, row.slips.at(-1) ?? 0), 0);
    // Always from the first day late, so the axis reads the same whether or not anyone missed by one.
    const resolved = Math.min(Math.max(worst, 1), MAX_SLIP_DAYS);
    const days = Array.from({ length: resolved }, (_, index) => String(index + 1));
    if (worst > MAX_SLIP_DAYS) days.push(OVERFLOW_DAY);

    const label = (day: string) =>
        day === OVERFLOW_DAY ? `more than ${MAX_SLIP_DAYS} days late` : fmtDays(Number(day));

    let maxCount = 1; // A floor of one keeps the axis finite for a roster that missed nothing at all.
    const bars = new Map<string, Bar[]>(
        rows.map((row) => {
            const counts = new Map<string, number>();
            for (const slip of row.slips) {
                if (slip <= 0) continue;
                const day = slip > MAX_SLIP_DAYS ? OVERFLOW_DAY : String(slip);
                counts.set(day, (counts.get(day) ?? 0) + 1);
            }
            return [
                row.supplierId,
                days.map<Bar>((day) => {
                    const count = counts.get(day) ?? 0;
                    maxCount = Math.max(maxCount, count);
                    return { day, count, slipLabel: label(day) };
                }),
            ];
        })
    );

    return { bars, maxCount };
}
</script>

<script setup lang="ts">
import { computed } from 'vue';

import { NEUTRAL } from '../chartTheme';
import SlipFacet from './SlipFacet.vue';

/**
 * Each supplier's delivery slip as its own distribution, on one shared scale.
 *
 * The box-and-whisker chart beside this says where the middle half of each supplier's deliveries
 * sits; this says what the distribution is actually shaped like, which the quartiles flatten. A
 * supplier clustered tightly a day or two late is a scheduling problem she can plan around; one
 * with a second cluster out in the tail is a supplier that will stop a line occasionally, and the
 * two can share a median.
 *
 * Small multiples rather than overlaid series: five translucent distributions on one pair of axes
 * occlude each other exactly where they differ, and the comparison here is between shapes.
 */
const props = defineProps<{
    rows: SlipDistribution[];
    supplierColors: Record<string, string>;
    /** The supplier currently selected, if any. */
    selectedSupplierId?: string;
}>();

const emit = defineEmits<{
    /** The user selected a supplier's bars or split, or clicked away to clear the selection. */
    selectedSupplierChange: [supplierId: string | undefined];
}>();

const scale = computed(() => binned(props.rows));
</script>

<template>
    <div class="pc-facets">
        <!-- The x axis is drawn once, under the bottom facet: every facet shares the same categories. -->
        <SlipFacet
            v-for="(row, index) in rows"
            :key="row.supplierId"
            :row="row"
            :bars="scale.bars.get(row.supplierId) ?? []"
            :max-count="scale.maxCount"
            :is-last="index === rows.length - 1"
            :color="supplierColors[row.supplierId] ?? NEUTRAL"
            :selected-supplier-id="selectedSupplierId"
            @selected-supplier-change="(supplierId) => emit('selectedSupplierChange', supplierId)"
        />
    </div>
</template>
