import type {
    AgBarSeriesOptions,
    AgCartesianChartOptions,
    AgPieSeriesOptions,
    AgPolarChartOptions,
} from 'ag-charts-community';

import { type ChartHost, chartHost } from '../chart';
import { NEUTRAL, THEME } from '../chartTheme';
import { type View, h } from '../dom';
import { fmtInt, fmtPct } from '../format';
import { memo } from '../memo';
import type { SlipDistribution } from '../types';

/** One day of slip, and how many deliveries landed on it. */
interface Bar {
    /** The day held as a category, which is what puts the axis label under its own bar. */
    day: string;
    count: number;
    /** How the bar's span reads in a tooltip — a single day, or everything past the last one. */
    slipLabel: string;
}

interface DeliverySlipHistogramsProps {
    rows: SlipDistribution[];
    supplierColors: Record<string, string>;
    /** The supplier currently selected, if any. */
    selectedSupplierId?: string;
    /** Selecting the same supplier again clears it. */
    onSelect: (supplierId: string) => void;
}

export interface DeliverySlipHistograms extends View {
    update(props: Omit<DeliverySlipHistogramsProps, 'onSelect'>): void;
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

/** One slice of a facet's split: how many deliveries landed either side of the promised date. */
interface Slice {
    outcome: string;
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
function splitOptions(row: SlipDistribution, lateCount: number, color: string): AgPolarChartOptions<Slice> {
    const series: AgPieSeriesOptions<Slice> = {
        type: 'pie',
        angleKey: 'deliveries',
        angleName: 'Deliveries',
        calloutLabelKey: 'outcome',
        calloutLabel: { enabled: false },
        sectorLabel: { enabled: false },
        strokeWidth: 0,
        itemStyler: ({ datum }) => ({ fill: datum.fill, fillOpacity: datum.fillOpacity ?? 1 }),
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
        series: [series],
        legend: { enabled: false },
        // Below the 300px chart minimum; a chart that will not shrink overflows its box and swallows clicks.
        minWidth: 0,
        minHeight: 0,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
    };
}

/** What one facet is drawn from, computed for the whole set at once as the React memo does. */
interface Facet {
    row: SlipDistribution;
    options: AgCartesianChartOptions<Bar>;
    split: AgPolarChartOptions<Slice>;
    isLast: boolean;
    lateCount: number;
}

/** One supplier's row, keyed on the supplier as the React list is, holding its two charts. */
interface FacetView {
    supplierId: string;
    el: HTMLDivElement;
    name: HTMLSpanElement;
    note: HTMLSpanElement;
    pie: ChartHost<AgPolarChartOptions<Slice>>;
    chart: ChartHost<AgCartesianChartOptions<Bar>>;
}

const facetClass = (isLast: boolean) => (isLast ? 'pc-facet pc-facet--axis' : 'pc-facet');
const facetNote = ({ row, lateCount }: Facet) =>
    `${fmtInt(lateCount)} late out of ${fmtInt(row.slips.length)} deliveries`;

function createFacetView(facet: Facet): FacetView {
    const name = h('span', { class: 'pc-facet-name' }, facet.row.supplier);
    const note = h('span', { class: 'pc-facet-note' }, facetNote(facet));
    const pie = chartHost<AgPolarChartOptions<Slice>>();
    const chart = chartHost<AgCartesianChartOptions<Bar>>();
    // The bottom facet is taller by its axis-label band, so every series area keeps the same height.
    const el = h(
        'div',
        { class: facetClass(facet.isLast) },
        h('span', { class: 'pc-facet-head' }, name, note),
        // The share of deliveries that ran late, against the shape of how late. The inner box is what
        // the chart fills; the outer one spans the series area beside it, so the two stay centred on
        // each other whatever height the facet takes.
        h('div', { class: 'pc-facet-split' }, h('div', { class: 'pc-facet-pie' }, pie.el)),
        h('div', { class: 'pc-facet-chart' }, chart.el)
    );
    return { supplierId: facet.row.supplierId, el, name, note, pie, chart };
}

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
export function createDeliverySlipHistograms({
    onSelect,
    ...props
}: DeliverySlipHistogramsProps): DeliverySlipHistograms {
    const scale = memo(binned);

    const facets = memo(
        (
            rows: SlipDistribution[],
            scale: Binned,
            supplierColors: Record<string, string>,
            selectedSupplierId: string | undefined
        ): Facet[] =>
            rows.map((row, index) => {
                // The x axis is drawn once, under the bottom facet: every facet shares the same categories.
                const isLast = index === rows.length - 1;
                const dimmed = selectedSupplierId != null && row.supplierId !== selectedSupplierId;
                const color = dimmed ? NEUTRAL : (supplierColors[row.supplierId] ?? NEUTRAL);

                const series: AgBarSeriesOptions<Bar> = {
                    type: 'bar',
                    xKey: 'day',
                    yKey: 'count',
                    xName: 'Slip',
                    yName: 'Deliveries',
                    fill: color,
                    fillOpacity: dimmed ? 0.3 : 0.85,
                    cornerRadius: 3,
                    tooltip: {
                        renderer: ({ datum }) => ({
                            heading: '',
                            title: '',
                            data: [
                                { label: 'Slip', value: datum.slipLabel },
                                { label: 'Deliveries', value: fmtInt(datum.count) },
                            ],
                        }),
                    },
                    listeners: { seriesNodeClick: () => onSelect(row.supplierId) },
                };

                const options: AgCartesianChartOptions<Bar> = {
                    theme: THEME,
                    data: scale.bars.get(row.supplierId) ?? [],
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
                            max: scale.maxCount,
                            nice: false,
                            label: { enabled: false },
                            // A facet this short has room only for the two ticks that bound the shared scale.
                            interval: { values: [0, scale.maxCount] },
                        },
                    },
                    legend: { enabled: false },
                    padding: { top: 4, right: 8, bottom: 0, left: 0 },
                };

                // Same boundary the bands draw: a delivery on its promised day is not late.
                const lateCount = row.slips.filter((slip) => slip > 0).length;

                return { row, options, split: splitOptions(row, lateCount, color), isLast, lateCount };
            })
    );

