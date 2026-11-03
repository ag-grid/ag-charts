import { type ColDef, type GridApi, type GridOptions, type ICellRendererParams, createGrid } from 'ag-grid-community';

import { h } from '../dom';
import { fmtCurrency, fmtPct } from '../format';
import { baseColDef, compactGridTheme } from '../grid';
import { memo } from '../memo';
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
 * The grid, created into an element its owner holds. `<AgGridReact>` with no wrapper renders the
 * grid's own full-size div straight into its parent, which is what `createGrid` inserts into the
 * element it is given; its `destroy()` removes that div again.
 */
export interface SpendBreakdownGrid {
    mount(parent: HTMLElement): void;
    update(props: SpendBreakdownGridProps): void;
    destroy(): void;
}

const escapeHtml = (value: unknown) =>
    value == null ? '' : String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const defaultColDef: ColDef<SpendRow> = { ...baseColDef<SpendRow>(), filter: false };

const columnDefs: ColDef<SpendRow>[] = [
    { field: 'subcategory', rowGroup: true, hide: true },
    { field: 'material', rowGroup: true, hide: true },
    {
        field: 'spend',
        headerName: 'Total spend',
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
        headerName: 'Total share',
        minWidth: 80,
        type: 'rightAligned',
        aggFunc: 'sum',
        valueFormatter: ({ value }) => (value == null ? '' : fmtPct(value)),
    },
];

/**
 * The sunburst's tabular twin: subcategory and material as row groups, suppliers as the leaves,
 * with spend and share summed up each level. Every figure the sunburst puts in a tooltip is a
 * sortable column here.
 */
export function createSpendBreakdownGrid(props: SpendBreakdownGridProps): SpendBreakdownGrid {
    const rowDataOf = memo(toRows);

    const autoGroupColumnDefOf = memo((supplierColors: Record<string, string>): ColDef<SpendRow> => ({
        headerName: 'Subcategory › Material › Supplier',
        // Leaves show their supplier in the group column, so the hierarchy reads as one column.
        field: 'supplier',
        minWidth: 220,
        flex: 2,
        cellRendererParams: {
            suppressCount: true,
            // A string renderer result is read as markup, so the bare value React renders as text is escaped.
            innerRenderer: ({ node, value, data }: ICellRendererParams<SpendRow>) =>
                node.group || data == null
                    ? escapeHtml(value)
                    : h(
                          'span',
                          { class: 'pc-spend-supplier' },
                          h('span', {
                              class: 'pc-supplier-swatch',
                              style: `background: ${supplierColors[data.supplierId]};`,
                              'aria-hidden': 'true',
                          }),
                          value
                      ),
        },
    }));

    let { tree, supplierColors } = props;
    let api: GridApi<SpendRow> | undefined;

    return {
        mount(parent) {
            api = createGrid<SpendRow>(parent, {
                theme: compactGridTheme,
                rowData: rowDataOf(tree),
                columnDefs,
                defaultColDef,
                autoGroupColumnDef: autoGroupColumnDefOf(supplierColors),
                getRowId: ({ data }) => `${data.subcategory}/${data.material}/${data.supplierId}`,
                groupDefaultExpanded: 1,
                grandTotalRow: 'pinnedBottom',
                suppressAggFuncInHeader: true,
                rowHeight: 36,
                headerHeight: 38,
            });
        },
        update(next) {
            // The props that changed, applied together as ag-grid-react applies a render's changes.
            const changes: GridOptions<SpendRow> = {};
            if (next.tree !== tree) changes.rowData = rowDataOf(next.tree);
            if (next.supplierColors !== supplierColors) {
                changes.autoGroupColumnDef = autoGroupColumnDefOf(next.supplierColors);
            }
            ({ tree, supplierColors } = next);
            if (api && Object.keys(changes).length > 0) api.updateGridOptions(changes);
        },
        destroy() {
            api?.destroy();
            api = undefined;
        },
    };
}
