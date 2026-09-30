import { Component, computed, input, output, signal } from '@angular/core';
import { AgGridAngular, type ICellRendererAngularComp } from 'ag-grid-angular';
import type { CellClassRules, ColDef, GetRowIdParams, ICellRendererParams, RowClassRules } from 'ag-grid-community';

import { ON_TIME_TARGET, QUALITY_TARGET } from '../data';
import { fmtCurrencyCompact, fmtInt, fmtPct, fmtSignedPct } from '../format';
import { baseColDef, compactGridTheme } from '../grid';
import type { SupplierScorecard as Row } from '../types';
import { PcButton } from '../ui';

/** Below-target figures carry the same down-tone the cards gave them. */
const belowTarget = (target: number): CellClassRules<Row> => ({ 'pc-down': ({ value }) => value < target });

/** Cheaper than contract is good news, dearer is bad — the only two-sided figure on the row. */
const VARIANCE_RULES: CellClassRules<Row> = {
    'pc-down': ({ value }) => value > 0,
    'pc-up': ({ value }) => value <= 0,
};

/**
 * The two ways she opens a conversation with a supplier.
 *
 * Icon-only, so the column stays narrow enough to pin, with the action named on each button for
 * anyone who cannot see the glyph — a bare icon is not a label.
 *
 * The host is the React renderer's root `span.pc-contact-cell`.
 */
@Component({
    selector: 'span[pcContactCell]',
    imports: [PcButton],
    host: { class: 'pc-contact-cell' },
    template: `
        <button pcBtn class="pc-icon-btn" aria-label="Call supplier" title="Call supplier">
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                    d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"
                />
            </svg>
        </button>
        <button pcBtn class="pc-icon-btn" aria-label="Email supplier" title="Email supplier">
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="2.5" y="4.5" width="19" height="15" rx="1.5" />
                <path d="m3 7 9 6 9-6" />
            </svg>
        </button>
    `,
})
export class ContactActions implements ICellRendererAngularComp {
    agInit(): void {}

    // The React renderer is an arrow created inside the column memo, so a new column definition
    // remounts it; declining the refresh has the grid recreate this one the same way.
    refresh(): boolean {
        return false;
    }
}

/** What the supplier column's renderer reads from the grid, as the React renderer read it from its closure. */
interface SupplierCellParams {
    supplierColors: Record<string, string>;
    selectedSupplierId?: string;
    onSelect: (supplierId: string) => void;
}

/**
 * The selector: the supplier's own cell, so the click target is the name she reads. It carries the
 * pressed state, and a button is keyboard-reachable where a row is not.
 *
 * The host is the React renderer's root `button.pc-supplier-main`.
 */
@Component({
    selector: 'button[pcSupplierCell]',
    host: {
        type: 'button',
        class: 'pc-supplier-main',
        '[attr.aria-pressed]': 'pressed()',
        '(click)': 'onClick()',
    },
    template:
        '<span class="pc-supplier-swatch" [style.background]="color()" aria-hidden="true"></span><span class="pc-supplier-name">{{ name() }}</span>',
})
export class SupplierCell implements ICellRendererAngularComp {
    protected readonly name = signal('');
    protected readonly color = signal<string | undefined>(undefined);
    protected readonly pressed = signal(false);

    private supplierId?: string;
    private params?: SupplierCellParams;

    agInit(params: ICellRendererParams<Row> & SupplierCellParams): void {
        this.update(params);
    }

    // The React renderer is an arrow created inside the column memo, so a new column definition
    // remounts it, and the button it rendered loses focus. Declining the refresh has the grid recreate
    // this one the same way, so a selection leaves the same focus state behind.
    refresh(): boolean {
        return false;
    }

    protected onClick(): void {
        if (this.supplierId != null) this.params?.onSelect(this.supplierId);
    }

    private update(params: ICellRendererParams<Row> & SupplierCellParams): void {
        this.params = params;
        this.supplierId = params.data?.supplierId;
        this.name.set(params.data?.supplier ?? '');
        this.color.set(this.supplierId == null ? undefined : params.supplierColors[this.supplierId]);
        this.pressed.set(this.supplierId != null && this.supplierId === params.selectedSupplierId);
    }
}

/**
 * The on-time figure, starred when it is the contracted rate rather than a measured one. The React
 * renderer returns a fragment (text, then the `<abbr>`) straight into the cell; a markup string
 * renders the same nodes, where a component would need a host element around them.
 */
const onTimeRenderer = ({ data, value }: ICellRendererParams<Row, number>): string =>
    fmtPct(value ?? 0) +
    (data?.rateIsContracted === true
        ? '<abbr title="Contracted rate: too few deliveries this period to measure"> *</abbr>'
        : '');

/**
 * Her supplier roster: one row per supplier she owns, whether or not it has orders this period.
 * This is the literal definition of "my suppliers" — a supplier she does not own has no row here
 * to filter out, and one of hers never disappears for being quiet.
 *
 * Doubles as the accessible equivalent of the scatter beside it: every channel the scatter encodes
 * positionally is a sortable, labelled column here.
 *
 * The host is the React root `.pc-grid-host`.
 */
