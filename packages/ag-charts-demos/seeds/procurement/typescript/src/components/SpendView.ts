import { SUBCATEGORY_RAMP } from '../chartTheme';
import { type View, h } from '../dom';
import { memo } from '../memo';
import type { BurnUpPoint, Kpi, SpendNode, SpendTrend, SpendTrendSplit, SupplierShareRow } from '../types';
import { type ToggleOption, createToggleGroup, toggleIcon } from '../ui';
import type { MySpendPosition } from '../workspace';
import { createBudgetBurnUp } from './BudgetBurnUp';
import { emptyState } from './EmptyState';
import { createKpiStrip } from './KpiStrip';
import { type SpendBreakdownGrid, createSpendBreakdownGrid } from './SpendBreakdownGrid';
import { type SpendSunburst, createSpendSunburst } from './SpendSunburst';
import { type SpendTrendChart, type SpendTrendStack, createSpendTrendChart } from './SpendTrendChart';
import { type SupplierShareChart, type SupplierShareView, createSupplierShareChart } from './SupplierShareChart';

/** Icons are Carbon's `HeatMap_03` and `ChartBar` (Apache-2.0), as used for these series on the AG website. */
const shareViewOptions = (): (ToggleOption & { value: SupplierShareView })[] => [
    {
        value: 'heatmap',
        label: 'Heatmap',
        icon: toggleIcon(
            'M27,3H5A2.0023,2.0023,0,0,0,3,5V27a2.0023,2.0023,0,0,0,2,2H27a2.0023,2.0023,0,0,0,2-2V5A2.0023,2.0023,0,0,0,27,3ZM19,9H13V5h6Zm0,2v4H13V11Zm-8,0v4H5V11Zm0,6v4H5V17Zm2,0h6v4H13Zm8-2V11h6l0,4ZM5,23h6v4H5Zm16,4V23h6v4Z'
        ),
    },
    {
        value: 'bar',
        label: 'Stacked bar',
        icon: toggleIcon('M4,2H2V28a2,2,0,0,0,2,2H30V28H4V25H26V17H4V13H18V5H4ZM24,19v4H4V19ZM16,7v4H4V7Z'),
    },
];

type BreakdownView = 'sunburst' | 'grid';

/** Icons are Carbon's `ChartSunburst` and `DataTable` (Apache-2.0). */
const breakdownViewOptions = (): (ToggleOption & { value: BreakdownView })[] => [
    {
        value: 'sunburst',
        label: 'Sunburst',
        icon: toggleIcon(
            'M16,2a1,1,0,0,0-1,1v7.09a5.9618,5.9618,0,0,0-2.46,1.043L7.8384,6.4311a1.4554,1.4554,0,0,0-2.087.0244A14.05,14.05,0,0,0,9.8047,28.5972a10.8482,10.8482,0,0,0,1.8989.7676,14.0982,14.0982,0,0,0,13.8443-3.1319,1.4336,1.4336,0,0,0,.0278-2.0639L20.877,19.47A5.963,5.963,0,0,0,21.91,17H29a1,1,0,0,0,1-1A14.0158,14.0158,0,0,0,16,2Zm0,10a4,4,0,1,1-4,4A4.0045,4.0045,0,0,1,16,12ZM6.83,8.251l4.2959,4.2959a5.91,5.91,0,0,0-.0113,6.9243L6.8381,23.7481A12.0168,12.0168,0,0,1,6.83,8.251Zm1.4228,16.91,4.2759-4.2759A5.9589,5.9589,0,0,0,15,21.91v6.042A11.8783,11.8783,0,0,1,8.2529,25.1612ZM17,27.9561V21.9092a5.9631,5.9631,0,0,0,2.4609-1.0273l4.2818,4.2817A11.8905,11.8905,0,0,1,17,27.9561ZM21.91,15A6.0063,6.0063,0,0,0,17,10.09V4.041A12.0208,12.0208,0,0,1,27.9585,15Z'
        ),
    },
    {
        value: 'grid',
        label: 'Grouped table',
        icon: toggleIcon(
            'M8 18H12V20H8z',
            'M14 18H18V20H14z',
            'M8 14H12V16H8z',
            'M14 22H18V24H14z',
            'M20 14H24V16H20z',
            'M20 22H24V24H20z',
            'M27,3H5A2.0025,2.0025,0,0,0,3,5V27a2.0025,2.0025,0,0,0,2,2H27a2.0025,2.0025,0,0,0,2-2V5A2.0025,2.0025,0,0,0,27,3Zm0,2,0,4H5V5ZM5,27V11H27l0,16Z'
        ),
    },
];

