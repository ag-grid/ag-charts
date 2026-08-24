import type { Kpi, PoActionKind, PurchaseOrder, TrackedShipment } from '../types';
import { Button } from '../ui';
import { DeliveryMap } from './DeliveryMap';
import { EmptyState } from './EmptyState';
import { KpiStrip } from './KpiStrip';
import { PurchaseOrderGrid } from './PurchaseOrderGrid';
import { ShipmentSchedule } from './ShipmentSchedule';
import { StatusLegend } from './StatusLegend';

interface OrdersViewProps {
    kpis: Kpi[];
    shipments: TrackedShipment[];
    selectedShipmentId?: string;
    onSelectShipment: (shipmentId: string) => void;
    /** Her order lines under the current selection — the landing point for every selection. */
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
    selectedShipmentId,
    onSelectShipment,
    orders,
    gridSubtitle,
    poActions,
    onPoAction,
    onClearSelection,
    canClearSelection,
}: OrdersViewProps) {
    return (
        <div className="pc-view-content">
            <KpiStrip kpis={kpis} />

            <div className="pc-grid-2">
                <section className="pc-card">
                    <div className="pc-card-head">
                        <div>
                            <h2 className="pc-card-title">My suppliers — in transit</h2>
                            <span className="pc-card-sub">Select a marker to filter the orders.</span>
                        </div>
                        <StatusLegend />
                    </div>
                    <div className="pc-chart-box-md">
                        {shipments.length > 0 ? (
                            <DeliveryMap
                                shipments={shipments}
                                selectedShipmentId={selectedShipmentId}
                                onShipmentClick={onSelectShipment}
                            />
                        ) : (
                            <EmptyState
                                message="Nothing in transit for this supplier"
                                hint="Clear the supplier selection to see all my lanes."
                            />
                        )}
                    </div>
                </section>

                <section className="pc-card">
                    <div className="pc-card-head">
                        <div>
                            <h2 className="pc-card-title">Arrival schedule</h2>
                            <span className="pc-card-sub">Select a bar to filter the orders.</span>
                        </div>
                    </div>
                    <div className="pc-chart-box-md">
                        {shipments.length > 0 ? (
                            <ShipmentSchedule
                                shipments={shipments}
                                selectedShipmentId={selectedShipmentId}
                                onSelect={onSelectShipment}
                            />
                        ) : (
                            <EmptyState
                                message="Nothing in transit"
                                hint="Clear the supplier selection to see all my lanes."
                            />
                        )}
                    </div>
                </section>
            </div>

            {/* Where this tab's own selections land — a shipment picked on the map or the schedule. */}
            <section className="pc-card">
                <div className="pc-card-head">
                    <div>
                        <h2 className="pc-card-title">My purchase orders</h2>
                        <span className="pc-card-sub">{gridSubtitle}</span>
                    </div>
                    <div className="pc-chips">
                        {selectedShipmentId != null && <span className="pc-chip">{selectedShipmentId}</span>}
                        <Button onClick={onClearSelection} disabled={!canClearSelection}>
                            Clear selection
                        </Button>
                    </div>
                </div>
                {orders.length > 0 ? (
                    <PurchaseOrderGrid orders={orders} poActions={poActions} onAction={onPoAction} />
                ) : (
                    <EmptyState
                        message="No orders match this selection"
                        hint="Clear the selection, or widen the period."
                    />
                )}
            </section>
        </div>
    );
}
