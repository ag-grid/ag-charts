import type { BurnUpPoint, Kpi, SpendNode, SpendTrend, SupplierShareRow } from '../types';
import type { MySpendPosition } from '../workspace';
import { BudgetBurnUp } from './BudgetBurnUp';
import { EmptyState } from './EmptyState';
import { KpiStrip } from './KpiStrip';
import { SpendSunburst } from './SpendSunburst';
import { SpendTrendChart } from './SpendTrendChart';
import { SupplierShareChart } from './SupplierShareChart';

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

/**
 * The quarterly review: where her spend goes, whether it is on plan, and why it moved.
 *
 * This is the tab she opens for a supplier business review or a budget conversation, which is why
 * the composition, the pacing and the variance decomposition sit together — they are the three
 * questions that always follow one another.
 */
export function SpendView({
    kpis,
    tree,
    supplierNames,
    supplierColors,
    shareRows,
    burnUp,
    spendPosition,
    spendTrend,
    subcategories,
}: SpendViewProps) {
    // Weeks are named by their day, months by their month — the granularity the bars are drawn at.
    const trendEndLabel = spendTrend.end.toLocaleDateString(
        'en-US',
        spendTrend.grain === 'week' ? { month: 'short', day: 'numeric' } : { month: 'short', year: 'numeric' }
    );
    const trendBuckets = spendTrend.rows.length;
    return (
        <div className="pc-view-content">
            <KpiStrip kpis={kpis} />

            <div className="pc-grid-2">
                <section className="pc-card">
                    <div className="pc-card-head">
                        <div>
                            <h2 className="pc-card-title">Remaining runway</h2>
                        </div>
                    </div>
                    <div className="pc-chart-box">
                        <BudgetBurnUp points={burnUp} budget={spendPosition.budget} />
                    </div>
                </section>
                <section className="pc-card">
                    <div className="pc-card-head">
                        <div>
                            <h2 className="pc-card-title">My spend over time</h2>
                        </div>
                        {/*
                         * Names the grain and where the bars stop: the window follows the period
                         * selector, and the bucket still in progress is excluded from it.
                         */}
                        <span className="pc-card-sub">
                            {trendBuckets} complete {spendTrend.grain}
                            {trendBuckets === 1 ? '' : 's'} to {trendEndLabel}
                        </span>
                    </div>
                    <div className="pc-chart-box">
                        {trendBuckets > 0 ? (
                            <SpendTrendChart
                                rows={spendTrend.rows}
                                subcategories={subcategories}
                                grain={spendTrend.grain}
                            />
                        ) : (
                            <EmptyState
                                message={`No complete ${spendTrend.grain} in this period yet`}
                                hint="Try a wider period from the header."
                            />
                        )}
                    </div>
                </section>
            </div>

            <div className="pc-grid-2">
                <section className="pc-card">
                    <div className="pc-card-head">
                        <div>
                            <h2 className="pc-card-title">My spend breakdown</h2>
                        </div>
                    </div>
                    <div className="pc-chart-box-md">
                        {tree.spend > 0 ? (
                            <SpendSunburst tree={tree} supplierColors={supplierColors} />
                        ) : (
                            <EmptyState message="No spend in this period" hint="Try a wider period from the header." />
                        )}
                    </div>
                </section>
                <section className="pc-card">
                    <div className="pc-card-head">
                        <div>
                            <h2 className="pc-card-title">Supplier concentration</h2>
                        </div>
                    </div>
                    <div className="pc-chart-box-md">
                        {tree.spend > 0 ? (
                            <SupplierShareChart
                                rows={shareRows}
                                supplierNames={supplierNames}
                                supplierColors={supplierColors}
                            />
                        ) : (
                            <EmptyState message="No spend in this period" hint="Try a wider period from the header." />
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