/** Material leads: it is the split the sunburst beside it opens on. */
const SPLIT_OPTIONS: { value: SpendTrendSplit; label: string }[] = [
    { value: 'material', label: 'Material' },
    { value: 'supplier', label: 'Supplier' },
];

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

const NO_SPEND = { message: 'No spend in this period', hint: 'Try a wider period from the header.' };

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
    // The view's own state, which a fresh view starts over: the React `useState`s.
    let split: SpendTrendSplit = 'material';
    let shareView: SupplierShareView = 'heatmap';
    let breakdownView: BreakdownView = 'sunburst';

    const trendStacksOf = memo(
        (
            split: SpendTrendSplit,
            subcategories: string[],
            supplierNames: Map<string, string>,
            supplierColors: Record<string, string>
        ): SpendTrendStack[] =>
            split === 'material'
                ? subcategories.map((subcategory, index) => ({
                      key: subcategory,
                      name: subcategory,
                      fill: SUBCATEGORY_RAMP[index % SUBCATEGORY_RAMP.length],
                  }))
                : Array.from(supplierNames, ([supplierId, name]) => ({
                      key: supplierId,
                      name,
                      fill: supplierColors[supplierId],
                  }))
    );

    const kpiStrip = createKpiStrip(current.kpis, true);
    const burnUp = createBudgetBurnUp({ points: current.burnUp, budget: current.spendPosition.budget });

    const splitToggle = createToggleGroup({
        ariaLabel: 'Split by',
        label: 'Split by',
        value: split,
        onValueChange: (value) => {
            split = value as SpendTrendSplit;
            render();
        },
        options: SPLIT_OPTIONS,
    });
    const breakdownToggle = createToggleGroup({
        ariaLabel: 'View as: breakdown',
        label: 'View as',
        value: breakdownView,
        onValueChange: (value) => {
            breakdownView = value as BreakdownView;
            render();
        },
        options: breakdownViewOptions(),
    });
    const shareToggle = createToggleGroup({
        ariaLabel: 'View as: concentration',
        label: 'View as',
        value: shareView,
        onValueChange: (value) => {
            shareView = value as SupplierShareView;
            render();
        },
        options: shareViewOptions(),
    });

    // The bucket still in progress is left out, so the bars can stop short of today.
    const trendSub = h('span', { class: 'pc-card-sub' });
    const trendBox = h('div', { class: 'pc-chart-box' });
    let trend: SpendTrendChart | undefined;
    const breakdownBox = h('div', { class: 'pc-chart-box-md' });
    let breakdown: SpendSunburst | SpendBreakdownGrid | undefined;
    let shownBreakdownView: BreakdownView | undefined;
    const shareBox = h('div', { class: 'pc-chart-box-md' });
    let share: SupplierShareChart | undefined;

    const card = (title: HTMLElement, control: HTMLElement | undefined, box: HTMLElement) =>
        h('section', { class: 'pc-card' }, h('div', { class: 'pc-card-head' }, title, control), box);
    const title = (text: string, ...rest: HTMLElement[]) =>
        h('div', {}, h('h2', { class: 'pc-card-title' }, text), ...rest);

    const el = h(
        'div',
        { class: 'pc-view-content' },
        kpiStrip.el,
        h(
            'div',
            { class: 'pc-grid-2' },
            card(title('Remaining runway'), undefined, h('div', { class: 'pc-chart-box--grow' }, burnUp.el)),
            card(title('Spend over time', trendSub), splitToggle.el, trendBox)
        ),
        h(
            'div',
            { class: 'pc-grid-2' },
            card(title('Spend breakdown'), breakdownToggle.el, breakdownBox),
            card(title('Supplier concentration'), shareToggle.el, shareBox)
        )
    );

    /** Destroys the breakdown's chart or grid; the grid removes its own element. */
    function dropBreakdown() {
        breakdown?.destroy();
        breakdown = undefined;
        shownBreakdownView = undefined;
    }

    /** The conditional renders: a chart while it has data, the empty state otherwise. */
    function syncSlots() {
        const { tree, supplierNames, supplierColors, shareRows, spendTrend, subcategories } = current;

        const trendBuckets = spendTrend.rows.length;
        if (trendBuckets > 0) {
            const trendProps = {
                rows: split === 'material' ? spendTrend.rows : spendTrend.supplierRows,
                stacks: trendStacksOf(split, subcategories, supplierNames, supplierColors),
                grain: spendTrend.grain,
            };
            if (!trend) {
                trend = createSpendTrendChart(trendProps);
                trendBox.replaceChildren(trend.el);
                if (mounted) trend.mount();
            } else {
                trend.update(trendProps);
            }
        } else {
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
            // The toggle swaps one component for the other, so the outgoing one unmounts.
            if (breakdown && shownBreakdownView !== breakdownView) dropBreakdown();
            if (!breakdown) {
                breakdownBox.replaceChildren();
                if (breakdownView === 'sunburst') {
                    const sunburst = createSpendSunburst({ tree, supplierColors });
                    breakdownBox.append(sunburst.el);
                    if (mounted) sunburst.mount();
                    breakdown = sunburst;
                } else {
                    const grid = createSpendBreakdownGrid({ tree, supplierColors });
                    if (mounted) grid.mount(breakdownBox);
                    breakdown = grid;
                }
                shownBreakdownView = breakdownView;
            } else {
                breakdown.update({ tree, supplierColors });
            }
        } else if (breakdown || breakdownBox.childElementCount === 0) {
            dropBreakdown();
            breakdownBox.replaceChildren(emptyState(NO_SPEND));
        }

        if (tree.spend > 0) {
            const shareProps = { rows: shareRows, supplierNames, supplierColors, view: shareView };
            if (!share) {
                share = createSupplierShareChart(shareProps);
                shareBox.replaceChildren(share.el);
                if (mounted) share.mount();
            } else {
                share.update(shareProps);
            }
        } else if (share || shareBox.childElementCount === 0) {
            share?.destroy();
            share = undefined;
            shareBox.replaceChildren(emptyState(NO_SPEND));
        }
    }

    function render() {
        const { kpis, spendTrend } = current;
        kpiStrip.update(kpis);
        burnUp.update({ points: current.burnUp, budget: current.spendPosition.budget });
        const trendBuckets = spendTrend.rows.length;
        // Weeks are named by their day, months by their month — the granularity the bars are drawn at.
        const trendEndLabel = spendTrend.end.toLocaleDateString(
            'en-US',
            spendTrend.grain === 'week' ? { month: 'short', day: 'numeric' } : { month: 'short', year: 'numeric' }
        );
        trendSub.textContent = `${trendBuckets} complete ${spendTrend.grain}${trendBuckets === 1 ? '' : 's'} to ${trendEndLabel}`;
        splitToggle.setValue(split);
        breakdownToggle.setValue(breakdownView);
        shareToggle.setValue(shareView);
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
            if (breakdown && 'el' in breakdown) breakdown.mount();
            else breakdown?.mount(breakdownBox);
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
            breakdown?.destroy();
            share?.destroy();
        },
    };
}
