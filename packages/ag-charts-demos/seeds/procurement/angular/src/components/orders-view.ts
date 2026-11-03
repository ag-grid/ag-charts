import { Component, input, output, signal } from '@angular/core';

import type { Kpi, PoActionKind, PurchaseOrder, TrackedShipment } from '../types';
import { PcButton, ToggleGroup, type ToggleOption } from '../ui';
import { clickAway } from './click-away';
import { DeliveryMap } from './delivery-map';
import { EmptyState } from './empty-state';
import { KpiStrip } from './kpi-strip';
import { type PoAction, PurchaseOrderGrid } from './purchase-order-grid';
import { ShipmentSchedule } from './shipment-schedule';
import { ShipmentScheduleGrid } from './shipment-schedule-grid';
import type { ShipmentSelectionChange } from './shipment-selection';
import { StatusKeys, statusSegments } from './status-keys';

type ScheduleView = 'chart' | 'grid';

/** Icons are Carbon's `ChartBarFloating` and `DataTable` (Apache-2.0). */
const SCHEDULE_VIEW_OPTIONS: (ToggleOption & { value: ScheduleView })[] = [
    {
        value: 'chart',
        label: 'Range bar',
        icon: [
            'M28,24H14V16H28ZM16,22H26V18H16Z',
            'M26,12H8V4H26ZM10,10H24V6H10Z',
            'M30,30H4a2.0023,2.0023,0,0,1-2-2V2H4V28H30Z',
        ],
    },
    {
        value: 'grid',
        label: 'Table',
        icon: [
            'M8 18H12V20H8z',
            'M14 18H18V20H14z',
            'M8 14H12V16H8z',
            'M14 22H18V24H14z',
            'M20 14H24V16H20z',
            'M20 22H24V24H20z',
            'M27,3H5A2.0025,2.0025,0,0,0,3,5V27a2.0025,2.0025,0,0,0,2,2H27a2.0025,2.0025,0,0,0,2-2V5A2.0025,2.0025,0,0,0,27,3Zm0,2,0,4H5V5ZM5,27V11H27l0,16Z',
        ],
    },
];

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
    imports: [
        DeliveryMap,
        EmptyState,
        KpiStrip,
        PcButton,
        PurchaseOrderGrid,
        ShipmentSchedule,
        ShipmentScheduleGrid,
        StatusKeys,
        ToggleGroup,
    ],
    host: { class: 'pc-view-content' },
    template: `
        <!-- The headline and the map stack on the left; the schedule runs the full height beside them. -->
        <div class="pc-grid-2">
            <div class="pc-stack">
                <div pcKpiStrip [kpis]="kpis()"></div>

                <section class="pc-card">
                    <div class="pc-card-head">
                        <div>
                            <h2 class="pc-card-title">Orders in transit</h2>
                        </div>
                        <span pcStatusKeys [segments]="statusKeys" [showCounts]="false"></span>
                    </div>
                    <div class="pc-chart-box-md" data-keeps-selection>
                        @if (shipments().length > 0) {
                            <div
                                pcDeliveryMap
                                [shipments]="shipments()"
                                [selectedShipmentIds]="selectedShipmentIds()"
                                (selectionChange)="shipmentSelectionChange.emit($event)"
                            ></div>
                        } @else {
                            <div
                                pcEmptyState
                                message="Nothing in transit for these filters"
                                hint="Clear the supplier and subcategory filters to see all my lanes."
                            ></div>
                        }
                    </div>
                </section>
            </div>

            <section class="pc-card">
                <div class="pc-card-head">
                    <div>
                        <h2 class="pc-card-title">Arrival schedule</h2>
                    </div>
                    <div class="pc-labeled-select">
                        <span aria-hidden="true">View as</span>
                        <div
                            pcToggleGroup
                            ariaLabel="View as: arrival schedule"
                            [value]="scheduleView()"
                            (valueChange)="setScheduleView($event)"
                            [options]="scheduleViewOptions"
                        ></div>
                    </div>
                </div>
                <div class="pc-chart-box--grow" data-keeps-selection>
                    @if (shipments().length > 0) {
                        @if (scheduleView() === 'chart') {
                            <div
                                pcShipmentSchedule
                                [shipments]="shipments()"
                                [selectedShipmentIds]="selectedShipmentIds()"
                                (selectionChange)="shipmentSelectionChange.emit($event)"
                            ></div>
                        } @else {
                            <div
                                pcShipmentScheduleGrid
                                [shipments]="shipments()"
                                [selectedShipmentIds]="selectedShipmentIds()"
                                (selectionChange)="shipmentSelectionChange.emit($event)"
                            ></div>
                        }
                    } @else {
                        <div
                            pcEmptyState
                            message="Nothing in transit for these filters"
                            hint="Clear the supplier and subcategory filters to see all my lanes."
                        ></div>
                    }
                </div>
            </section>
        </div>

        <!-- Where this tab's own selections land — a shipment picked on the map or the schedule. -->
        <section class="pc-card">
            <div class="pc-card-head">
                <div>
                    <h2 class="pc-card-title">Purchase orders</h2>
                    <span class="pc-card-sub">{{ gridSubtitle() }}</span>
                </div>
                <div class="pc-chips">
                    @for (shipmentId of selectedShipmentIds(); track shipmentId) {
                        <span class="pc-chip">{{ shipmentId }}</span>
                    }
                    <button pcBtn (click)="clearSelection.emit()" [disabled]="!canClearSelection()"
                        >Clear selection</button
                    >
                </div>
            </div>
            <!-- With nothing selected the grid stays mounted and empty, showing its own prompt overlay. -->
            @if (selectedShipmentIds().length > 0 && orders().length === 0) {
                <div
                    pcEmptyState
                    [message]="
                        selectedShipmentIds().length === 1
                            ? 'No order lines on this shipment'
                            : 'No order lines on these shipments'
                    "
                    hint="Select another shipment."
                ></div>
            } @else {
                <div
                    pcPurchaseOrderGrid
                    [orders]="orders()"
                    [poActions]="poActions()"
                    (action)="poAction.emit($event)"
                ></div>
            }
        </section>
    `,
})
export class OrdersView {
    readonly kpis = input.required<Kpi[]>();
    readonly shipments = input.required<TrackedShipment[]>();
    readonly selectedShipmentIds = input.required<string[]>();
    readonly shipmentSelectionChange = output<ShipmentSelectionChange>();
    /** Her order lines on the selected shipments; empty until one is selected. */
    readonly orders = input.required<PurchaseOrder[]>();
    /** What the grid is showing, stated in the card's subtitle. */
    readonly gridSubtitle = input.required<string>();
    /** What she has already recorded against a line, by PO id. */
    readonly poActions = input.required<Record<string, PoActionKind>>();
    readonly poAction = output<PoAction>();
    readonly clearSelection = output<void>();
    readonly canClearSelection = input.required<boolean>();

    protected readonly scheduleViewOptions = SCHEDULE_VIEW_OPTIONS;
    protected readonly statusKeys = statusSegments();
    protected readonly scheduleView = signal<ScheduleView>('chart');

    constructor() {
        clickAway(this.canClearSelection, () => this.clearSelection.emit());
    }

    protected setScheduleView(value: string): void {
        this.scheduleView.set(value as ScheduleView);
    }
}
