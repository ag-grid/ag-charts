import { type View, h } from '../dom';
import type { QualityCost, SupplierScorecard as Row, SlipDistribution, SupplierTrendPoint } from '../types';
import { createToggleGroup } from '../ui';
import { type CostReliabilityScatter, createCostReliabilityScatter } from './CostReliabilityScatter';
import { type DeliverySlipHistograms, createDeliverySlipHistograms } from './DeliverySlipHistograms';
import { emptyState } from './EmptyState';
import { type QualityCostChart, createQualityCostChart } from './QualityCostChart';
import { createSupplierScorecard } from './SupplierScorecard';
import { type TrendMetric, createSupplierTrendChart } from './SupplierTrendChart';

/** Price leads: it is the metric the renewal conversation opens on. */
const METRIC_OPTIONS: { value: TrendMetric; label: string }[] = [
    { value: 'price', label: 'Price' },
    { value: 'onTime', label: 'On time' },
    { value: 'quality', label: 'Quality' },
];

interface SuppliersViewProps {
    rows: Row[];
    supplierNames: Map<string, string>;
    supplierColors: Record<string, string>;
    selectedSupplierId?: string;
    onSelectSupplier: (supplierId: string) => void;
    slipDistributions: SlipDistribution[];
    qualityCost: QualityCost[];
    trend: Map<string, SupplierTrendPoint[]>;
}

export interface SuppliersView extends View {
    update(props: Omit<SuppliersViewProps, 'onSelectSupplier'>): void;
}

/**
 * The weekly scorecard review: how each of her suppliers is actually performing.
 *
 * Every view here reads a rolling twelve months rather than the selected period. Steel lead times
 * run to six weeks, so a quarter contains barely any completed deliveries — and three points is
 * not a trend. The period selector drives the spend views instead.
 */
