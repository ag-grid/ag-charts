import type { ColDef, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useMemo } from 'react';

import { STATUS_ICONS } from '../chartTheme';
import { fmtCurrency, fmtDate, fmtInt, fmtPrice } from '../format';
import { DATE_FILTER_PARAMS, NUMBER_FILTER_PARAMS, baseColDef, gridTheme } from '../grid';
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
function StatusCell({ value }: { value: PoStatus }) {
    const style = STATUS_STYLE[value];
    return (
        <span className={`pc-status-cell ${style.className}`}>
            <span aria-hidden="true">{style.icon}</span>
            <span className="pc-status-cell-text">{value}</span>
        </span>
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

export function PurchaseOrderGrid({ orders, poActions, onAction }: PurchaseOrderGridProps) {
    const defaultColDef = useMemo(() => baseColDef<PurchaseOrder>(), []);

    const columnDefs = useMemo<ColDef<PurchaseOrder>[]>(
        () => [
            { field: 'poId', headerName: 'PO #', minWidth: 120, filter: 'agTextColumnFilter', sort: 'desc' },
            { field: 'supplierName', headerName: 'Supplier', minWidth: 150, filter: 'agSetColumnFilter' },
            { field: 'material', headerName: 'Material', minWidth: 150, filter: 'agSetColumnFilter' },
            {
                field: 'quantity',
                headerName: 'Quantity',
                minWidth: 120,
                type: 'rightAligned',
                // Specified as unfilterable: quantity is only comparable within one unit
                // of measure, and the grid mixes them.
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
                cellRenderer: StatusCell,
            },
            {
                colId: 'action',
                headerName: 'Action',
                minWidth: 180,
                maxWidth: 200,
                // Pinned so it survives horizontal scrolling. The other nine columns overflow a
                // laptop-width viewport, and an action she has to scroll sideways to reach is an
                // action she will not take.
                pinned: 'right',
                // A control column, so nothing to sort or filter on.
                sortable: false,
                filter: false,
                resizable: false,
                cellRenderer: ({ data }: ICellRendererParams<PurchaseOrder>) => {
                    if (!data) return null;
                    const recorded = poActions[data.poId];
                    // Once a decision is recorded the line states it, rather than offering the
                    // same three buttons again as though nothing had happened.
                    if (recorded) {
                        return (
                            <span className="pc-po-action-done">
                                <span aria-hidden="true">✓</span> {recorded}
                            </span>
                        );
                    }
                    return (
                        <span className="pc-po-actions">
                            {PO_ACTIONS.map((action) => (
                                <button
                                    key={action.kind}
                                    type="button"
                                    className="pc-link-btn"
                                    onClick={() => onAction(data.poId, action.kind)}
                                >
                                    {action.label}
                                </button>
                            ))}
                        </span>
                    );
                },
            },
        ],
        [poActions, onAction]
    );

    return (
        <div className="pc-grid-host">
            <AgGridReact<PurchaseOrder>
                theme={gridTheme}
                rowData={orders}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                rowHeight={36}
                headerHeight={38}
                domLayout="autoHeight"
                pagination
                paginationPageSize={12}
                paginationPageSizeSelector={[12, 25, 50, 100]}
            />
        </div>
    );
}
