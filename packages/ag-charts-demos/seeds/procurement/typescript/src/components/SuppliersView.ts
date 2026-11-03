import { type View, h } from '../dom';
import { memo } from '../memo';
import type {
    MaterialQualityCost,
    QualityCost,
    SupplierScorecard as Row,
    SlipDistribution,
    SupplierTrendPoint,
} from '../types';
import { button, createToggleGroup } from '../ui';
import { type CostReliabilityScatter, createCostReliabilityScatter } from './CostReliabilityScatter';
import { type DeliverySlipHistograms, createDeliverySlipHistograms } from './DeliverySlipHistograms';
import { emptyState } from './EmptyState';
import { type QualityCostChart, createQualityCostChart } from './QualityCostChart';
import { createSupplierScorecard } from './SupplierScorecard';
import { type TrendMetric, createSupplierTrendChart } from './SupplierTrendChart';
import { createClickAway } from './useClickAway';

const NO_MATERIALS: MaterialQualityCost[] = [];

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
    /** Every chart and the scorecard share this one selected supplier. */
    onSelectedSupplierChange: (supplierId: string | undefined) => void;
    slipDistributions: SlipDistribution[];
    qualityCost: QualityCost[];
    /** Each supplier's rejected cost per material, for drilling into a quality cost bar. */
    materialQualityCost: Map<string, MaterialQualityCost[]>;
    trend: Map<string, SupplierTrendPoint[]>;
}

type Props = Omit<SuppliersViewProps, 'onSelectedSupplierChange'>;

export interface SuppliersView extends View {
    update(props: Props): void;
}

/**
 * The weekly scorecard review: how each of her suppliers is actually performing.
 *
 * Every view here reads a rolling twelve months rather than the selected period. Steel lead times
 * run to six weeks, so a quarter contains barely any completed deliveries — and three points is
 * not a trend. The period selector drives the spend views instead.
 */
