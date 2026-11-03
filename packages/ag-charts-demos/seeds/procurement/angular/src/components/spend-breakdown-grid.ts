import { Component, computed, input, signal } from '@angular/core';
import { AgGridAngular, type ICellRendererAngularComp } from 'ag-grid-angular';
import type { ColDef, GetRowIdParams, ICellRendererParams } from 'ag-grid-community';

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

/** What the group column's inner renderer reads, as the React renderer read it from its closure. */
interface SupplierInnerParams {
    supplierColors: Record<string, string>;
}

/**
 * The group column's inner renderer: a group's own value, or a supplier leaf with its swatch. The React
 * renderer returns the bare value for a group, which a component cannot, so its host span carries the
 * value there and takes the `pc-spend-supplier` class only on a leaf.
 */
@Component({
    selector: 'span[pcSpendSupplierCell]',
    host: { '[class]': "swatch() == null ? '' : 'pc-spend-supplier'" },
    template: `@if (swatch() != null) {
            <span class="pc-supplier-swatch" [style.background]="swatch()" aria-hidden="true"></span>
        }
        {{ value() }}`,
})
export class SpendSupplierCell implements ICellRendererAngularComp {
    protected readonly value = signal('');
    protected readonly swatch = signal<string | undefined>(undefined);

    agInit({ node, value, data, supplierColors }: ICellRendererParams<SpendRow> & SupplierInnerParams): void {
        this.value.set(value == null ? '' : String(value));
        this.swatch.set(node.group || data == null ? undefined : supplierColors[data.supplierId]);
    }

    // An arrow inside the React `useMemo`, so new colours remount it; returning false recreates it here.
    refresh(): boolean {
        return false;
    }
}

const COLUMN_DEFS: ColDef<SpendRow>[] = [
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
 *
 * The React root is the `AgGridReact` wrapper, sized by its `containerStyle`; the host stands in for
 * it, with `<ag-grid-angular>` filling it.
 */
@Component({
    selector: 'div[pcSpendBreakdownGrid]',
    imports: [AgGridAngular],
    host: { style: 'height: 100%; width: 100%;' },
    template: `
        <ag-grid-angular
            style="display: block; height: 100%; width: 100%;"
            [theme]="compactGridTheme"
            [rowData]="rowData()"
            [columnDefs]="columnDefs"
            [defaultColDef]="defaultColDef"
            [autoGroupColumnDef]="autoGroupColumnDef()"
            [getRowId]="getRowId"
            [groupDefaultExpanded]="1"
            grandTotalRow="pinnedBottom"
            [suppressAggFuncInHeader]="true"
            [rowHeight]="36"
            [headerHeight]="38"
        />
    `,
})
export class SpendBreakdownGrid {
    readonly tree = input.required<SpendNode>();
    /** Per-supplier colours, so a supplier's row carries the same swatch as its sector. */
    readonly supplierColors = input.required<Record<string, string>>();

    protected readonly compactGridTheme = compactGridTheme;
    protected readonly columnDefs = COLUMN_DEFS;
    protected readonly defaultColDef: ColDef<SpendRow> = { ...baseColDef<SpendRow>(), filter: false };
    protected readonly getRowId = ({ data }: GetRowIdParams<SpendRow>) =>
        `${data.subcategory}/${data.material}/${data.supplierId}`;

    protected readonly rowData = computed(() => toRows(this.tree()));

    protected readonly autoGroupColumnDef = computed<ColDef<SpendRow>>(() => {
        const innerRendererParams: SupplierInnerParams = { supplierColors: this.supplierColors() };
        return {
            headerName: 'Subcategory › Material › Supplier',
            // Leaves show their supplier in the group column, so the hierarchy reads as one column.
            field: 'supplier',
            minWidth: 220,
            flex: 2,
            cellRendererParams: {
                suppressCount: true,
                innerRenderer: SpendSupplierCell,
                innerRendererParams,
            },
        };
    });
}
