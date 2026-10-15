import { useMemo, useState } from 'react';

import { SUBCATEGORY_RAMP } from '../chartTheme';
import type { BurnUpPoint, Kpi, SpendNode, SpendTrend, SpendTrendSplit, SupplierShareRow } from '../types';
import { ToggleGroup, ToggleIcon, type ToggleOption } from '../ui';
import type { MySpendPosition } from '../workspace';
import { BudgetBurnUp } from './BudgetBurnUp';
import { EmptyState } from './EmptyState';
import { KpiStrip } from './KpiStrip';
import { SpendBreakdownGrid } from './SpendBreakdownGrid';
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

type BreakdownView = 'sunburst' | 'grid';

/** Icons are Carbon's `ChartSunburst` and `DataTable` (Apache-2.0). */
const BREAKDOWN_VIEW_OPTIONS: (ToggleOption & { value: BreakdownView })[] = [
    {
        value: 'sunburst',
        label: 'Sunburst',
        icon: (
            <ToggleIcon>
                <path d="M16,2a1,1,0,0,0-1,1v7.09a5.9618,5.9618,0,0,0-2.46,1.043L7.8384,6.4311a1.4554,1.4554,0,0,0-2.087.0244A14.05,14.05,0,0,0,9.8047,28.5972a10.8482,10.8482,0,0,0,1.8989.7676,14.0982,14.0982,0,0,0,13.8443-3.1319,1.4336,1.4336,0,0,0,.0278-2.0639L20.877,19.47A5.963,5.963,0,0,0,21.91,17H29a1,1,0,0,0,1-1A14.0158,14.0158,0,0,0,16,2Zm0,10a4,4,0,1,1-4,4A4.0045,4.0045,0,0,1,16,12ZM6.83,8.251l4.2959,4.2959a5.91,5.91,0,0,0-.0113,6.9243L6.8381,23.7481A12.0168,12.0168,0,0,1,6.83,8.251Zm1.4228,16.91,4.2759-4.2759A5.9589,5.9589,0,0,0,15,21.91v6.042A11.8783,11.8783,0,0,1,8.2529,25.1612ZM17,27.9561V21.9092a5.9631,5.9631,0,0,0,2.4609-1.0273l4.2818,4.2817A11.8905,11.8905,0,0,1,17,27.9561ZM21.91,15A6.0063,6.0063,0,0,0,17,10.09V4.041A12.0208,12.0208,0,0,1,27.9585,15Z" />
            </ToggleIcon>
        ),
    },
    {
        value: 'grid',
        label: 'Grouped table',
        icon: (
            <ToggleIcon>
                <path d="M8 18H12V20H8z" />
                <path d="M14 18H18V20H14z" />
                <path d="M8 14H12V16H8z" />
                <path d="M14 22H18V24H14z" />
                <path d="M20 14H24V16H20z" />
                <path d="M20 22H24V24H20z" />
                <path d="M27,3H5A2.0025,2.0025,0,0,0,3,5V27a2.0025,2.0025,0,0,0,2,2H27a2.0025,2.0025,0,0,0,2-2V5A2.0025,2.0025,0,0,0,27,3Zm0,2,0,4H5V5ZM5,27V11H27l0,16Z" />
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
    const trendBuckets = spendTrend.rows.length;
    // Weeks are named by their day, months by their month — the granularity the bars are drawn at.
    const trendEndLabel = spendTrend.end.toLocaleDateString(
        'en-US',
        spendTrend.grain === 'week' ? { month: 'short', day: 'numeric' } : { month: 'short', year: 'numeric' }
    );

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
    const [breakdownView, setBreakdownView] = useState<BreakdownView>('sunburst');
    const breakdown =
        breakdownView === 'sunburst' ? (
            <SpendSunburst tree={tree} supplierColors={supplierColors} />
        ) : (
            <SpendBreakdownGrid tree={tree} supplierColors={supplierColors} />
        );
    return (
        <div className="pc-view-content">
            <KpiStrip kpis={kpis} stacked />

            <div className="pc-grid-2">
                <section className="pc-card">
                    <div className="pc-card-head">
                        <div>
                            <h2 className="pc-card-title">Remaining runway</h2>
                        </div>
                    </div>
                    <div className="pc-chart-box--grow">
                        <BudgetBurnUp points={burnUp} budget={spendPosition.budget} />
                    </div>
                </section>
                <section className="pc-card">
                    <div className="pc-card-head">
                        <div>
                            <h2 className="pc-card-title">Spend over time</h2>
                            {/* The bucket still in progress is left out, so the bars can stop short of today. */}
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
                            <h2 className="pc-card-title">Spend breakdown</h2>
                        </div>
                        <ToggleGroup
                            ariaLabel="View as: breakdown"
                            label="View as"
                            value={breakdownView}
                            onValueChange={(value) => setBreakdownView(value as BreakdownView)}
                            options={BREAKDOWN_VIEW_OPTIONS}
                        />
                    </div>
                    <div className="pc-chart-box-md">
                        {tree.spend > 0 ? (
                            breakdown
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
                            ariaLabel="View as: concentration"
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
