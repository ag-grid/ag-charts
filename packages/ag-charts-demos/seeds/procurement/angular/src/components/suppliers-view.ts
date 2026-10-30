import { Component, ElementRef, computed, effect, input, output, signal, untracked, viewChild } from '@angular/core';

import type {
    MaterialQualityCost,
    QualityCost,
    SupplierScorecard as Row,
    SlipDistribution,
    SupplierTrendPoint,
} from '../types';
import { PcButton, ToggleGroup } from '../ui';
import { clickAway } from './click-away';
import { CostReliabilityScatter } from './cost-reliability-scatter';
import { DeliverySlipHistograms } from './delivery-slip-histograms';
import { EmptyState } from './empty-state';
import { QualityCostChart } from './quality-cost-chart';
import { SupplierScorecard } from './supplier-scorecard';
import { SupplierTrendChart, type TrendMetric } from './supplier-trend-chart';

const NO_MATERIALS: MaterialQualityCost[] = [];

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
        PcButton,
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
                <div class="pc-chart-box--grow" data-keeps-selection>
                    @if (hasOrders()) {
                        <div
                            pcCostReliabilityScatter
                            [rows]="rows()"
                            [supplierColors]="supplierColors()"
                            [selectedSupplierId]="selectedSupplierId()"
                            (selectedSupplierChange)="selectedSupplierChange.emit($event)"
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
                        (selectedSupplierChange)="selectedSupplierChange.emit($event)"
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
                <div class="pc-card-head pc-card-head--action">
                    <div class="pc-card-title-inline">
                        <h2 class="pc-card-title">Cost of rejected material</h2>
                        @if (drilledSupplierId(); as drilled) {
                            <span class="pc-card-sub">from {{ supplierNames().get(drilled) }}</span>
                        }
                    </div>
                    <!-- Both buttons are one element, as React keeps them, so it keeps its focus as the drill flips. -->
                    @if (drilledSupplierId() != null || drillableSupplierId() != null) {
                        <button pcBtn class="pc-btn-sm" (click)="onDrillButton()">{{ drillButtonLabel() }}</button>
                    }
                </div>
                <div #qualityCostBox class="pc-chart-box" data-keeps-selection>
                    @if (qualityCost().length > 0 && (drilledSupplierId() == null || drilledMaterials().length > 0)) {
                        <div
                            pcQualityCostChart
                            [rows]="qualityCost()"
                            [drilledSupplierId]="drilledSupplierId()"
                            [materialRows]="drilledMaterials()"
                            [supplierColors]="supplierColors()"
                            [selectedSupplierId]="selectedSupplierId()"
                            (selectedSupplierChange)="selectedSupplierChange.emit($event)"
                            (drill)="onDrill($event)"
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
                <div class="pc-chart-box" data-keeps-selection>
                    <div
                        pcSupplierTrendChart
                        [trend]="trend()"
                        [supplierNames]="supplierNames()"
                        [supplierColors]="supplierColors()"
                        [metric]="metric()"
                        [selectedSupplierId]="selectedSupplierId()"
                        (selectedSupplierChange)="selectedSupplierChange.emit($event)"
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
                (select)="onToggleSupplier($event)"
            ></div>
        </section>
    `,
})
export class SuppliersView {
    readonly rows = input.required<Row[]>();
    readonly supplierNames = input.required<Map<string, string>>();
    readonly supplierColors = input.required<Record<string, string>>();
    readonly selectedSupplierId = input<string | undefined>();
    /** Every chart and the scorecard share this one selected supplier. */
    readonly selectedSupplierChange = output<string | undefined>();
    readonly slipDistributions = input.required<SlipDistribution[]>();
    readonly qualityCost = input.required<QualityCost[]>();
    /** Each supplier's rejected cost per material, for drilling into a quality cost bar. */
    readonly materialQualityCost = input.required<Map<string, MaterialQualityCost[]>>();
    readonly trend = input.required<Map<string, SupplierTrendPoint[]>>();

    protected readonly metricOptions = METRIC_OPTIONS;
    protected readonly metric = signal<TrendMetric>('price');
    protected readonly hasOrders = computed(() => this.rows().some((row) => row.orderCount > 0));

    protected readonly drilledSupplierId = signal<string | undefined>(undefined);
    protected readonly drilledMaterials = computed(() => {
        const drilledSupplierId = this.drilledSupplierId();
        return drilledSupplierId == null
            ? NO_MATERIALS
            : (this.materialQualityCost().get(drilledSupplierId) ?? NO_MATERIALS);
    });

    // The keyboard's way into a drill, as a chart's double-click has no key of its own.
    protected readonly drillableSupplierId = computed(() => {
        const selectedSupplierId = this.selectedSupplierId();
        return this.drilledSupplierId() == null &&
            selectedSupplierId != null &&
            this.qualityCost().some((row) => row.supplierId === selectedSupplierId) &&
            (this.materialQualityCost().get(selectedSupplierId)?.length ?? 0) > 0
            ? selectedSupplierId
            : undefined;
    });

    protected readonly drillButtonLabel = computed(() => {
        const drillableSupplierId = this.drillableSupplierId();
        return this.drilledSupplierId() == null && drillableSupplierId != null
            ? `See ${this.supplierNames().get(drillableSupplierId)}'s materials →`
            : '← Back to all suppliers';
    });

    private readonly qualityCostBox = viewChild.required<ElementRef<HTMLDivElement>>('qualityCostBox');

    constructor() {
        // A drill shows one supplier's materials, so selecting another supplier leaves it; clearing the selection does not.
        effect(() => {
            const selectedSupplierId = this.selectedSupplierId();
            if (selectedSupplierId == null) return;
            untracked(() =>
                this.drilledSupplierId.update((drilled) => (drilled === selectedSupplierId ? drilled : undefined))
            );
        });

        // Mounted only while this tab is shown, so a click elsewhere on the page clears only while it is in view.
        clickAway(
            () => this.selectedSupplierId() != null,
            () => this.selectedSupplierChange.emit(undefined)
        );
    }

    protected onDrill(supplierId: string): void {
        this.drilledSupplierId.set(supplierId);
        this.selectedSupplierChange.emit(supplierId);
    }

    protected onBack(): void {
        this.drilledSupplierId.set(undefined);
        // With nothing selected no drill button replaces Back, so focus moves to the chart rather than the page.
        if (this.selectedSupplierId() == null) {
            this.qualityCostBox().nativeElement.querySelector<HTMLElement>('.ag-charts-series-area')?.focus();
        }
    }

    /** The one button in the card head: drills into the selected supplier, or backs out of a drill. */
    protected onDrillButton(): void {
        const drillableSupplierId = this.drillableSupplierId();
        if (this.drilledSupplierId() == null && drillableSupplierId != null) this.onDrill(drillableSupplierId);
        else this.onBack();
    }

    // A card has no empty space to click away on, so selecting the selected supplier again clears it.
    protected onToggleSupplier(supplierId: string): void {
        this.selectedSupplierChange.emit(supplierId === this.selectedSupplierId() ? undefined : supplierId);
    }

    protected setMetric(value: string): void {
        this.metric.set(value as TrendMetric);
    }
}
