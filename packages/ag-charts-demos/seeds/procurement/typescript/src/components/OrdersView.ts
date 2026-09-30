import { type View, h } from '../dom';
import type { Kpi, PoActionKind, PurchaseOrder, TrackedShipment } from '../types';
import { button } from '../ui';
import { type DeliveryMap, createDeliveryMap } from './DeliveryMap';
import { emptyState } from './EmptyState';
import { createKpiStrip } from './KpiStrip';
import { type PurchaseOrderGrid, createPurchaseOrderGrid } from './PurchaseOrderGrid';
import { type ShipmentSchedule, createShipmentSchedule } from './ShipmentSchedule';
import { statusLegend } from './StatusLegend';

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

export interface OrdersView extends View {
    update(props: Omit<OrdersViewProps, 'onSelectShipment' | 'onPoAction' | 'onClearSelection'>): void;
}

/**
 * Her order book: what needs deciding, how she is tracking, where her freight is, and the lines a
 * selected shipment holds.
 *
 * Leads with the worklist rather than a chart — a workspace opens on what its owner has to do,
 * where a dashboard opens on a summary of what happened.
 */
export function createOrdersView({
    onSelectShipment,
    onPoAction,
    onClearSelection,
    ...props
}: OrdersViewProps): OrdersView {
    let current = props;
    let mounted = false;

    const kpiStrip = createKpiStrip(current.kpis);

    // Each chart box holds the chart while there is freight to draw, and the empty state otherwise.
    const mapBox = h('div', { class: 'pc-chart-box-md' });
    const scheduleBox = h('div', { class: 'pc-chart-box-md' });
    let map: DeliveryMap | undefined;
    let schedule: ShipmentSchedule | undefined;

    const gridSubtitle = h('span', { class: 'pc-card-sub' }, current.gridSubtitle);
    const chips = h('div', { class: 'pc-chips' });
    let chip: HTMLSpanElement | undefined;
    const clearButton = button({ onclick: onClearSelection }, 'Clear selection');
    // Where this tab's own selections land — a shipment picked on the map or the schedule.
    const gridCard = h(
        'section',
        { class: 'pc-card' },
        h(
            'div',
            { class: 'pc-card-head' },
            h('div', {}, h('h2', { class: 'pc-card-title' }, 'My purchase orders'), gridSubtitle),
            chips
        )
    );
    let grid: PurchaseOrderGrid | undefined;
    let gridEmpty: HTMLElement | undefined;

    const el = h(
        'div',
        { class: 'pc-view-content' },
        kpiStrip.el,
        h(
            'div',
            { class: 'pc-grid-2' },
            h(
                'section',
                { class: 'pc-card' },
                h(
                    'div',
                    { class: 'pc-card-head' },
                    h(
                        'div',
                        {},
                        h('h2', { class: 'pc-card-title' }, 'My suppliers — in transit'),
                        h('span', { class: 'pc-card-sub' }, 'Select a marker to filter the orders.')
                    ),
                    statusLegend()
                ),
                mapBox
            ),
            h(
                'section',
                { class: 'pc-card' },
                h(
                    'div',
                    { class: 'pc-card-head' },
                    h(
                        'div',
                        {},
                        h('h2', { class: 'pc-card-title' }, 'Arrival schedule'),
                        h('span', { class: 'pc-card-sub' }, 'Select a bar to filter the orders.')
                    )
                ),
                scheduleBox
            )
        ),
        gridCard
    );

    /** The conditional renders: a chart or grid while it has data, the empty state otherwise. */
    function syncSlots() {
        const { shipments, selectedShipmentId, orders, poActions } = current;

        if (shipments.length > 0) {
            if (!map) {
                map = createDeliveryMap({ shipments, selectedShipmentId, onShipmentClick: onSelectShipment });
                mapBox.replaceChildren(map.el);
                if (mounted) map.mount();
            } else {
                map.update({ shipments, selectedShipmentId });
            }
        } else if (map || mapBox.childElementCount === 0) {
            map?.destroy();
            map = undefined;
            mapBox.replaceChildren(
                emptyState({
                    message: 'Nothing in transit for this supplier',
                    hint: 'Clear the supplier selection to see all my lanes.',
                })
            );
        }

        if (shipments.length > 0) {
            if (!schedule) {
                schedule = createShipmentSchedule({ shipments, selectedShipmentId, onSelect: onSelectShipment });
                scheduleBox.replaceChildren(schedule.el);
                if (mounted) schedule.mount();
            } else {
                schedule.update({ shipments, selectedShipmentId });
            }
        } else if (schedule || scheduleBox.childElementCount === 0) {
            schedule?.destroy();
            schedule = undefined;
            scheduleBox.replaceChildren(
                emptyState({ message: 'Nothing in transit', hint: 'Clear the supplier selection to see all my lanes.' })
            );
        }

        if (orders.length > 0) {
            gridEmpty?.remove();
            gridEmpty = undefined;
            if (!grid) {
                grid = createPurchaseOrderGrid({ orders, poActions, onAction: onPoAction });
                gridCard.append(grid.el);
                if (mounted) grid.mount();
            } else {
                grid.update({ orders, poActions });
            }
        } else if (grid || !gridEmpty) {
            grid?.destroy();
            grid?.el.remove();
            grid = undefined;
            gridEmpty = emptyState({
                message: 'No orders match this selection',
                hint: 'Clear the selection, or widen the period.',
            });
            gridCard.append(gridEmpty);
        }
    }

    function render() {
        kpiStrip.update(current.kpis);
        gridSubtitle.textContent = current.gridSubtitle;
        if (current.selectedShipmentId != null) {
            if (!chip) {
                chip = h('span', { class: 'pc-chip' });
                chips.prepend(chip);
            }
            chip.textContent = current.selectedShipmentId;
        } else if (chip) {
            chip.remove();
            chip = undefined;
        }
        clearButton.toggleAttribute('disabled', !current.canClearSelection);
        syncSlots();
    }
    chips.append(clearButton);
    render();

    return {
        el,
        mount() {
            mounted = true;
            kpiStrip.mount();
            map?.mount();
            schedule?.mount();
            grid?.mount();
        },
        update(next) {
            current = next;
            render();
        },
        destroy() {
            kpiStrip.destroy();
            map?.destroy();
            schedule?.destroy();
            grid?.destroy();
        },
    };
}