@Component({
    selector: 'div[pcSupplierScorecard]',
    imports: [AgGridAngular],
    host: { class: 'pc-grid-host' },
    template: `
        <ag-grid-angular
            style="display: block; height: 100%;"
            [theme]="compactGridTheme"
            [rowData]="rows()"
            [columnDefs]="columnDefs()"
            [defaultColDef]="defaultColDef"
            [getRowId]="getRowId"
            rowClass="pc-supplier"
            [rowClassRules]="rowClassRules()"
            [rowHeight]="46"
            domLayout="autoHeight"
        />
    `,
})
export class SupplierScorecard {
    readonly rows = input.required<Row[]>();
    readonly supplierColors = input.required<Record<string, string>>();
    /** The supplier currently selected, if any. */
    readonly selectedSupplierId = input<string | undefined>();
    /** Selecting a row again clears it. */
    readonly select = output<string>();

    protected readonly compactGridTheme = compactGridTheme;
    protected readonly getRowId = ({ data }: GetRowIdParams<Row>) => data.supplierId;

    // Wrapped headers let the figure columns be as narrow as their figures; "vs contract" sets the floor otherwise.
    protected readonly defaultColDef: ColDef<Row> = {
        ...baseColDef<Row>(),
        wrapHeaderText: true,
        autoHeaderHeight: true,
    };

    // Rebuilt when the selection or colours change, as the React `useMemo` is, so the supplier column re-renders.
    protected readonly columnDefs = computed<ColDef<Row>[]>(() => {
        const params: SupplierCellParams = {
            supplierColors: this.supplierColors(),
            selectedSupplierId: this.selectedSupplierId(),
            onSelect: (supplierId) => this.select.emit(supplierId),
        };
        return [
            {
                field: 'supplier',
                headerName: 'Supplier',
                minWidth: 150,
                flex: 1.4,
                filter: false,
                // The selector carries the pressed state, and a button is keyboard-reachable where a row is not.
                cellRenderer: SupplierCell,
                cellRendererParams: params,
            },
            {
                field: 'onTimeRate',
                headerName: 'On-time',
                minWidth: 62,
                type: 'rightAligned',
                filter: false,
                cellClassRules: belowTarget(ON_TIME_TARGET),
                cellRenderer: onTimeRenderer,
            },
            {
                field: 'qualityScore',
                headerName: 'Quality',
                minWidth: 56,
                type: 'rightAligned',
                filter: false,
                cellClassRules: belowTarget(QUALITY_TARGET),
                valueFormatter: ({ value }) => fmtPct(value),
            },
            {
                field: 'rejectedValue',
                headerName: 'Rejected',
                minWidth: 66,
                type: 'rightAligned',
                filter: false,
                // Deliberately untoned: every supplier rejects something, so reddening non-zero figures means nothing.
                valueFormatter: ({ value }) => fmtCurrencyCompact(value),
            },
            {
                field: 'priceVariance',
                headerName: 'vs contract',
                minWidth: 62,
                type: 'rightAligned',
                filter: false,
                cellClassRules: VARIANCE_RULES,
                valueFormatter: ({ value }) => fmtSignedPct(value),
            },
            {
                field: 'orderCount',
                headerName: 'Order lines',
                minWidth: 56,
                type: 'rightAligned',
                filter: false,
                // A count, not a quantity: the commodity is bought in both tonnes and kilos.
                valueFormatter: ({ value }) => fmtInt(value),
            },
            {
                field: 'spend',
                headerName: 'Spend',
                minWidth: 58,
                type: 'rightAligned',
                filter: false,
                valueFormatter: ({ value }) => fmtCurrencyCompact(value),
            },
            {
                field: 'daysToRenewal',
                headerName: 'Renewal',
                minWidth: 62,
                type: 'rightAligned',
                filter: false,
                // Always signed days: `daysToRenewal` goes negative once a contract has lapsed, and the minus is the meaning.
                valueFormatter: ({ value }) => (value < 0 ? `−${fmtInt(Math.abs(value))}d` : `${fmtInt(value)}d`),
            },
            {
                colId: 'contact',
                headerName: 'Contact',
                minWidth: 84,
                maxWidth: 84,
                // Pinned: an action she has to scroll sideways to reach is an action she will not take.
                pinned: 'right',
                sortable: false,
                filter: false,
                resizable: false,
                cellRenderer: ContactActions,
            },
        ];
    });

    /**
     * The selected supplier stays marked while she reads the charts beside it.
     *
     * A rule rather than `getRowClass`, because the grid only ever *adds* what that returns: it
     * marked the row on select and then had no way to unmark it. A rule is toggled, so deselecting
     * clears the treatment — and unlike keying the style off the button's `aria-pressed`, it reaches
     * the pinned contact column too, which lives in a row container of its own.
     */
    protected readonly rowClassRules = computed<RowClassRules<Row>>(() => {
        const selectedSupplierId = this.selectedSupplierId();
        return { 'is-selected': ({ data }) => data?.supplierId === selectedSupplierId };
    });
}
