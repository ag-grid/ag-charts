import type {
    AgBarSeriesOptions,
    AgCartesianChartOptions,
    AgPieSeriesOptions,
    AgPolarChartOptions,
    AgSelectionItemIds,
} from 'ag-charts-community';

import { chartHost } from '../chart';
import { NEUTRAL, THEME } from '../chartTheme';
import { type View, h } from '../dom';
import { fmtInt, fmtPct } from '../format';
import { memo } from '../memo';
import type { SlipDistribution } from '../types';
import { stylerOwnedSelection } from './chartSelection';
import { createSupplierSelection } from './useSupplierSelection';

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
    /** The user selected a supplier's bars or split, or clicked away to clear the selection. */
    onSelectedSupplierChange: (supplierId: string | undefined) => void;
}

type Props = Omit<DeliverySlipHistogramsProps, 'onSelectedSupplierChange'>;

export interface DeliverySlipHistograms extends View {
    update(props: Props): void;
}

/**
 * Days the axis draws one bar each for. Past this the record is a tail rather than a shape worth
 * resolving to the day, and a single outlier would otherwise set the category count on its own —
 * one delivery six months late draws a hundred and eighty near-empty bars in every facet.
 */
export const MAX_SLIP_DAYS = 14;

/** The terminal category, holding every slip past `MAX_SLIP_DAYS`. */
const OVERFLOW_DAY = `${MAX_SLIP_DAYS + 1}+`;

const BARS_SERIES_ID = 'slips';
const SPLIT_SERIES_ID = 'split';
/** The split's slices, which are also its selection item ids. */
const SPLIT_OUTCOMES = ['Late', 'On time'] as const;

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

interface SlipFacetProps {
    row: SlipDistribution;
    bars: Bar[];
    maxCount: number;
    isLast: boolean;
    color: string;
    selectedSupplierId?: string;
    onSelectedSupplierChange: (supplierId: string | undefined) => void;
}

type FacetProps = Omit<SlipFacetProps, 'onSelectedSupplierChange'>;

interface SlipFacet extends View {
    supplierId: string;
    update(props: FacetProps): void;
}

const facetClass = (isLast: boolean) => (isLast ? 'pc-facet pc-facet--axis' : 'pc-facet');

