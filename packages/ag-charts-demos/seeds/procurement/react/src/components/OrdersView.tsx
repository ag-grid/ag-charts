import { useState } from 'react';

import type { Kpi, PoActionKind, PurchaseOrder, TrackedShipment } from '../types';
import { Button, ToggleGroup, ToggleIcon, type ToggleOption } from '../ui';
import { DeliveryMap } from './DeliveryMap';
import { EmptyState } from './EmptyState';
import { KpiStrip } from './KpiStrip';
import { PurchaseOrderGrid } from './PurchaseOrderGrid';
import { ShipmentSchedule } from './ShipmentSchedule';
import { ShipmentScheduleGrid } from './ShipmentScheduleGrid';
import { StatusKeys, statusSegments } from './StatusKeys';
import { useClickAway } from './useClickAway';

type ScheduleView = 'chart' | 'grid';

/** Icons are Carbon's `ChartBarFloating` and `DataTable` (Apache-2.0). */
const SCHEDULE_VIEW_OPTIONS: (ToggleOption & { value: ScheduleView })[] = [
    {
        value: 'chart',
        label: 'Range bar',
        icon: (
            <ToggleIcon>
                <path d="M28,24H14V16H28ZM16,22H26V18H16Z" />
                <path d="M26,12H8V4H26ZM10,10H24V6H10Z" />
                <path d="M30,30H4a2.0023,2.0023,0,0,1-2-2V2H4V28H30Z" />
            </ToggleIcon>
        ),
    },
    {
        value: 'grid',
        label: 'Table',
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

interface OrdersViewProps {
    kpis: Kpi[];
    shipments: TrackedShipment[];
    selectedShipmentIds: string[];
    onShipmentSelectionChange: (added: string[], removed: string[]) => void;
    /** Her order lines on the selected shipments; empty until one is selected. */
    orders: PurchaseOrder[];
    /** What the grid is showing, stated in the card's subtitle. */
    gridSubtitle: string;
    /** What she has already recorded against a line, by PO id. */
    poActions: Record<string, PoActionKind>;
    onPoAction: (poId: string, kind: PoActionKind) => void;
    onClearSelection: () => void;
    canClearSelection: boolean;
}

/**
 * Her order book: what needs deciding, how she is tracking, where her freight is, and the lines a
 * selected shipment holds.
 *
 * Leads with the worklist rather than a chart — a workspace opens on what its owner has to do,
 * where a dashboard opens on a summary of what happened.
 */
export function OrdersView({
    kpis,
    shipments,
    selectedShipmentIds,
    onShipmentSelectionChange,
    orders,
    gridSubtitle,
    poActions,
    onPoAction,
    onClearSelection,
    canClearSelection,
}: OrdersViewProps) {
    useClickAway(canClearSelection, onClearSelection);
    const [scheduleView, setScheduleView] = useState<ScheduleView>('chart');
    const schedule =
        scheduleView === 'chart' ? (
            <ShipmentSchedule
                shipments={shipments}
                selectedShipmentIds={selectedShipmentIds}
                onSelectionChange={onShipmentSelectionChange}
            />
        ) : (
            <ShipmentScheduleGrid
                shipments={shipments}
                selectedShipmentIds={selectedShipmentIds}
                onSelectionChange={onShipmentSelectionChange}
            />
        );

    return (
        <div className="pc-view-content">
            {/* The headline and the map stack on the left; the schedule runs the full height beside them. */}
            <div className="pc-grid-2">
                <div className="pc-stack">
                    <KpiStrip kpis={kpis} />

                    <section className="pc-card">
                        <div className="pc-card-head">
                            <div>
                                <h2 className="pc-card-title">Orders in transit</h2>
                            </div>
                            <StatusKeys segments={statusSegments()} showCounts={false} />
                        </div>
                        <div className="pc-chart-box-md" data-keeps-selection>
                            {shipments.length > 0 ? (
                                <DeliveryMap
                                    shipments={shipments}
                                    selectedShipmentIds={selectedShipmentIds}
                                    onSelectionChange={onShipmentSelectionChange}
                                />
                            ) : (
                                <EmptyState
                                    message="Nothing in transit for these filters"
                                    hint="Clear the supplier and subcategory filters to see all my lanes."
                                />
                            )}
                        </div>
                    </section>
                </div>

                <section className="pc-card">
                    <div className="pc-card-head">
                        <div>
                            <h2 className="pc-card-title">Arrival schedule</h2>
                        </div>
                        <ToggleGroup
                            ariaLabel="View as: arrival schedule"
                            label="View as"
                            value={scheduleView}
                            onValueChange={(value) => setScheduleView(value as ScheduleView)}
                            options={SCHEDULE_VIEW_OPTIONS}
                        />
                    </div>
                    <div className="pc-chart-box--grow" data-keeps-selection>
                        {shipments.length > 0 ? (
                            schedule
                        ) : (
                            <EmptyState
                                message="Nothing in transit for these filters"
                                hint="Clear the supplier and subcategory filters to see all my lanes."
                            />
                        )}
                    </div>
                </section>
            </div>

            {/* Where this tab's own selections land — a shipment picked on the map or the schedule. */}
            <section className="pc-card">
                <div className="pc-card-head">
                    <div>
                        <h2 className="pc-card-title">Purchase orders</h2>
                        <span className="pc-card-sub">{gridSubtitle}</span>
                    </div>
                    <div className="pc-chips">
                        {selectedShipmentIds.map((shipmentId) => (
                            <span key={shipmentId} className="pc-chip">
                                {shipmentId}
                            </span>
                        ))}
                        <Button onClick={onClearSelection} disabled={!canClearSelection}>
                            Clear selection
                        </Button>
                    </div>
                </div>
                {/* With nothing selected the grid stays mounted and empty, showing its own prompt overlay. */}
                {selectedShipmentIds.length > 0 && orders.length === 0 ? (
                    <EmptyState
                        message={
                            selectedShipmentIds.length === 1
                                ? 'No order lines on this shipment'
                                : 'No order lines on these shipments'
                        }
                        hint="Select another shipment."
                    />
                ) : (
                    <PurchaseOrderGrid orders={orders} poActions={poActions} onAction={onPoAction} />
                )}
            </section>
        </div>
    );
}
