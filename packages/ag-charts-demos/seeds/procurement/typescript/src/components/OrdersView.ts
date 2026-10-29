import { type View, h } from '../dom';
import type { Kpi, PoActionKind, PurchaseOrder, TrackedShipment } from '../types';
import { type ToggleOption, button, createToggleGroup, toggleIcon } from '../ui';
import { type DeliveryMap, createDeliveryMap } from './DeliveryMap';
import { emptyState } from './EmptyState';
import { createKpiStrip } from './KpiStrip';
import { type PurchaseOrderGrid, createPurchaseOrderGrid } from './PurchaseOrderGrid';
import { type ShipmentSchedule, createShipmentSchedule } from './ShipmentSchedule';
import { type ShipmentScheduleGrid, createShipmentScheduleGrid } from './ShipmentScheduleGrid';
import { statusKeys, statusSegments } from './StatusKeys';
import { createClickAway } from './useClickAway';

type ScheduleView = 'chart' | 'grid';

/** Icons are Carbon's `ChartBarFloating` and `DataTable` (Apache-2.0). Built per group, as an element has one parent. */
const scheduleViewOptions = (): (ToggleOption & { value: ScheduleView })[] => [
    {
        value: 'chart',
        label: 'Range bar',
        icon: toggleIcon(
            'M28,24H14V16H28ZM16,22H26V18H16Z',
            'M26,12H8V4H26ZM10,10H24V6H10Z',
            'M30,30H4a2.0023,2.0023,0,0,1-2-2V2H4V28H30Z'
        ),
    },
    {
        value: 'grid',
        label: 'Table',
        icon: toggleIcon(
            'M8 18H12V20H8z',
            'M14 18H18V20H14z',
            'M8 14H12V16H8z',
            'M14 22H18V24H14z',
            'M20 14H24V16H20z',
            'M20 22H24V24H20z',
            'M27,3H5A2.0025,2.0025,0,0,0,3,5V27a2.0025,2.0025,0,0,0,2,2H27a2.0025,2.0025,0,0,0,2-2V5A2.0025,2.0025,0,0,0,27,3Zm0,2,0,4H5V5ZM5,27V11H27l0,16Z'
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

type Callbacks = 'onShipmentSelectionChange' | 'onPoAction' | 'onClearSelection';

export interface OrdersView extends View {
    update(props: Omit<OrdersViewProps, Callbacks>): void;
}

const NOTHING_IN_TRANSIT = {
    message: 'Nothing in transit for these filters',
    hint: 'Clear the supplier and subcategory filters to see all my lanes.',
};

/**
 * Her order book: what needs deciding, how she is tracking, where her freight is, and the lines a
 * selected shipment holds.
 *
 * Leads with the worklist rather than a chart — a workspace opens on what its owner has to do,
 * where a dashboard opens on a summary of what happened.
 */
export function createOrdersView({
    onShipmentSelectionChange,
    onPoAction,
    onClearSelection,
    ...props
}: OrdersViewProps): OrdersView {
    let current = props;
    let mounted = false;
    // The view's own state, which a fresh view starts over: the React `useState`.
    let scheduleView: ScheduleView = 'chart';

    const clickAway = createClickAway(onClearSelection);

    const kpiStrip = createKpiStrip(current.kpis);

    // Each box holds the chart or grid while there is freight to draw, and the empty state otherwise.
    const mapBox = h('div', { class: 'pc-chart-box-md', 'data-keeps-selection': 'true' });
    let map: DeliveryMap | undefined;
    const scheduleBox = h('div', { class: 'pc-chart-box--grow', 'data-keeps-selection': 'true' });
    let schedule: ShipmentSchedule | ShipmentScheduleGrid | undefined;
    let shownScheduleView: ScheduleView | undefined;

    const viewAs = createToggleGroup({
        ariaLabel: 'View as: arrival schedule',
        label: 'View as',
        value: scheduleView,
        onValueChange: (value) => {
            scheduleView = value as ScheduleView;
            render();
        },
        options: scheduleViewOptions(),
    });

    const gridSubtitle = h('span', { class: 'pc-card-sub' }, current.gridSubtitle);
    const clearButton = button({ onclick: onClearSelection }, 'Clear selection');
    const chips = h('div', { class: 'pc-chips' }, clearButton);
    // Where this tab's own selections land — a shipment picked on the map or the schedule.
    const gridCard = h(
        'section',
        { class: 'pc-card' },
        h(
            'div',
            { class: 'pc-card-head' },
            h('div', {}, h('h2', { class: 'pc-card-title' }, 'Purchase orders'), gridSubtitle),
            chips
        )
    );
    let grid: PurchaseOrderGrid | undefined;
    let gridEmpty: HTMLElement | undefined;

    const el = h(
        'div',
        { class: 'pc-view-content' },
        // The headline and the map stack on the left; the schedule runs the full height beside them.
        h(
            'div',
            { class: 'pc-grid-2' },
            h(
                'div',
                { class: 'pc-stack' },
                kpiStrip.el,
                h(
                    'section',
                    { class: 'pc-card' },
                    h(
                        'div',
                        { class: 'pc-card-head' },
                        h('div', {}, h('h2', { class: 'pc-card-title' }, 'Orders in transit')),
                        statusKeys({ segments: statusSegments(), showCounts: false })
                    ),
                    mapBox
                )
            ),
            h(
                'section',
                { class: 'pc-card' },
                h(
                    'div',
                    { class: 'pc-card-head' },
                    h('div', {}, h('h2', { class: 'pc-card-title' }, 'Arrival schedule')),
                    viewAs.el
                ),
                scheduleBox
            )
        ),
        gridCard
    );

    /** The conditional renders: a chart or grid while it has data, the empty state otherwise. */
    function syncSlots() {
        const { shipments, selectedShipmentIds, orders, poActions } = current;

        if (shipments.length > 0) {
            if (!map) {
                map = createDeliveryMap({
                    shipments,
                    selectedShipmentIds,
                    onSelectionChange: onShipmentSelectionChange,
                });
                mapBox.replaceChildren(map.el);
                if (mounted) map.mount();
            } else {
                map.update({ shipments, selectedShipmentIds });
            }
        } else if (map || mapBox.childElementCount === 0) {
            map?.destroy();
            map = undefined;
            mapBox.replaceChildren(emptyState(NOTHING_IN_TRANSIT));
        }

        if (shipments.length > 0) {
            // The toggle swaps one component for the other, so the outgoing one unmounts.
            if (schedule && shownScheduleView !== scheduleView) {
                schedule.destroy();
                schedule = undefined;
            }
            if (!schedule) {
                const scheduleProps = { shipments, selectedShipmentIds, onSelectionChange: onShipmentSelectionChange };
                schedule =
                    scheduleView === 'chart'
                        ? createShipmentSchedule(scheduleProps)
                        : createShipmentScheduleGrid(scheduleProps);
                shownScheduleView = scheduleView;
                scheduleBox.replaceChildren(schedule.el);
                if (mounted) schedule.mount();
            } else {
                schedule.update({ shipments, selectedShipmentIds });
            }
        } else if (schedule || scheduleBox.childElementCount === 0) {
            schedule?.destroy();
            schedule = undefined;
            shownScheduleView = undefined;
            scheduleBox.replaceChildren(emptyState(NOTHING_IN_TRANSIT));
        }

        // With nothing selected the grid stays mounted and empty, showing its own prompt overlay.
        if (selectedShipmentIds.length > 0 && orders.length === 0) {
            if (grid) {
                grid.destroy();
                grid.el.remove();
                grid = undefined;
            }
            const next = emptyState({
                message:
                    selectedShipmentIds.length === 1
                        ? 'No order lines on this shipment'
                        : 'No order lines on these shipments',
                hint: 'Select another shipment.',
            });
            if (gridEmpty) gridEmpty.replaceWith(next);
            else gridCard.append(next);
            gridEmpty = next;
        } else {
            gridEmpty?.remove();
            gridEmpty = undefined;
            if (!grid) {
                grid = createPurchaseOrderGrid({ orders, poActions, onAction: onPoAction });
                gridCard.append(grid.el);
                if (mounted) grid.mount();
            } else {
                grid.update({ orders, poActions });
            }
        }
    }

    function render() {
        clickAway.setActive(current.canClearSelection);
        viewAs.setValue(scheduleView);
        kpiStrip.update(current.kpis);
        gridSubtitle.textContent = current.gridSubtitle;
        chips.replaceChildren(
            ...current.selectedShipmentIds.map((shipmentId) => h('span', { class: 'pc-chip' }, shipmentId)),
            clearButton
        );
        clearButton.toggleAttribute('disabled', !current.canClearSelection);
        syncSlots();
    }
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
            clickAway.destroy();
            kpiStrip.destroy();
            map?.destroy();
            schedule?.destroy();
            grid?.destroy();
        },
    };
}
