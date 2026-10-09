import { useMemo, useState } from 'react';

import { SUBCATEGORY_RAMP } from '../chartTheme';
import type { BurnUpPoint, Kpi, SpendNode, SpendTrend, SpendTrendSplit, SupplierShareRow } from '../types';
import { ToggleGroup, ToggleIcon, type ToggleOption } from '../ui';
import type { MySpendPosition } from '../workspace';
import { BudgetBurnUp } from './BudgetBurnUp';
import { EmptyState } from './EmptyState';
import { KpiStrip } from './KpiStrip';
import { SpendSunburst } from './SpendSunburst';
import { SpendTrendChart, type SpendTrendStack } from './SpendTrendChart';
import { SupplierShareChart, type SupplierShareView } from './SupplierShareChart';

/** Icons are Carbon's `HeatMap_03` and `ChartBar` (Apache-2.0), as used for these series on the AG website. */
const SHARE_VIEW_OPTIONS: (ToggleOption & { value: SupplierShareView })[] = [
    {
        value: 'heatmap',
        label: 'Heatmap',
        icon: (
            <ToggleIcon>
                <path d="M27,3H5A2.0023,2.0023,0,0,0,3,5V27a2.0023,2.0023,0,0,0,2,2H27a2.0023,2.0023,0,0,0,2-2V5A2.0023,2.0023,0,0,0,27,3ZM19,9H13V5h6Zm0,2v4H13V11Zm-8,0v4H5V11Zm0,6v4H5V17Zm2,0h6v4H13Zm8-2V11h6l0,4ZM5,23h6v4H5Zm16,4V23h6v4Z" />
            </ToggleIcon>
        ),
    },
    {
        value: 'bar',
        label: 'Stacked bar',
        icon: (
            <ToggleIcon>
                <path d="M4,2H2V28a2,2,0,0,0,2,2H30V28H4V25H26V17H4V13H18V5H4ZM24,19v4H4V19ZM16,7v4H4V7Z" />
            </ToggleIcon>
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

    const [split, setSplit] = useState<SpendTrendSplit>('material');
    const trendStacks = useMemo<SpendTrendStack[]>(
        () =>
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
                  })),
        [split, subcategories, supplierNames, supplierColors]
    );
    const [shareView, setShareView] = useState<SupplierShareView>('heatmap');
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
                            {/*
                             * Names the grain and where the bars stop: the window follows the period
                             * selector, and the bucket still in progress is excluded from it.
                             */}
                            <span className="pc-card-sub">
                                {trendBuckets} complete {spendTrend.grain}
                                {trendBuckets === 1 ? '' : 's'} to {trendEndLabel}
                            </span>
                        </div>
                        <ToggleGroup
                            ariaLabel="Split by"
                            label="Split by"
                            value={split}
                            onValueChange={(value) => setSplit(value as SpendTrendSplit)}
                            options={SPLIT_OPTIONS}
                        />
                    </div>
                    <div className="pc-chart-box">
                        {trendBuckets > 0 ? (
                            <SpendTrendChart
                                rows={split === 'material' ? spendTrend.rows : spendTrend.supplierRows}
                                stacks={trendStacks}
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
                        <ToggleGroup
                            ariaLabel="View as"
                            label="View as"
                            value={shareView}
                            onValueChange={(value) => setShareView(value as SupplierShareView)}
                            options={SHARE_VIEW_OPTIONS}
                        />
                    </div>
                    <div className="pc-chart-box-md">
                        {tree.spend > 0 ? (
                            <SupplierShareChart
                                rows={shareRows}
                                supplierNames={supplierNames}
                                supplierColors={supplierColors}
                                view={shareView}
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