/** One supplier's row: its late share and its histogram, each a chart that selects the supplier as a whole. */
function createSlipFacet({ onSelectedSupplierChange, ...props }: SlipFacetProps): SlipFacet {
    const pie = chartHost<AgPolarChartOptions<Slice>>();
    const chart = chartHost<AgCartesianChartOptions<Bar>>();

    let current: FacetProps = props;
    const supplierIdOf = () => current.row.supplierId;

    const barItemsForOf = memo(
        (supplierId: string, bars: Bar[]) =>
            (selected: string): AgSelectionItemIds[] =>
                selected === supplierId ? bars.map((bar) => ({ seriesId: BARS_SERIES_ID, itemId: bar.day })) : []
    );
    const barSelection = createSupplierSelection<Bar>({
        chart: chart.instance,
        onSelectedSupplierChange,
        supplierIdOf,
    });

    const splitItemsForOf = memo(
        (supplierId: string) =>
            (selected: string): AgSelectionItemIds[] =>
                selected === supplierId
                    ? SPLIT_OUTCOMES.map((outcome) => ({ seriesId: SPLIT_SERIES_ID, itemId: outcome }))
                    : []
    );
    const splitSelection = createSupplierSelection<Slice>({
        chart: pie.instance,
        onSelectedSupplierChange,
        supplierIdOf,
    });

    // Same boundary the bands draw: a delivery on its promised day is not late.
    const lateCountOf = memo((slips: number[]) => slips.filter((slip) => slip > 0).length);

    const optionsOf = memo(
        (
            supplier: string,
            bars: Bar[],
            maxCount: number,
            isLast: boolean,
            color: string,
            dimmed: boolean
        ): AgCartesianChartOptions<Bar> => {
            const row = { supplier };
            const series: AgBarSeriesOptions<Bar> = {
                type: 'bar',
                id: BARS_SERIES_ID,
                xKey: 'day',
                yKey: 'count',
                xName: 'Slip',
                yName: 'Deliveries',
                fill: color,
                fillOpacity: dimmed ? 0.3 : 0.85,
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
                    selectionChange: barSelection.onChartSelectionChange,
                    click: barSelection.onChartClick,
                },
            };
        }
    );

    const splitOf = memo((row: SlipDistribution, lateCount: number, color: string) =>
        splitOptions(row, lateCount, color, {
            selectionChange: splitSelection.onChartSelectionChange,
            click: splitSelection.onChartClick,
        })
    );

    const name = h('span', { class: 'pc-facet-name' });
    const note = h('span', { class: 'pc-facet-note' });
    // The bottom facet is taller by its axis-label band, so every series area keeps the same height.
    const el = h(
        'div',
        { class: facetClass(props.isLast) },
        h('span', { class: 'pc-facet-head' }, name, note),
        // The share of deliveries that ran late, against the shape of how late. The inner box is what
        // the chart fills; the outer one spans the series area beside it, so the two stay centred on
        // each other whatever height the facet takes.
        h(
            'div',
            { class: 'pc-facet-split' },
            h('div', { class: 'pc-facet-pie', 'data-keeps-selection': 'true' }, pie.el)
        ),
        h('div', { class: 'pc-facet-chart', 'data-keeps-selection': 'true' }, chart.el)
    );

    function compute() {
        const { row, bars, maxCount, isLast, color: supplierColor, selectedSupplierId } = current;
        const dimmed = selectedSupplierId != null && row.supplierId !== selectedSupplierId;
        const color = dimmed ? NEUTRAL : supplierColor;
        const lateCount = lateCountOf(row.slips);
        return {
            lateCount,
            options: optionsOf(row.supplier, bars, maxCount, isLast, color, dimmed),
            split: splitOf(row, lateCount, color),
        };
    }

    function render() {
        const { row, isLast } = current;
        el.className = facetClass(isLast);
        name.textContent = row.supplier;
        note.textContent = `${fmtInt(compute().lateCount)} late out of ${fmtInt(row.slips.length)} deliveries`;
    }
    render();

    function sync() {
        const { row, bars, selectedSupplierId } = current;
        barSelection.sync(selectedSupplierId, barItemsForOf(row.supplierId, bars));
        splitSelection.sync(selectedSupplierId, splitItemsForOf(row.supplierId));
    }

    return {
        supplierId: props.row.supplierId,
        el,
        mount() {
            const { options, split } = compute();
            pie.mount(split);
            chart.mount(options);
            sync();
        },
        update(next) {
            current = next;
            render();
            const { options, split } = compute();
            pie.update(split);
            chart.update(options);
            sync();
        },
        destroy() {
            barSelection.destroy();
            splitSelection.destroy();
            pie.destroy();
            chart.destroy();
        },
    };
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
    onSelectedSupplierChange,
    ...props
}: DeliverySlipHistogramsProps): DeliverySlipHistograms {
    const scaleOf = memo(binned);

    const el = h('div', { class: 'pc-facets' });
    let current: Props = props;
    let facets: SlipFacet[] = [];
    let mounted = false;

    const facetProps = (): FacetProps[] => {
        const { rows, supplierColors, selectedSupplierId } = current;
        const scale = scaleOf(rows);
        return rows.map((row, index) => ({
            row,
            bars: scale.bars.get(row.supplierId) ?? [],
            maxCount: scale.maxCount,
            // The x axis is drawn once, under the bottom facet: every facet shares the same categories.
            isLast: index === rows.length - 1,
            color: supplierColors[row.supplierId] ?? NEUTRAL,
            selectedSupplierId,
        }));
    };

    /** Keyed on the supplier as the React list is: a facet whose supplier stays is updated in place. */
    function render() {
        const next = facetProps();
        const kept = new Map(facets.map((facet) => [facet.supplierId, facet]));
        const created: SlipFacet[] = [];
        facets = next.map((props) => {
            const facet = kept.get(props.row.supplierId);
            if (facet) {
                kept.delete(props.row.supplierId);
                facet.update(props);
                return facet;
            }
            const fresh = createSlipFacet({ ...props, onSelectedSupplierChange });
            created.push(fresh);
            return fresh;
        });
        for (const facet of kept.values()) facet.destroy();
        el.replaceChildren(...facets.map((facet) => facet.el));
        if (mounted) created.forEach((facet) => facet.mount());
    }
    render();

    return {
        el,
        mount() {
            mounted = true;
            facets.forEach((facet) => facet.mount());
        },
        update(next) {
            current = next;
            render();
        },
        destroy() {
            facets.forEach((facet) => facet.destroy());
        },
    };
}
