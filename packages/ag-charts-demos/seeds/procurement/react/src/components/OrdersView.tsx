import type { Kpi, PoActionKind, PurchaseOrder, TrackedShipment } from '../types';
import { Button } from '../ui';
import { DeliveryMap } from './DeliveryMap';
import { EmptyState } from './EmptyState';
import { KpiStrip } from './KpiStrip';
import { PurchaseOrderGrid } from './PurchaseOrderGrid';
import { ShipmentSchedule } from './ShipmentSchedule';
import { StatusKeys, statusSegments } from './StatusKeys';
import { useClickAway } from './useClickAway';

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
                    </div>
                    <div className="pc-chart-box--grow" data-keeps-selection>
                        {shipments.length > 0 ? (
                            <ShipmentSchedule
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
