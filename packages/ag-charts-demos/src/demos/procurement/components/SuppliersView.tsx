import { useState } from 'react';

import type { QualityCost, SupplierScorecard as Row, SlipDistribution, SupplierTrendPoint } from '../types';
import { ToggleGroup } from '../ui';
import { CostReliabilityScatter } from './CostReliabilityScatter';
import { DeliverySlipHistograms } from './DeliverySlipHistograms';
import { EmptyState } from './EmptyState';
import { QualityCostChart } from './QualityCostChart';
import { SupplierScorecard } from './SupplierScorecard';
import { SupplierTrendChart, type TrendMetric } from './SupplierTrendChart';

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

/**
 * The weekly scorecard review: how each of her suppliers is actually performing.
 *
 * Every view here reads a rolling twelve months rather than the selected period. Steel lead times
 * run to six weeks, so a quarter contains barely any completed deliveries — and three points is
 * not a trend. The period selector drives the spend views instead.
 */
export function SuppliersView({
    rows,
    supplierNames,
    supplierColors,
    selectedSupplierId,
    onSelectSupplier,
    slipDistributions,
    qualityCost,
    trend,
}: SuppliersViewProps) {
    const [metric, setMetric] = useState<TrendMetric>('price');

    return (
        <div className="pc-view-content pc-view-content--fill">
            <div className="pc-grid-2 pc-grid-2--fill">
                <section className="pc-card">
                    <div className="pc-card-head">
                        <div>
                            <h2 className="pc-card-title">Cost vs delivery</h2>
                        </div>
                    </div>
                    {/* Fills the card: a fixed box would leave dead space under it in a row that
                        takes the rest of the page. */}
                    <div className="pc-chart-box--grow">
                        {rows.some((row) => row.orderCount > 0) ? (
                            <CostReliabilityScatter
                                rows={rows}
                                supplierColors={supplierColors}
                                selectedSupplierId={selectedSupplierId}
                                onSelect={onSelectSupplier}
                            />
                        ) : (
                            <EmptyState
                                message="No orders for this selection"
                                hint="Nothing was ordered here in the selected period."
                            />
                        )}
                    </div>
                </section>

                <section className="pc-card">
                    <div className="pc-card-head">
                        <div>
                            <h2 className="pc-card-title">Days late by supplier</h2>
                        </div>
                    </div>
                    {slipDistributions.length > 0 ? (
                        <DeliverySlipHistograms
                            rows={slipDistributions}
                            supplierColors={supplierColors}
                            selectedSupplierId={selectedSupplierId}
                            onSelect={onSelectSupplier}
                        />
                    ) : (
                        <EmptyState
                            message="Not enough deliveries to describe a distribution"
                            hint="A histogram needs a handful of completed deliveries behind it."
                        />
                    )}
                </section>
            </div>

            <div className="pc-grid-2">
                <section className="pc-card">
                    <div className="pc-card-head">
                        <div>
                            <h2 className="pc-card-title">Cost of rejected material</h2>
                        </div>
                    </div>
                    <div className="pc-chart-box">
                        {qualityCost.length > 0 ? (
                            <QualityCostChart
                                rows={qualityCost}
                                supplierColors={supplierColors}
                                selectedSupplierId={selectedSupplierId}
                                onSelect={onSelectSupplier}
                            />
                        ) : (
                            <EmptyState
                                message="Nothing delivered in this window"
                                hint="Widen the period to see what inspection rejected."
                            />
                        )}
                    </div>
                </section>

                <section className="pc-card">
                    <div className="pc-card-head">
                        <div>
                            <h2 className="pc-card-title">Supplier trend</h2>
                        </div>
                        <ToggleGroup
                            ariaLabel="Trend metric"
                            value={metric}
                            onValueChange={(value) => setMetric(value as TrendMetric)}
                            options={METRIC_OPTIONS}
                        />
                    </div>
                    {/* Sized by the scorecard beside it, which hugs its grid. */}
                    <div className="pc-chart-box--match">
                        <SupplierTrendChart
                            trend={trend}
                            supplierNames={supplierNames}
                            supplierColors={supplierColors}
                            metric={metric}
                            selectedSupplierId={selectedSupplierId}
                        />
                    </div>
                </section>
            </div>

            <section className="pc-card">
                <div className="pc-card-head">
                    <div>
                        <h2 className="pc-card-title">My suppliers</h2>
                    </div>
                </div>
                <SupplierScorecard
                    rows={rows}
                    supplierColors={supplierColors}
                    selectedSupplierId={selectedSupplierId}
                    onSelect={onSelectSupplier}
                />
            </section>
        </div>
    );
}
