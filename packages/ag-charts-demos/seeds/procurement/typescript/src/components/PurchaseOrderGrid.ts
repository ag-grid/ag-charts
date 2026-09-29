import {
    type ColDef,
    type GridApi,
    type GridOptions,
    type ICellRendererParams,
    type ValueFormatterParams,
    createGrid,
} from 'ag-grid-community';

import { STATUS_ICONS } from '../chartTheme';
import { type View, h } from '../dom';
import { fmtCurrency, fmtDate, fmtInt, fmtPrice } from '../format';
import { DATE_FILTER_PARAMS, NUMBER_FILTER_PARAMS, baseColDef, gridTheme } from '../grid';
import { memo } from '../memo';
import type { PoActionKind, PoStatus, PurchaseOrder } from '../types';

/** Grid status ink and glyph. `Delivered` is terminal, so it is chrome, not a warning. */
const STATUS_STYLE: Record<PoStatus, { className: string; icon: string }> = {
    'On time': { className: 'is-ok', icon: STATUS_ICONS['On time'] },
    'At risk': { className: 'is-warn', icon: STATUS_ICONS['At risk'] },
    Late: { className: 'is-bad', icon: STATUS_ICONS['Late'] },
    Delivered: { className: 'is-done', icon: '✓' },
};

/**
 * Status cell: glyph plus text, so the state survives without colour. The accessibility
 * requirement is that this grid and the scorecard are the accessible table equivalents of
 * the sunburst and scatter, so it has to be legible on its own terms.
 */
function statusCell({ value }: ICellRendererParams<PurchaseOrder, PoStatus>): HTMLElement {
    const style = STATUS_STYLE[value!];
    return h(
        'span',
        { class: `pc-status-cell ${style.className}` },
        h('span', { 'aria-hidden': 'true' }, style.icon),
        h('span', { class: 'pc-status-cell-text' }, value)
    );
}

const dateFormatter = ({ value }: ValueFormatterParams<PurchaseOrder, number | null>) =>
    value == null ? '—' : fmtDate(value);

/** The decisions she can record against a line, in escalating order. */
const PO_ACTIONS: { kind: PoActionKind; label: string }[] = [
    { kind: 'Resolved', label: 'Resolve' },
    { kind: 'Reassigned', label: 'Reassign' },
    { kind: 'Escalated', label: 'Escalate' },
];

interface PurchaseOrderGridProps {
    orders: PurchaseOrder[];
    /** What she has already recorded against a line, by PO id. */
    poActions: Record<string, PoActionKind>;
    onAction: (poId: string, kind: PoActionKind) => void;
}

export interface PurchaseOrderGrid extends View {
    update(props: Omit<PurchaseOrderGridProps, 'onAction'>): void;
}

export function createPurchaseOrderGrid({ onAction, ...props }: PurchaseOrderGridProps): PurchaseOrderGrid {
    // `createGrid` inserts its own full-height div into this element and themes that, which is the
    // div ag-grid-react renders, so the class-named element is handed over as is.
    const el = h('div', { class: 'pc-grid-host' });
    const defaultColDef = baseColDef<PurchaseOrder>();

    const columnDefs = memo((poActions: Record<string, PoActionKind>): ColDef<PurchaseOrder>[] => [
        { field: 'poId', headerName: 'PO #', minWidth: 120, filter: 'agTextColumnFilter', sort: 'desc' },
        { field: 'supplierName', headerName: 'Supplier', minWidth: 150, filter: 'agSetColumnFilter' },
        { field: 'material', headerName: 'Material', minWidth: 150, filter: 'agSetColumnFilter' },
        {
            field: 'quantity',
            headerName: 'Quantity',
            minWidth: 120,
            type: 'rightAligned',
            // Unfilterable: quantity is only comparable within one unit of measure, and the grid mixes them.
            filter: false,
            valueFormatter: ({ value, data }) => (value == null ? '' : `${fmtInt(value)} ${data?.unit ?? ''}`),
        },
        {
            field: 'unitCost',
            headerName: 'Unit cost',
            minWidth: 110,
            type: 'rightAligned',
            filter: 'agNumberColumnFilter',
            filterParams: NUMBER_FILTER_PARAMS,
            valueFormatter: ({ value }) => (value == null ? '' : fmtPrice(value)),
        },
        {
            field: 'totalCost',
            headerName: 'Cost',
            minWidth: 120,
            type: 'rightAligned',
            filter: 'agNumberColumnFilter',
            filterParams: NUMBER_FILTER_PARAMS,
            valueFormatter: ({ value }) => (value == null ? '' : fmtCurrency(value)),
        },
        {
            field: 'orderDate',
            headerName: 'Order date',
            minWidth: 130,
            filter: 'agDateColumnFilter',
            filterParams: DATE_FILTER_PARAMS,
            // The filter compares Dates, so the epoch value has to be lifted to one.
            filterValueGetter: ({ data }) => (data ? new Date(data.orderDate) : null),
            valueFormatter: dateFormatter,
        },
        {
            field: 'expectedDate',
            headerName: 'Expected delivery',
            minWidth: 150,
            filter: 'agDateColumnFilter',
            filterParams: DATE_FILTER_PARAMS,
            filterValueGetter: ({ data }) => (data ? new Date(data.expectedDate) : null),
            valueFormatter: dateFormatter,
        },
        {
            field: 'status',
            headerName: 'Status',
            minWidth: 130,
            filter: 'agSetColumnFilter',
            cellRenderer: statusCell,
        },
        {
            colId: 'action',
            headerName: 'Action',
            minWidth: 180,
            maxWidth: 200,
            // Pinned: the other columns overflow a laptop viewport, and an action she must scroll to reach is not taken.
            pinned: 'right',
            // A control column, so nothing to sort or filter on.
            sortable: false,
            filter: false,
            resizable: false,
            cellRenderer: ({ data }: ICellRendererParams<PurchaseOrder>) => {
                if (!data) return '';
                const recorded = poActions[data.poId];
                // Once a decision is recorded the line states it rather than offering the same buttons again.
                if (recorded) {
                    return h(
                        'span',
                        { class: 'pc-po-action-done' },
                        h('span', { 'aria-hidden': 'true' }, '✓'),
                        ` ${recorded}`
                    );
                }
                return h(
                    'span',
                    { class: 'pc-po-actions' },
                    ...PO_ACTIONS.map((action) =>
                        h(
                            'button',
                            { type: 'button', class: 'pc-link-btn', onclick: () => onAction(data.poId, action.kind) },
                            action.label
                        )
                    )
                );
            },
        },
    ]);

    let { orders, poActions } = props;
    let api: GridApi<PurchaseOrder> | undefined;

    return {
        el,
        mount() {
            api = createGrid<PurchaseOrder>(el, {
                theme: gridTheme,
                rowData: orders,
                columnDefs: columnDefs(poActions),
                defaultColDef,
                rowHeight: 36,
                headerHeight: 38,
                domLayout: 'autoHeight',
                pagination: true,
                paginationPageSize: 12,
                paginationPageSizeSelector: [12, 25, 50, 100],
            });
        },
        update(next) {
            // The props that changed, applied together as ag-grid-react applies a render's changes.
            const changes: GridOptions<PurchaseOrder> = {};
            if (next.orders !== orders) changes.rowData = next.orders;
            if (next.poActions !== poActions) changes.columnDefs = columnDefs(next.poActions);
            ({ orders, poActions } = next);
            if (api && Object.keys(changes).length > 0) api.updateGridOptions(changes);
        },
        destroy() {
            api?.destroy();
            api = undefined;
        },
    };
}