    const compute = (next: Omit<DeliverySlipHistogramsProps, 'onSelect'>) =>
        facets(next.rows, scale(next.rows), next.supplierColors, next.selectedSupplierId);

    const el = h('div', { class: 'pc-facets' });
    let views: FacetView[] = [];
    let current = compute(props);
    let mounted = false;

    function mountView(view: FacetView, facet: Facet) {
        view.pie.mount(facet.split);
        view.chart.mount(facet.options);
    }

    function build() {
        for (const view of views) {
            view.pie.destroy();
            view.chart.destroy();
        }
        views = current.map(createFacetView);
        el.replaceChildren(...views.map((view) => view.el));
        if (mounted) views.forEach((view, index) => mountView(view, current[index]));
    }
    build();

    return {
        el,
        mount() {
            mounted = true;
            views.forEach((view, index) => mountView(view, current[index]));
        },
        update(next) {
            const facets = compute(next);
            if (facets === current) return;
            current = facets;
            // Same suppliers in the same order: React keeps the rows and re-renders them in place.
            if (
                facets.length !== views.length ||
                !facets.every((facet, index) => facet.row.supplierId === views[index].supplierId)
            ) {
                build();
                return;
            }
            views.forEach((view, index) => {
                const facet = facets[index];
                view.el.className = facetClass(facet.isLast);
                view.name.textContent = facet.row.supplier;
                view.note.textContent = facetNote(facet);
                view.pie.update(facet.split);
                view.chart.update(facet.options);
            });
        },
        destroy() {
            for (const view of views) {
                view.pie.destroy();
                view.chart.destroy();
            }
        },
    };
}