export function createSuppliersView({ onSelectSupplier, ...props }: SuppliersViewProps): SuppliersView {
    let current = props;
    let mounted = false;
    // The chart's own state, which a fresh view starts over: the React `useState`.
    let metric: TrendMetric = 'price';

    // Fills the card: a fixed box would leave dead space under it in a row that takes the rest of the page.
    const scatterBox = h('div', { class: 'pc-chart-box--grow' });
    let scatter: CostReliabilityScatter | undefined;

    const histogramsCard = h(
        'section',
        { class: 'pc-card' },
        h('div', { class: 'pc-card-head' }, h('div', {}, h('h2', { class: 'pc-card-title' }, 'Days late by supplier')))
    );
    let histograms: DeliverySlipHistograms | undefined;
    let histogramsEmpty: HTMLElement | undefined;

    const qualityBox = h('div', { class: 'pc-chart-box' });
    let quality: QualityCostChart | undefined;

    const metricToggle = createToggleGroup({
        ariaLabel: 'Trend metric',
        value: metric,
        onValueChange: (value) => {
            metric = value as TrendMetric;
            render();
        },
        options: METRIC_OPTIONS,
    });
    const trendChart = createSupplierTrendChart({
        trend: current.trend,
        supplierNames: current.supplierNames,
        supplierColors: current.supplierColors,
        metric,
        selectedSupplierId: current.selectedSupplierId,
    });

    const scorecard = createSupplierScorecard({
        rows: current.rows,
        supplierColors: current.supplierColors,
        selectedSupplierId: current.selectedSupplierId,
        onSelect: onSelectSupplier,
    });

    const el = h(
        'div',
        { class: 'pc-view-content pc-view-content--fill' },
        h(
            'div',
            { class: 'pc-grid-2 pc-grid-2--fill' },
            h(
                'section',
                { class: 'pc-card' },
                h(
                    'div',
                    { class: 'pc-card-head' },
                    h('div', {}, h('h2', { class: 'pc-card-title' }, 'Cost vs delivery'))
                ),
                scatterBox
            ),
            histogramsCard
        ),
        h(
            'div',
            { class: 'pc-grid-2' },
            h(
                'section',
                { class: 'pc-card' },
                h(
                    'div',
                    { class: 'pc-card-head' },
                    h('div', {}, h('h2', { class: 'pc-card-title' }, 'Cost of rejected material'))
                ),
                qualityBox
            ),
            h(
                'section',
                { class: 'pc-card' },
                h(
                    'div',
                    { class: 'pc-card-head' },
                    h('div', {}, h('h2', { class: 'pc-card-title' }, 'Supplier trend')),
                    metricToggle.el
                ),
                // Sized by the scorecard beside it, which hugs its grid.
                h('div', { class: 'pc-chart-box--match' }, trendChart.el)
            )
        ),
        h(
            'section',
            { class: 'pc-card' },
            h('div', { class: 'pc-card-head' }, h('div', {}, h('h2', { class: 'pc-card-title' }, 'My suppliers'))),
            scorecard.el
        )
    );

    /** The conditional renders: a chart while it has data, the empty state otherwise. */
    function syncSlots() {
        const { rows, supplierColors, selectedSupplierId, slipDistributions, qualityCost } = current;

        if (rows.some((row) => row.orderCount > 0)) {
            if (!scatter) {
                scatter = createCostReliabilityScatter({
                    rows,
                    supplierColors,
                    selectedSupplierId,
                    onSelect: onSelectSupplier,
                });
                scatterBox.replaceChildren(scatter.el);
                if (mounted) scatter.mount();
            } else {
                scatter.update({ rows, supplierColors, selectedSupplierId });
            }
        } else if (scatter || scatterBox.childElementCount === 0) {
            scatter?.destroy();
            scatter = undefined;
            scatterBox.replaceChildren(
                emptyState({
                    message: 'No orders for this selection',
                    hint: 'Nothing was ordered here in the selected period.',
                })
            );
        }

        if (slipDistributions.length > 0) {
            histogramsEmpty?.remove();
            histogramsEmpty = undefined;
            if (!histograms) {
                histograms = createDeliverySlipHistograms({
                    rows: slipDistributions,
                    supplierColors,
                    selectedSupplierId,
                    onSelect: onSelectSupplier,
                });
                histogramsCard.append(histograms.el);
                if (mounted) histograms.mount();
            } else {
                histograms.update({ rows: slipDistributions, supplierColors, selectedSupplierId });
            }
        } else if (histograms || !histogramsEmpty) {
            histograms?.destroy();
            histograms?.el.remove();
            histograms = undefined;
            histogramsEmpty = emptyState({
                message: 'Not enough deliveries to describe a distribution',
                hint: 'A histogram needs a handful of completed deliveries behind it.',
            });
            histogramsCard.append(histogramsEmpty);
        }

        if (qualityCost.length > 0) {
            if (!quality) {
                quality = createQualityCostChart({
                    rows: qualityCost,
                    supplierColors,
                    selectedSupplierId,
                    onSelect: onSelectSupplier,
                });
                qualityBox.replaceChildren(quality.el);
                if (mounted) quality.mount();
            } else {
                quality.update({ rows: qualityCost, supplierColors, selectedSupplierId });
            }
        } else if (quality || qualityBox.childElementCount === 0) {
            quality?.destroy();
            quality = undefined;
            qualityBox.replaceChildren(
                emptyState({
                    message: 'Nothing delivered in this window',
                    hint: 'Widen the period to see what inspection rejected.',
                })
            );
        }
    }

    function render() {
        syncSlots();
        metricToggle.setValue(metric);
        trendChart.update({
            trend: current.trend,
            supplierNames: current.supplierNames,
            supplierColors: current.supplierColors,
            metric,
            selectedSupplierId: current.selectedSupplierId,
        });
        scorecard.update({
            rows: current.rows,
            supplierColors: current.supplierColors,
            selectedSupplierId: current.selectedSupplierId,
        });
    }
    render();

    return {
        el,
        mount() {
            mounted = true;
            scatter?.mount();
            histograms?.mount();
            quality?.mount();
            trendChart.mount();
            scorecard.mount();
        },
        update(next) {
            current = next;
            render();
        },
        destroy() {
            scatter?.destroy();
            histograms?.destroy();
            quality?.destroy();
            trendChart.destroy();
            scorecard.destroy();
        },
    };
}