export function createSuppliersView({ onSelectedSupplierChange, ...props }: SuppliersViewProps): SuppliersView {
    let current: Props = props;
    let mounted = false;
    // The view's own state, which a fresh view starts over: the React `useState`s.
    let metric: TrendMetric = 'price';
    let drilledSupplierId: string | undefined;

    const drilledMaterialsOf = memo(
        (drilledSupplierId: string | undefined, materialQualityCost: Map<string, MaterialQualityCost[]>) =>
            drilledSupplierId == null ? NO_MATERIALS : (materialQualityCost.get(drilledSupplierId) ?? NO_MATERIALS)
    );

    const onDrill = (supplierId: string) => {
        drilledSupplierId = supplierId;
        render();
        onSelectedSupplierChange(supplierId);
    };

    const qualityBox = h('div', { class: 'pc-chart-box', 'data-keeps-selection': 'true' });
    const onBack = () => {
        drilledSupplierId = undefined;
        // With nothing selected no drill button replaces Back, so focus moves to the chart rather than the page.
        if (current.selectedSupplierId == null) {
            qualityBox.querySelector<HTMLElement>('.ag-charts-series-area')?.focus();
        }
        render();
    };

    // Mounted only while this tab is shown, so a click elsewhere on the page clears only while it is in view.
    const clickAway = createClickAway(() => onSelectedSupplierChange(undefined));

    // A card has no empty space to click away on, so selecting the selected supplier again clears it.
    const onToggleSupplier = (supplierId: string) =>
        onSelectedSupplierChange(supplierId === current.selectedSupplierId ? undefined : supplierId);

    // Fills the card: a fixed box would leave dead space under it in a row that takes the rest of the page.
    const scatterBox = h('div', { class: 'pc-chart-box--grow', 'data-keeps-selection': 'true' });
    let scatter: CostReliabilityScatter | undefined;

    const histogramsCard = h(
        'section',
        { class: 'pc-card' },
        h('div', { class: 'pc-card-head' }, h('div', {}, h('h2', { class: 'pc-card-title' }, 'Days late by supplier')))
    );
    let histograms: DeliverySlipHistograms | undefined;
    let histogramsEmpty: HTMLElement | undefined;

    const qualityTitle = h(
        'div',
        { class: 'pc-card-title-inline' },
        h('h2', { class: 'pc-card-title' }, 'Cost of rejected material')
    );
    let qualitySub: HTMLSpanElement | undefined;
    const qualityHead = h('div', { class: 'pc-card-head pc-card-head--action' }, qualityTitle);
    /** Both buttons share one slot, so the element and its focus are kept as the drill flips. */
    let qualityAction: HTMLButtonElement | undefined;
    let qualityActionHandler: (() => void) | undefined;
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
        onSelectedSupplierChange,
    });

    const scorecard = createSupplierScorecard({
        rows: current.rows,
        supplierColors: current.supplierColors,
        selectedSupplierId: current.selectedSupplierId,
        onSelect: onToggleSupplier,
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
            h('section', { class: 'pc-card' }, qualityHead, qualityBox),
            h(
                'section',
                { class: 'pc-card' },
                h(
                    'div',
                    { class: 'pc-card-head' },
                    h('div', {}, h('h2', { class: 'pc-card-title' }, 'Supplier trend')),
                    metricToggle.el
                ),
                h('div', { class: 'pc-chart-box', 'data-keeps-selection': 'true' }, trendChart.el)
            )
        ),
        h(
            'section',
            { class: 'pc-card' },
            h('div', { class: 'pc-card-head' }, h('div', {}, h('h2', { class: 'pc-card-title' }, 'My suppliers'))),
            scorecard.el
        )
    );

    /** The drill's subtitle and its button: "See X's materials", "Back", or none. */
    function syncQualityHead() {
        const { supplierNames, selectedSupplierId, qualityCost, materialQualityCost } = current;

        if (drilledSupplierId != null) {
            if (!qualitySub) {
                qualitySub = h('span', { class: 'pc-card-sub' });
                qualityTitle.append(qualitySub);
            }
            qualitySub.textContent = `from ${supplierNames.get(drilledSupplierId)}`;
        } else if (qualitySub) {
            qualitySub.remove();
            qualitySub = undefined;
        }

        // The keyboard's way into a drill, as a chart's double-click has no key of its own.
        const drillableSupplierId =
            drilledSupplierId == null &&
            selectedSupplierId != null &&
            qualityCost.some((row) => row.supplierId === selectedSupplierId) &&
            (materialQualityCost.get(selectedSupplierId)?.length ?? 0) > 0
                ? selectedSupplierId
                : undefined;

        let label: string | undefined;
        if (drilledSupplierId != null) {
            label = '← Back to all suppliers';
            qualityActionHandler = onBack;
        } else if (drillableSupplierId != null) {
            label = `See ${supplierNames.get(drillableSupplierId)}'s materials →`;
            qualityActionHandler = () => onDrill(drillableSupplierId);
        }
        if (label == null) {
            qualityAction?.remove();
            qualityAction = undefined;
            qualityActionHandler = undefined;
            return;
        }
        if (!qualityAction) {
            qualityAction = button({ class: 'pc-btn-sm', onclick: () => qualityActionHandler?.() });
            qualityHead.append(qualityAction);
        }
        qualityAction.textContent = label;
    }

    /** The conditional renders: a chart while it has data, the empty state otherwise. */
    function syncSlots() {
        const { rows, supplierColors, selectedSupplierId, slipDistributions, qualityCost, materialQualityCost } =
            current;

        if (rows.some((row) => row.orderCount > 0)) {
            if (!scatter) {
                scatter = createCostReliabilityScatter({
                    rows,
                    supplierColors,
                    selectedSupplierId,
                    onSelectedSupplierChange,
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
                    onSelectedSupplierChange,
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

        const drilledMaterials = drilledMaterialsOf(drilledSupplierId, materialQualityCost);
        if (qualityCost.length > 0 && (drilledSupplierId == null || drilledMaterials.length > 0)) {
            const qualityProps = {
                rows: qualityCost,
                drilledSupplierId,
                materialRows: drilledMaterials,
                supplierColors,
                selectedSupplierId,
            };
            if (!quality) {
                quality = createQualityCostChart({ ...qualityProps, onSelectedSupplierChange, onDrill });
                qualityBox.replaceChildren(quality.el);
                if (mounted) quality.mount();
            } else {
                quality.update(qualityProps);
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
        clickAway.setActive(current.selectedSupplierId != null);
        syncQualityHead();
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
            const selectionChanged = next.selectedSupplierId !== current.selectedSupplierId;
            current = next;
            // A drill shows one supplier's materials, so selecting another supplier leaves it; clearing
            // the selection does not.
            if (selectionChanged && next.selectedSupplierId != null && drilledSupplierId !== next.selectedSupplierId) {
                drilledSupplierId = undefined;
            }
            render();
        },
        destroy() {
            clickAway.destroy();
            scatter?.destroy();
            histograms?.destroy();
            quality?.destroy();
            trendChart.destroy();
            scorecard.destroy();
        },
    };
}
