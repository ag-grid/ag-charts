import { Component, afterRenderEffect, input, output, signal } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import type {
    ColDef,
    GetRowIdParams,
    GridApi,
    GridReadyEvent,
    IRowNode,
    RowSelectionOptions,
    SelectionChangedEvent,
    ValueFormatterParams,
} from 'ag-grid-community';

import { fmtCurrencyCompact, fmtDate } from '../format';
import { baseColDef, compactGridTheme } from '../grid';
import type { TrackedShipment } from '../types';
import { StatusCell } from './purchase-order-grid';
import type { ShipmentSelectionChange } from './shipment-selection';

const dateFormatter = ({ value }: ValueFormatterParams<TrackedShipment, number>) =>
    value == null ? '' : fmtDate(value);

/** Brings the grid's row selection into line with the shared shipment selection. */
function mirrorSelection(api: GridApi<TrackedShipment>, selectedShipmentIds: string[]) {
    const selected = new Set(selectedShipmentIds);
    const toSelect: IRowNode<TrackedShipment>[] = [];
    const toDeselect: IRowNode<TrackedShipment>[] = [];
    api.forEachNode((node) => {
        const wanted = node.data != null && selected.has(node.data.shipmentId);
        if (wanted && !node.isSelected()) toSelect.push(node);
        if (!wanted && node.isSelected()) toDeselect.push(node);
    });
    if (toSelect.length > 0) api.setNodesSelected({ nodes: toSelect, newValue: true, source: 'api' });
    if (toDeselect.length > 0) api.setNodesSelected({ nodes: toDeselect, newValue: false, source: 'api' });
}

const COLUMN_DEFS: ColDef<TrackedShipment>[] = [
    { field: 'shipmentId', headerName: 'Shipment', maxWidth: 80, pinned: 'left' },
    {
        field: 'status',
        headerName: 'Status',
        maxWidth: 80,
        pinned: 'left',
        cellClass: 'pc-cell-centred',
        cellRenderer: StatusCell,
    },
    {
        colId: 'lane',
        headerName: 'Lane',
        minWidth: 200,
        flex: 2,
        valueGetter: ({ data }) => (data == null ? '' : `${data.supplierName} → ${data.plantName}`),
    },
    { field: 'material', headerName: 'Cargo', minWidth: 120 },
    {
        field: 'value',
        headerName: 'Value',
        minWidth: 90,
        type: 'rightAligned',
        valueFormatter: ({ value }) => (value == null ? '' : fmtCurrencyCompact(value)),
    },
    { field: 'departDate', headerName: 'Dispatched', minWidth: 110, valueFormatter: dateFormatter },
    {
        field: 'projectedDate',
        headerName: 'Projected arrival',
        minWidth: 130,
        valueFormatter: dateFormatter,
    },
    {
        field: 'requiredDate',
        headerName: 'Required by',
        minWidth: 110,
        sort: 'asc',
        valueFormatter: dateFormatter,
    },
];

// Click selects one shipment, Ctrl/Cmd-click adds or removes one — as on the schedule.
const ROW_SELECTION: RowSelectionOptions<TrackedShipment> = {
    mode: 'multiRow',
    checkboxes: false,
    headerCheckbox: false,
    enableClickSelection: true,
};

/**
 * The arrival schedule's tabular twin: one row per shipment with the figures the schedule's bars
 * and tooltips carry, soonest required first as the schedule's axis is. Selecting a row selects its
 * shipment, exactly as clicking its bar does.
 *
 * The host is the React root `.pc-grid-host`.
 */
@Component({
    selector: 'div[pcShipmentScheduleGrid]',
    imports: [AgGridAngular],
    host: { class: 'pc-grid-host pc-grid-host--fill' },
    template: `
        <ag-grid-angular
            style="display: block; height: 100%;"
            [theme]="compactGridTheme"
            [rowData]="shipments()"
            [columnDefs]="columnDefs"
            [defaultColDef]="defaultColDef"
            [getRowId]="getRowId"
            [rowSelection]="rowSelection"
            (gridReady)="onGridReady($event)"
            (selectionChanged)="onSelectionChanged($event)"
            [rowHeight]="36"
            [headerHeight]="38"
        />
    `,
})
export class ShipmentScheduleGrid {
    readonly shipments = input.required<TrackedShipment[]>();
    /** The shipments currently selected; empty when none is. */
    readonly selectedShipmentIds = input.required<string[]>();
    /** The user changed the selection on the grid. */
    readonly selectionChange = output<ShipmentSelectionChange>();

    protected readonly compactGridTheme = compactGridTheme;
    protected readonly columnDefs = COLUMN_DEFS;
    protected readonly defaultColDef: ColDef<TrackedShipment> = { ...baseColDef<TrackedShipment>(), filter: false };
    protected readonly rowSelection = ROW_SELECTION;
    protected readonly getRowId = ({ data }: GetRowIdParams<TrackedShipment>) => data.shipmentId;

    private readonly api = signal<GridApi<TrackedShipment> | undefined>(undefined);

    constructor() {
        // After render, as the React effect runs after the grid has taken the new row data.
        afterRenderEffect(() => {
            const api = this.api();
            const selectedShipmentIds = this.selectedShipmentIds();
            this.shipments();
            if (api != null) mirrorSelection(api, selectedShipmentIds);
        });
    }

    protected onGridReady({ api }: GridReadyEvent<TrackedShipment>): void {
        mirrorSelection(api, this.selectedShipmentIds());
        this.api.set(api);
    }

    protected onSelectionChanged({ api, source }: SelectionChangedEvent<TrackedShipment>): void {
        // Our own mirroring echoes back as an api change; reacting to it would loop.
        if (source.startsWith('api') || source === 'rowDataChanged' || source === 'gridInitializing') return;
        const now = new Set(api.getSelectedRows().map((row) => row.shipmentId));
        const before = new Set(this.selectedShipmentIds());
        this.selectionChange.emit({
            added: [...now].filter((id) => !before.has(id)),
            removed: [...before].filter((id) => !now.has(id)),
        });
    }
}
