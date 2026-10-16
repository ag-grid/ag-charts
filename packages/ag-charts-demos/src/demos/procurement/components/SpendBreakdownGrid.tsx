import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useMemo } from 'react';

import { fmtCurrency, fmtPct } from '../format';
import { baseColDef, compactGridTheme } from '../grid';
import type { SpendNode } from '../types';

/** One supplier's spend on one material: a leaf of the spend tree, with the rings above it as columns. */
interface SpendRow {
    subcategory: string;
    material: string;
    supplierId: string;
    supplier: string;
    spend: number;
    shareOfTotal: number;
}

/** Flattens the tree to its supplier leaves; the grid regroups them by the ring each one sits in. */
function toRows(tree: SpendNode): SpendRow[] {
    const rows: SpendRow[] = [];
    const visit = (node: SpendNode) => {
        if (node.supplierId != null) {
            const [subcategory, material] = node.path;
            rows.push({
                subcategory,
                material,
                supplierId: node.supplierId,
                supplier: node.name,
                spend: node.spend,
                shareOfTotal: node.shareOfTotal,
            });
        }
        node.children?.forEach(visit);
    };
    visit(tree);
    return rows;
}

interface SpendBreakdownGridProps {
    tree: SpendNode;
    /** Per-supplier colours, so a supplier's row carries the same swatch as its sector. */
    supplierColors: Record<string, string>;
}

/**
 * The sunburst's tabular twin: subcategory and material as row groups, suppliers as the leaves,
 * with spend and share summed up each level. Every figure the sunburst puts in a tooltip is a
 * sortable column here.
 */
export function SpendBreakdownGrid({ tree, supplierColors }: SpendBreakdownGridProps) {
    const rowData = useMemo(() => toRows(tree), [tree]);
    const defaultColDef = useMemo(() => ({ ...baseColDef<SpendRow>(), filter: false }), []);

    const columnDefs = useMemo<ColDef<SpendRow>[]>(
        () => [
            { field: 'subcategory', rowGroup: true, hide: true },
            { field: 'material', rowGroup: true, hide: true },
            {
                field: 'spend',
                headerName: 'Spend',
                minWidth: 110,
                type: 'rightAligned',
                aggFunc: 'sum',
                sort: 'desc',
                valueFormatter: ({ value, node }) => {
                    if (value == null) return '';
                    // A supplier kept in the ring with no spend reads as such, as its sector does.
                    if (value === 0 && node?.group !== true) return 'No spend';
                    return fmtCurrency(value);
                },
            },
            {
                field: 'shareOfTotal',
                headerName: 'Share',
                minWidth: 80,
                type: 'rightAligned',
                aggFunc: 'sum',
                valueFormatter: ({ value }) => (value == null ? '' : fmtPct(value)),
            },
        ],
        []
    );

    const autoGroupColumnDef = useMemo<ColDef<SpendRow>>(
        () => ({
            headerName: 'Subcategory › Material › Supplier',
            // Leaves show their supplier in the group column, so the hierarchy reads as one column.
            field: 'supplier',
            minWidth: 220,
            flex: 2,
            cellRendererParams: {
                suppressCount: true,
                innerRenderer: ({ node, value, data }: ICellRendererParams<SpendRow>) =>
                    node.group || data == null ? (
                        value
                    ) : (
                        <span className="pc-spend-supplier">
                            <span
                                className="pc-supplier-swatch"
                                style={{ background: supplierColors[data.supplierId] }}
                                aria-hidden="true"
                            />
                            {value}
                        </span>
                    ),
            },
        }),
        [supplierColors]
    );

    return (
        <AgGridReact<SpendRow>
            theme={compactGridTheme}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            autoGroupColumnDef={autoGroupColumnDef}
            getRowId={({ data }) => `${data.subcategory}/${data.material}/${data.supplierId}`}
            groupDefaultExpanded={1}
            grandTotalRow="pinnedBottom"
            rowHeight={36}
            headerHeight={38}
            containerStyle={{ height: '100%', width: '100%' }}
        />
    );
}
