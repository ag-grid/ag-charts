import {
    type CellClassRules,
    type ColDef,
    type GridApi,
    type GridOptions,
    type ICellRendererParams,
    type RowClassRules,
    createGrid,
} from 'ag-grid-community';

import { ON_TIME_TARGET, QUALITY_TARGET } from '../data';
import { type View, h, svg } from '../dom';
import { fmtCurrencyCompact, fmtInt, fmtPct, fmtSignedPct } from '../format';
import { baseColDef, compactGridTheme } from '../grid';
import { memo } from '../memo';
import type { SupplierScorecard as Row } from '../types';
import { button } from '../ui';

interface SupplierScorecardProps {
    rows: Row[];
    supplierColors: Record<string, string>;
    /** The supplier currently selected, if any. */
    selectedSupplierId?: string;
    /** Selecting a row again clears it. */
    onSelect: (supplierId: string) => void;
}

export interface SupplierScorecard extends View {
    update(props: Omit<SupplierScorecardProps, 'onSelect'>): void;
}

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
 */
function contactActions(): HTMLElement {
    return h(
        'span',
        { class: 'pc-contact-cell' },
        button(
            { class: 'pc-icon-btn', 'aria-label': 'Call supplier', title: 'Call supplier' },
            svg(
                'svg',
                { viewBox: '0 0 24 24', 'aria-hidden': 'true' },
                svg('path', {
                    d: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z',
                })
            )
        ),
        button(
            { class: 'pc-icon-btn', 'aria-label': 'Email supplier', title: 'Email supplier' },
            svg(
                'svg',
                { viewBox: '0 0 24 24', 'aria-hidden': 'true' },
                svg('rect', { x: '2.5', y: '4.5', width: '19', height: '15', rx: '1.5' }),
                svg('path', { d: 'm3 7 9 6 9-6' })
            )
        )
    );
}

/**
 * Her supplier roster: one row per supplier she owns, whether or not it has orders this period.
 * This is the literal definition of "my suppliers" — a supplier she does not own has no row here
 * to filter out, and one of hers never disappears for being quiet.
 *
 * Doubles as the accessible equivalent of the scatter beside it: every channel the scatter encodes
 * positionally is a sortable, labelled column here.
 */
export function createSupplierScorecard({ onSelect, ...props }: SupplierScorecardProps): SupplierScorecard {
    // `createGrid` inserts its own full-height div into this element and themes that, which is the
    // div ag-grid-react renders, so the class-named element is handed over as is.
    const el = h('div', { class: 'pc-grid-host' });

    // Wrapped headers let the figure columns be as narrow as their figures; "vs contract" sets the floor otherwise.
    const defaultColDef: ColDef<Row> = { ...baseColDef<Row>(), wrapHeaderText: true, autoHeaderHeight: true };

    const columnDefs = memo(
        (supplierColors: Record<string, string>, selectedSupplierId: string | undefined): ColDef<Row>[] => [
            {
                field: 'supplier',
                headerName: 'Supplier',
                minWidth: 150,
                flex: 1.4,
                filter: false,
                // The selector carries the pressed state, and a button is keyboard-reachable where a row is not.
                cellRenderer: ({ data }: ICellRendererParams<Row>) =>
                    data == null
                        ? ''
                        : h(
                              'button',
                              {
                                  type: 'button',
                                  class: 'pc-supplier-main',
                                  'aria-pressed': String(data.supplierId === selectedSupplierId),
                                  onclick: () => onSelect(data.supplierId),
                              },
                              h('span', {
                                  class: 'pc-supplier-swatch',
                                  style: `background: ${supplierColors[data.supplierId]};`,
                                  'aria-hidden': 'true',
                              }),
                              h('span', { class: 'pc-supplier-name' }, data.supplier)
                          ),
            },
            {
                field: 'onTimeRate',
                headerName: 'On-time',
                minWidth: 62,
                type: 'rightAligned',
                filter: false,
                cellClassRules: belowTarget(ON_TIME_TARGET),
                // The rate, with a marker where it is the contracted one: text and an `<abbr>` in the
                // cell, as the React fragment renders.
                cellRenderer: ({ data, value }: ICellRendererParams<Row, number>) =>
                    data?.rateIsContracted === true
                        ? `${fmtPct(value ?? 0)}<abbr title="Contracted rate: too few deliveries this period to measure"> *</abbr>`
                        : fmtPct(value ?? 0),
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
                cellRenderer: () => contactActions(),
            },
        ]
    );

    /**
     * The selected supplier stays marked while she reads the charts beside it.
     *
     * A rule rather than `getRowClass`, because the grid only ever *adds* what that returns: it
     * marked the row on select and then had no way to unmark it. A rule is toggled, so deselecting
     * clears the treatment — and unlike keying the style off the button's `aria-pressed`, it reaches
     * the pinned contact column too, which lives in a row container of its own.
     */
    const rowClassRules = memo(
        (selectedSupplierId: string | undefined): RowClassRules<Row> => ({
            'is-selected': ({ data }) => data?.supplierId === selectedSupplierId,
        })
    );

    let { rows, supplierColors, selectedSupplierId } = props;
    let api: GridApi<Row> | undefined;

    return {
        el,
        mount() {
            api = createGrid<Row>(el, {
                theme: compactGridTheme,
                rowData: rows,
                columnDefs: columnDefs(supplierColors, selectedSupplierId),
                defaultColDef,
                getRowId: ({ data }) => data.supplierId,
                rowClass: 'pc-supplier',
                rowClassRules: rowClassRules(selectedSupplierId),
                rowHeight: 46,
                domLayout: 'autoHeight',
            });
        },
        update(next) {
            // The props that changed, applied together as ag-grid-react applies a render's changes.
            const changes: GridOptions<Row> = {};
            if (next.rows !== rows) changes.rowData = next.rows;
            if (next.supplierColors !== supplierColors || next.selectedSupplierId !== selectedSupplierId) {
                changes.columnDefs = columnDefs(next.supplierColors, next.selectedSupplierId);
            }
            if (next.selectedSupplierId !== selectedSupplierId) {
                changes.rowClassRules = rowClassRules(next.selectedSupplierId);
            }
            ({ rows, supplierColors, selectedSupplierId } = next);
            if (api && Object.keys(changes).length > 0) api.updateGridOptions(changes);
        },
        destroy() {
            api?.destroy();
            api = undefined;
        },
    };
}
