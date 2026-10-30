import type { ColDef, GridApi, IRowNode, SelectionChangedEvent, ValueFormatterParams } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { fmtCurrencyCompact, fmtDate } from '../format';
import { baseColDef, compactGridTheme } from '../grid';
import type { TrackedShipment } from '../types';
import { StatusCell } from './PurchaseOrderGrid';

const dateFormatter = ({ value }: ValueFormatterParams<TrackedShipment, number>) =>
    value == null ? '' : fmtDate(value);

interface ShipmentScheduleGridProps {
    shipments: TrackedShipment[];
    /** The shipments currently selected; empty when none is. */
    selectedShipmentIds: string[];
    /** The user changed the selection on the grid. */
    onSelectionChange: (added: string[], removed: string[]) => void;
}

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

/**
 * The arrival schedule's tabular twin: one row per shipment with the figures the schedule's bars
 * and tooltips carry, soonest required first as the schedule's axis is. Selecting a row selects its
 * shipment, exactly as clicking its bar does.
 */
export function ShipmentScheduleGrid({ shipments, selectedShipmentIds, onSelectionChange }: ShipmentScheduleGridProps) {
    const gridRef = useRef<AgGridReact<TrackedShipment>>(null);
    const defaultColDef = useMemo(() => ({ ...baseColDef<TrackedShipment>(), filter: false }), []);

    const columnDefs = useMemo<ColDef<TrackedShipment>[]>(
        () => [
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
        ],
        []
    );

    useEffect(() => {
        const api = gridRef.current?.api;
        if (api != null) mirrorSelection(api, selectedShipmentIds);
    }, [selectedShipmentIds, shipments]);

    const onSelectionChanged = useCallback(
        ({ api, source }: SelectionChangedEvent<TrackedShipment>) => {
            // Our own mirroring echoes back as an api change; reacting to it would loop.
            if (source.startsWith('api') || source === 'rowDataChanged' || source === 'gridInitializing') return;
            const now = new Set(api.getSelectedRows().map((row) => row.shipmentId));
            const before = new Set(selectedShipmentIds);
            onSelectionChange(
                [...now].filter((id) => !before.has(id)),
                [...before].filter((id) => !now.has(id))
            );
        },
        [selectedShipmentIds, onSelectionChange]
    );

    return (
        <div className="pc-grid-host pc-grid-host--fill">
            <AgGridReact<TrackedShipment>
                ref={gridRef}
                theme={compactGridTheme}
                rowData={shipments}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                getRowId={({ data }) => data.shipmentId}
                // Click selects one shipment, Ctrl/Cmd-click adds or removes one — as on the schedule.
                rowSelection={{
                    mode: 'multiRow',
                    checkboxes: false,
                    headerCheckbox: false,
                    enableClickSelection: true,
                }}
                onGridReady={({ api }) => mirrorSelection(api, selectedShipmentIds)}
                onSelectionChanged={onSelectionChanged}
                rowHeight={36}
                headerHeight={38}
            />
        </div>
    );
}
