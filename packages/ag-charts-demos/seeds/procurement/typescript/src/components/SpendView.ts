import { type View, h } from '../dom';
import type { BurnUpPoint, Kpi, SpendNode, SpendTrend, SupplierShareRow } from '../types';
import type { MySpendPosition } from '../workspace';
import { createBudgetBurnUp } from './BudgetBurnUp';
import { emptyState } from './EmptyState';
import { createKpiStrip } from './KpiStrip';
import { type SpendSunburst, createSpendSunburst } from './SpendSunburst';
import { type SpendTrendChart, createSpendTrendChart } from './SpendTrendChart';
import { type SupplierShareChart, createSupplierShareChart } from './SupplierShareChart';

interface SpendViewProps {
    /** Her spend against her annual allocation, which frames every figure below it. */
    kpis: Kpi[];
    tree: SpendNode;
    supplierNames: Map<string, string>;
    supplierColors: Record<string, string>;
    shareRows: SupplierShareRow[];
    burnUp: BurnUpPoint[];
    /** Her position against the selected window's allocation — the tile above reads the same object. */
    spendPosition: MySpendPosition;
    /** Committed spend over the selected window, at whatever grain that window is read in. */
    spendTrend: SpendTrend;
    subcategories: string[];
}

export interface SpendView extends View {
    update(props: SpendViewProps): void;
}

/** Names the grain and where the bars stop: the window follows the period selector, and the bucket still in progress is excluded from it. */
function trendSubtitle(spendTrend: SpendTrend): string {
    // Weeks are named by their day, months by their month — the granularity the bars are drawn at.
    const trendEndLabel = spendTrend.end.toLocaleDateString(
        'en-US',
        spendTrend.grain === 'week' ? { month: 'short', day: 'numeric' } : { month: 'short', year: 'numeric' }
    );
    const trendBuckets = spendTrend.rows.length;
    return `${trendBuckets} complete ${spendTrend.grain}${trendBuckets === 1 ? '' : 's'} to ${trendEndLabel}`;
}

/**
 * The quarterly review: where her spend goes, whether it is on plan, and why it moved.
 *
 * This is the tab she opens for a supplier business review or a budget conversation, which is why
 * the composition, the pacing and the variance decomposition sit together — they are the three
 * questions that always follow one another.
 */
export function createSpendView(props: SpendViewProps): SpendView {
    let current = props;
    let mounted = false;

    const kpiStrip = createKpiStrip(current.kpis);
    const burnUp = createBudgetBurnUp({ points: current.burnUp, budget: current.spendPosition.budget });

    const trendSub = h('span', { class: 'pc-card-sub' }, trendSubtitle(current.spendTrend));
    const trendBox = h('div', { class: 'pc-chart-box' });
    let trend: SpendTrendChart | undefined;

    const sunburstBox = h('div', { class: 'pc-chart-box-md' });
    let sunburst: SpendSunburst | undefined;
    const shareBox = h('div', { class: 'pc-chart-box-md' });
    let share: SupplierShareChart | undefined;

    const el = h(
        'div',
        { class: 'pc-view-content' },
        kpiStrip.el,
        h(
            'div',
            { class: 'pc-grid-2' },
            h(
                'section',
                { class: 'pc-card' },
                h(
                    'div',
                    { class: 'pc-card-head' },
                    h('div', {}, h('h2', { class: 'pc-card-title' }, 'Remaining runway'))
                ),
                h('div', { class: 'pc-chart-box' }, burnUp.el)
            ),
            h(
                'section',
                { class: 'pc-card' },
                h(
                    'div',
                    { class: 'pc-card-head' },
                    h('div', {}, h('h2', { class: 'pc-card-title' }, 'My spend over time')),
                    trendSub
                ),
                trendBox
            )
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
                    h('div', {}, h('h2', { class: 'pc-card-title' }, 'My spend breakdown'))
                ),
                sunburstBox
            ),
            h(
                'section',
                { class: 'pc-card' },
                h(
                    'div',
                    { class: 'pc-card-head' },
                    h('div', {}, h('h2', { class: 'pc-card-title' }, 'Supplier concentration'))
                ),
                shareBox
            )
        )
    );

    /** The conditional renders: a chart while it has data, the empty state otherwise. */
    function syncSlots() {
        const { tree, supplierNames, supplierColors, shareRows, spendTrend, subcategories } = current;

        if (spendTrend.rows.length > 0) {
            if (!trend) {
                trend = createSpendTrendChart({ rows: spendTrend.rows, subcategories, grain: spendTrend.grain });
                trendBox.replaceChildren(trend.el);
                if (mounted) trend.mount();
            } else {
                trend.update({ rows: spendTrend.rows, subcategories, grain: spendTrend.grain });
            }
        } else if (trend || trendBox.childElementCount === 0) {
            trend?.destroy();
            trend = undefined;
            trendBox.replaceChildren(
                emptyState({
                    message: `No complete ${spendTrend.grain} in this period yet`,
                    hint: 'Try a wider period from the header.',
                })
            );
        }

        if (tree.spend > 0) {
            if (!sunburst) {
                sunburst = createSpendSunburst({ tree, supplierColors });
                sunburstBox.replaceChildren(sunburst.el);
                if (mounted) sunburst.mount();
            } else {
                sunburst.update({ tree, supplierColors });
            }
            if (!share) {
                share = createSupplierShareChart({ rows: shareRows, supplierNames, supplierColors });
                shareBox.replaceChildren(share.el);
                if (mounted) share.mount();
            } else {
                share.update({ rows: shareRows, supplierNames, supplierColors });
            }
        } else if (sunburst || share || sunburstBox.childElementCount === 0) {
            sunburst?.destroy();
            share?.destroy();
            sunburst = share = undefined;
            sunburstBox.replaceChildren(
                emptyState({ message: 'No spend in this period', hint: 'Try a wider period from the header.' })
            );
            shareBox.replaceChildren(
                emptyState({ message: 'No spend in this period', hint: 'Try a wider period from the header.' })
            );
        }
    }

    function render() {
        kpiStrip.update(current.kpis);
        burnUp.update({ points: current.burnUp, budget: current.spendPosition.budget });
        trendSub.textContent = trendSubtitle(current.spendTrend);
        syncSlots();
    }
    render();

    return {
        el,
        mount() {
            mounted = true;
            kpiStrip.mount();
            burnUp.mount();
            trend?.mount();
            sunburst?.mount();
            share?.mount();
        },
        update(next) {
            current = next;
            render();
        },
        destroy() {
            kpiStrip.destroy();
            burnUp.destroy();
            trend?.destroy();
            sunburst?.destroy();
            share?.destroy();
        },
    };
}
