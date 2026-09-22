import { Component, computed, input, output, signal } from '@angular/core';
import { AgGridAngular, type ICellRendererAngularComp } from 'ag-grid-angular';
import type { ColDef, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';

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
 *
 * The host is the React renderer's root `span.pc-status-cell`.
 */
@Component({
    selector: 'span[pcStatusCell]',
    host: { '[class]': "'pc-status-cell ' + style().className" },
    template:
        '<span aria-hidden="true">{{ style().icon }}</span><span class="pc-status-cell-text">{{ value() }}</span>',
})
export class StatusCell implements ICellRendererAngularComp {
    protected readonly value = signal<PoStatus>('On time');
    protected readonly style = computed(() => STATUS_STYLE[this.value()]);

    agInit({ value }: ICellRendererParams<PurchaseOrder, PoStatus>): void {
        if (value != null) this.value.set(value);
    }

    refresh({ value }: ICellRendererParams<PurchaseOrder, PoStatus>): boolean {
        if (value != null) this.value.set(value);
        return true;
    }
}

const dateFormatter = ({ value }: ValueFormatterParams<PurchaseOrder, number | null>) =>
    value == null ? '—' : fmtDate(value);

/** The decisions she can record against a line, in escalating order. */
const PO_ACTIONS: { kind: PoActionKind; label: string }[] = [
    { kind: 'Resolved', label: 'Resolve' },
    { kind: 'Reassigned', label: 'Reassign' },
    { kind: 'Escalated', label: 'Escalate' },
];

/** A decision recorded against a line: the React `onAction(poId, kind)` pair, as one output payload. */
export interface PoAction {
    poId: string;
    kind: PoActionKind;
}

/** What the action column's renderer reads from the grid, as the React renderer read it from its closure. */
interface PoActionCellParams {
    poActions: Record<string, PoActionKind>;
    onAction: (poId: string, kind: PoActionKind) => void;
}

/**
 * The action column: the decisions she can record against a line, or the one she already has.
 * The React renderer returns a different root for each state (`span.pc-po-action-done` or
 * `span.pc-po-actions`); the host is that span, with the class bound to the state.
 */
@Component({
    selector: 'span[pcPoActionCell]',
    host: { '[class]': "recorded() ? 'pc-po-action-done' : 'pc-po-actions'" },
    template: `
        @if (recorded(); as recorded) {
            <span aria-hidden="true">✓</span> {{ recorded }}
        } @else {
            @for (action of actions; track action.kind) {
                <button type="button" class="pc-link-btn" (click)="onAction(action.kind)">{{ action.label }}</button>
            }
        }
    `,
})
export class PoActionCell implements ICellRendererAngularComp {
    protected readonly actions = PO_ACTIONS;
    protected readonly recorded = signal<PoActionKind | undefined>(undefined);

    private poId?: string;
    private params?: PoActionCellParams;

    agInit(params: ICellRendererParams<PurchaseOrder> & PoActionCellParams): void {
        this.update(params);
    }

    // The React renderer is an arrow created inside the column memo, so a new column definition
    // remounts it; declining the refresh has the grid recreate this one the same way.
    refresh(): boolean {
        return false;
    }

    protected onAction(kind: PoActionKind): void {
        if (this.poId != null) this.params?.onAction(this.poId, kind);
    }

    private update(params: ICellRendererParams<PurchaseOrder> & PoActionCellParams): void {
        this.params = params;
        this.poId = params.data?.poId;
        // Once a decision is recorded the line states it rather than offering the same buttons again.
        this.recorded.set(this.poId == null ? undefined : params.poActions[this.poId]);
    }
}

/** The host is the React root `.pc-grid-host`. */
@Component({
    selector: 'div[pcPurchaseOrderGrid]',
    imports: [AgGridAngular],
    host: { class: 'pc-grid-host' },
    template: `
        <ag-grid-angular
            style="display: block; height: 100%;"
            [theme]="gridTheme"
            [rowData]="orders()"
            [columnDefs]="columnDefs()"
            [defaultColDef]="defaultColDef"
            [rowHeight]="36"
            [headerHeight]="38"
            domLayout="autoHeight"
            [pagination]="true"
            [paginationPageSize]="12"
            [paginationPageSizeSelector]="pageSizes"
        />
    `,
})
export class PurchaseOrderGrid {
    readonly orders = input.required<PurchaseOrder[]>();
    /** What she has already recorded against a line, by PO id. */
    readonly poActions = input.required<Record<string, PoActionKind>>();
    readonly action = output<PoAction>();

    protected readonly gridTheme = gridTheme;
    protected readonly pageSizes = [12, 25, 50, 100];
    protected readonly defaultColDef = baseColDef<PurchaseOrder>();

    // Rebuilt when the recorded actions change, as the React `useMemo` is, so the action column re-renders.
    protected readonly columnDefs = computed<ColDef<PurchaseOrder>[]>(() => {
        const params: PoActionCellParams = {
            poActions: this.poActions(),
            onAction: (poId, kind) => this.action.emit({ poId, kind }),
        };
        return [
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
                cellRenderer: StatusCell,
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
                cellRenderer: PoActionCell,
                cellRendererParams: params,
            },
        ];
    });
}
