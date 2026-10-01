import { Component, input, output } from '@angular/core';

import type { Kpi, PoActionKind, PurchaseOrder, TrackedShipment } from '../types';
import { PcButton } from '../ui';
import { DeliveryMap } from './delivery-map';
import { EmptyState } from './empty-state';
import { KpiStrip } from './kpi-strip';
import { type PoAction, PurchaseOrderGrid } from './purchase-order-grid';
import { ShipmentSchedule } from './shipment-schedule';
import { StatusLegend } from './status-legend';

/**
 * Her order book: what needs deciding, how she is tracking, where her freight is, and the lines a
 * selected shipment holds.
 *
 * Leads with the worklist rather than a chart — a workspace opens on what its owner has to do,
 * where a dashboard opens on a summary of what happened.
 *
 * The host is the React root `.pc-view-content`.
 */
@Component({
    selector: 'div[pcOrdersView]',
    imports: [DeliveryMap, EmptyState, KpiStrip, PcButton, PurchaseOrderGrid, ShipmentSchedule, StatusLegend],
    host: { class: 'pc-view-content' },
    template: `
        <div pcKpiStrip [kpis]="kpis()"></div>

        <div class="pc-grid-2">
            <section class="pc-card">
                <div class="pc-card-head">
                    <div>
                        <h2 class="pc-card-title">My suppliers — in transit</h2>
                        <span class="pc-card-sub">Select a marker to filter the orders.</span>
                    </div>
                    <div pcStatusLegend></div>
                </div>
                <div class="pc-chart-box-md">
                    @if (shipments().length > 0) {
                        <div
                            pcDeliveryMap
                            [shipments]="shipments()"
                            [selectedShipmentId]="selectedShipmentId()"
                            (shipmentClick)="selectShipment.emit($event)"
                        ></div>
                    } @else {
                        <div
                            pcEmptyState
                            message="Nothing in transit for this supplier"
                            hint="Clear the supplier selection to see all my lanes."
                        ></div>
                    }
                </div>
            </section>

            <section class="pc-card">
                <div class="pc-card-head">
                    <div>
                        <h2 class="pc-card-title">Arrival schedule</h2>
                        <span class="pc-card-sub">Select a bar to filter the orders.</span>
                    </div>
                </div>
                <div class="pc-chart-box-md">
                    @if (shipments().length > 0) {
                        <div
                            pcShipmentSchedule
                            [shipments]="shipments()"
                            [selectedShipmentId]="selectedShipmentId()"
                            (select)="selectShipment.emit($event)"
                        ></div>
                    } @else {
                        <div
                            pcEmptyState
                            message="Nothing in transit"
                            hint="Clear the supplier selection to see all my lanes."
                        ></div>
                    }
                </div>
            </section>
        </div>

        <!-- Where this tab's own selections land — a shipment picked on the map or the schedule. -->
        <section class="pc-card">
            <div class="pc-card-head">
                <div>
                    <h2 class="pc-card-title">My purchase orders</h2>
                    <span class="pc-card-sub">{{ gridSubtitle() }}</span>
                </div>
                <div class="pc-chips">
                    @if (selectedShipmentId() != null) {
                        <span class="pc-chip">{{ selectedShipmentId() }}</span>
                    }
                    <button pcBtn (click)="clearSelection.emit()" [disabled]="!canClearSelection()"
                        >Clear selection</button
                    >
                </div>
            </div>
            @if (orders().length > 0) {
                <div
                    pcPurchaseOrderGrid
                    [orders]="orders()"
                    [poActions]="poActions()"
                    (action)="poAction.emit($event)"
                ></div>
            } @else {
                <div
                    pcEmptyState
                    message="No orders match this selection"
                    hint="Clear the selection, or widen the period."
                ></div>
            }
        </section>
    `,
})
export class OrdersView {
    readonly kpis = input.required<Kpi[]>();
    readonly shipments = input.required<TrackedShipment[]>();
    readonly selectedShipmentId = input<string | undefined>();
    readonly selectShipment = output<string>();
    /** Her order lines under the current selection — the landing point for every selection. */
    readonly orders = input.required<PurchaseOrder[]>();
    /** What the grid is showing, stated in the card's subtitle. */
    readonly gridSubtitle = input.required<string>();
    /** What she has already recorded against a line, by PO id. */
    readonly poActions = input.required<Record<string, PoActionKind>>();
    readonly poAction = output<PoAction>();
    readonly clearSelection = output<void>();
    readonly canClearSelection = input.required<boolean>();
}
