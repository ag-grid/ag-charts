import { Component, computed, input } from '@angular/core';

import type { BurnUpPoint, Kpi, SpendNode, SpendTrend, SupplierShareRow } from '../types';
import type { MySpendPosition } from '../workspace';
import { BudgetBurnUp } from './budget-burn-up';
import { EmptyState } from './empty-state';
import { KpiStrip } from './kpi-strip';
import { SpendSunburst } from './spend-sunburst';
import { SpendTrendChart } from './spend-trend-chart';
import { SupplierShareChart } from './supplier-share-chart';

/**
 * The quarterly review: where her spend goes, whether it is on plan, and why it moved.
 *
 * This is the tab she opens for a supplier business review or a budget conversation, which is why
 * the composition, the pacing and the variance decomposition sit together — they are the three
 * questions that always follow one another.
 *
 * The host is the React root `.pc-view-content`.
 */
@Component({
    selector: 'div[pcSpendView]',
    imports: [BudgetBurnUp, EmptyState, KpiStrip, SpendSunburst, SpendTrendChart, SupplierShareChart],
    host: { class: 'pc-view-content' },
    template: `
        <div pcKpiStrip [kpis]="kpis()"></div>

        <div class="pc-grid-2">
            <section class="pc-card">
                <div class="pc-card-head">
                    <div>
                        <h2 class="pc-card-title">Remaining runway</h2>
                    </div>
                </div>
                <div class="pc-chart-box">
                    <div pcBudgetBurnUp [points]="burnUp()" [budget]="spendPosition().budget"></div>
                </div>
            </section>
            <section class="pc-card">
                <div class="pc-card-head">
                    <div>
                        <h2 class="pc-card-title">My spend over time</h2>
                    </div>
                    <!--
                        Names the grain and where the bars stop: the window follows the period
                        selector, and the bucket still in progress is excluded from it.
                    -->
                    <span class="pc-card-sub"
                        >{{ trendBuckets() }} complete {{ spendTrend().grain }}{{ trendBuckets() === 1 ? '' : 's' }} to
                        {{ trendEndLabel() }}</span
                    >
                </div>
                <div class="pc-chart-box">
                    @if (trendBuckets() > 0) {
                        <div
                            pcSpendTrendChart
                            [rows]="spendTrend().rows"
                            [subcategories]="subcategories()"
                            [grain]="spendTrend().grain"
                        ></div>
                    } @else {
                        <div
                            pcEmptyState
                            [message]="'No complete ' + spendTrend().grain + ' in this period yet'"
                            hint="Try a wider period from the header."
                        ></div>
                    }
                </div>
            </section>
        </div>

        <div class="pc-grid-2">
            <section class="pc-card">
                <div class="pc-card-head">
                    <div>
                        <h2 class="pc-card-title">My spend breakdown</h2>
                    </div>
                </div>
                <div class="pc-chart-box-md">
                    @if (tree().spend > 0) {
                        <div pcSpendSunburst [tree]="tree()" [supplierColors]="supplierColors()"></div>
                    } @else {
                        <div
                            pcEmptyState
                            message="No spend in this period"
                            hint="Try a wider period from the header."
                        ></div>
                    }
                </div>
            </section>
            <section class="pc-card">
                <div class="pc-card-head">
                    <div>
                        <h2 class="pc-card-title">Supplier concentration</h2>
                    </div>
                </div>
                <div class="pc-chart-box-md">
                    @if (tree().spend > 0) {
                        <div
                            pcSupplierShareChart
                            [rows]="shareRows()"
                            [supplierNames]="supplierNames()"
                            [supplierColors]="supplierColors()"
                        ></div>
                    } @else {
                        <div
                            pcEmptyState
                            message="No spend in this period"
                            hint="Try a wider period from the header."
                        ></div>
                    }
                </div>
            </section>
        </div>
    `,
})
export class SpendView {
    /** Her spend against her annual allocation, which frames every figure below it. */
    readonly kpis = input.required<Kpi[]>();
    readonly tree = input.required<SpendNode>();
    readonly supplierNames = input.required<Map<string, string>>();
    readonly supplierColors = input.required<Record<string, string>>();
    readonly shareRows = input.required<SupplierShareRow[]>();
    readonly burnUp = input.required<BurnUpPoint[]>();
    /** Her position against the selected window's allocation — the tile above reads the same object. */
    readonly spendPosition = input.required<MySpendPosition>();
    /** Committed spend over the selected window, at whatever grain that window is read in. */
    readonly spendTrend = input.required<SpendTrend>();
    readonly subcategories = input.required<string[]>();

    // Weeks are named by their day, months by their month — the granularity the bars are drawn at.
    protected readonly trendEndLabel = computed(() => {
        const spendTrend = this.spendTrend();
        return spendTrend.end.toLocaleDateString(
            'en-US',
            spendTrend.grain === 'week' ? { month: 'short', day: 'numeric' } : { month: 'short', year: 'numeric' }
        );
    });
    protected readonly trendBuckets = computed(() => this.spendTrend().rows.length);
}
