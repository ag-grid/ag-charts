import { Component, input, output, signal } from '@angular/core';

import type { QualityCost, SupplierScorecard as Row, SlipDistribution, SupplierTrendPoint } from '../types';
import { ToggleGroup } from '../ui';
import { CostReliabilityScatter } from './cost-reliability-scatter';
import { DeliverySlipHistograms } from './delivery-slip-histograms';
import { EmptyState } from './empty-state';
import { QualityCostChart } from './quality-cost-chart';
import { SupplierScorecard } from './supplier-scorecard';
import { SupplierTrendChart, type TrendMetric } from './supplier-trend-chart';

/** Price leads: it is the metric the renewal conversation opens on. */
const METRIC_OPTIONS: { value: TrendMetric; label: string }[] = [
    { value: 'price', label: 'Price' },
    { value: 'onTime', label: 'On time' },
    { value: 'quality', label: 'Quality' },
];

/**
 * The weekly scorecard review: how each of her suppliers is actually performing.
 *
 * Every view here reads a rolling twelve months rather than the selected period. Steel lead times
 * run to six weeks, so a quarter contains barely any completed deliveries — and three points is
 * not a trend. The period selector drives the spend views instead.
 *
 * The host is the React root `.pc-view-content.pc-view-content--fill`.
 */
@Component({
    selector: 'div[pcSuppliersView]',
    imports: [
        CostReliabilityScatter,
        DeliverySlipHistograms,
        EmptyState,
        QualityCostChart,
        SupplierScorecard,
        SupplierTrendChart,
        ToggleGroup,
    ],
    host: { class: 'pc-view-content pc-view-content--fill' },
    template: `
        <div class="pc-grid-2 pc-grid-2--fill">
            <section class="pc-card">
                <div class="pc-card-head">
                    <div>
                        <h2 class="pc-card-title">Cost vs delivery</h2>
                    </div>
                </div>
                <!-- Fills the card: a fixed box would leave dead space under it in a row that
                    takes the rest of the page. -->
                <div class="pc-chart-box--grow">
                    @if (hasOrders()) {
                        <div
                            pcCostReliabilityScatter
                            [rows]="rows()"
                            [supplierColors]="supplierColors()"
                            [selectedSupplierId]="selectedSupplierId()"
                            (select)="selectSupplier.emit($event)"
                        ></div>
                    } @else {
                        <div
                            pcEmptyState
                            message="No orders for this selection"
                            hint="Nothing was ordered here in the selected period."
                        ></div>
                    }
                </div>
            </section>

            <section class="pc-card">
                <div class="pc-card-head">
                    <div>
                        <h2 class="pc-card-title">Days late by supplier</h2>
                    </div>
                </div>
                @if (slipDistributions().length > 0) {
                    <div
                        pcDeliverySlipHistograms
                        [rows]="slipDistributions()"
                        [supplierColors]="supplierColors()"
                        [selectedSupplierId]="selectedSupplierId()"
                        (select)="selectSupplier.emit($event)"
                    ></div>
                } @else {
                    <div
                        pcEmptyState
                        message="Not enough deliveries to describe a distribution"
                        hint="A histogram needs a handful of completed deliveries behind it."
                    ></div>
                }
            </section>
        </div>

        <div class="pc-grid-2">
            <section class="pc-card">
                <div class="pc-card-head">
                    <div>
                        <h2 class="pc-card-title">Cost of rejected material</h2>
                    </div>
                </div>
                <div class="pc-chart-box">
                    @if (qualityCost().length > 0) {
                        <div
                            pcQualityCostChart
                            [rows]="qualityCost()"
                            [supplierColors]="supplierColors()"
                            [selectedSupplierId]="selectedSupplierId()"
                            (select)="selectSupplier.emit($event)"
                        ></div>
                    } @else {
                        <div
                            pcEmptyState
                            message="Nothing delivered in this window"
                            hint="Widen the period to see what inspection rejected."
                        ></div>
                    }
                </div>
            </section>

            <section class="pc-card">
                <div class="pc-card-head">
                    <div>
                        <h2 class="pc-card-title">Supplier trend</h2>
                    </div>
                    <div
                        pcToggleGroup
                        ariaLabel="Trend metric"
                        [value]="metric()"
                        (valueChange)="setMetric($event)"
                        [options]="metricOptions"
                    ></div>
                </div>
                <!-- Sized by the scorecard beside it, which hugs its grid. -->
                <div class="pc-chart-box--match">
                    <div
                        pcSupplierTrendChart
                        [trend]="trend()"
                        [supplierNames]="supplierNames()"
                        [supplierColors]="supplierColors()"
                        [metric]="metric()"
                        [selectedSupplierId]="selectedSupplierId()"
                    ></div>
                </div>
            </section>
        </div>

        <section class="pc-card">
            <div class="pc-card-head">
                <div>
                    <h2 class="pc-card-title">My suppliers</h2>
                </div>
            </div>
            <div
                pcSupplierScorecard
                [rows]="rows()"
                [supplierColors]="supplierColors()"
                [selectedSupplierId]="selectedSupplierId()"
                (select)="selectSupplier.emit($event)"
            ></div>
        </section>
    `,
})
export class SuppliersView {
    readonly rows = input.required<Row[]>();
    readonly supplierNames = input.required<Map<string, string>>();
    readonly supplierColors = input.required<Record<string, string>>();
    readonly selectedSupplierId = input<string | undefined>();
    readonly selectSupplier = output<string>();
    readonly slipDistributions = input.required<SlipDistribution[]>();
    readonly qualityCost = input.required<QualityCost[]>();
    readonly trend = input.required<Map<string, SupplierTrendPoint[]>>();

    protected readonly metricOptions = METRIC_OPTIONS;
    protected readonly metric = signal<TrendMetric>('price');
    protected readonly hasOrders = () => this.rows().some((row) => row.orderCount > 0);

    protected setMetric(value: string): void {
        this.metric.set(value as TrendMetric);
    }
}
