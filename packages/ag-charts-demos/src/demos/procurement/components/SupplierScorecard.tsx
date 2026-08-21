import type { CellClassRules, ColDef, ICellRendererParams, RowClassRules } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useMemo } from 'react';

import { ON_TIME_TARGET, QUALITY_TARGET } from '../data';
import { fmtCurrencyCompact, fmtInt, fmtPct, fmtSignedPct } from '../format';
import { baseColDef, compactGridTheme } from '../grid';
import type { SupplierScorecard as Row } from '../types';
import { Button } from '../ui';

interface SupplierScorecardProps {
    rows: Row[];
    supplierColors: Record<string, string>;
    /** The supplier currently selected, if any. */
    selectedSupplierId?: string;
    /** Selecting a row again clears it. */
    onSelect: (supplierId: string) => void;
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
function ContactActions() {
    return (
        <span className="pc-contact-cell">
            <Button className="pc-icon-btn" aria-label="Call supplier" title="Call supplier">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
                </svg>
            </Button>
            <Button className="pc-icon-btn" aria-label="Email supplier" title="Email supplier">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="2.5" y="4.5" width="19" height="15" rx="1.5" />
                    <path d="m3 7 9 6 9-6" />
                </svg>
            </Button>
        </span>
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
export function SupplierScorecard({ rows, supplierColors, selectedSupplierId, onSelect }: SupplierScorecardProps) {
    // Wrapped headers are what let the figure columns be as narrow as their figures: "vs contract"
    // sets the floor otherwise, and in a half-width card that padding is the whole budget.
    const defaultColDef = useMemo<ColDef<Row>>(
        () => ({ ...baseColDef<Row>(), wrapHeaderText: true, autoHeaderHeight: true }),
        []
    );

    const columnDefs = useMemo<ColDef<Row>[]>(
        () => [
            {
                field: 'supplier',
                headerName: 'Supplier',
                minWidth: 150,
                flex: 1.4,
                filter: false,
                // The selector, rather than the row: it carries the pressed state, and a button is
                // reachable and toggleable from the keyboard where a row is not.
                cellRenderer: ({ data }: ICellRendererParams<Row>) =>
                    data == null ? null : (
                        <button
                            type="button"
                            className="pc-supplier-main"
                            aria-pressed={data.supplierId === selectedSupplierId}
                            onClick={() => onSelect(data.supplierId)}
                        >
                            <span
                                className="pc-supplier-swatch"
                                style={{ background: supplierColors[data.supplierId] }}
                                aria-hidden="true"
                            />
                            <span className="pc-supplier-name">{data.supplier}</span>
                        </button>
                    ),
            },
            {
                field: 'onTimeRate',
                headerName: 'On-time',
                minWidth: 62,
                type: 'rightAligned',
                filter: false,
                cellClassRules: belowTarget(ON_TIME_TARGET),
                cellRenderer: ({ data, value }: ICellRendererParams<Row, number>) => (
                    <>
                        {fmtPct(value ?? 0)}
                        {data?.rateIsContracted === true && (
                            <abbr title="Contracted rate: too few deliveries this period to measure"> *</abbr>
                        )}
                    </>
                ),
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
                // Deliberately untoned. Every supplier rejects something, so a rule that reddens any
                // non-zero figure reddens the whole column and stops meaning anything; the quality
                // score beside it already carries the against-target judgement.
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
                // A count rather than a quantity: her commodity is bought in both tonnes and kilos, so
                // a summed quantity is only comparable between suppliers that happen to share a unit.
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
                // Always days, so the column is one comparable number down the row rather than dates
                // and countdowns mixed. `daysToRenewal` goes negative once a contract has lapsed, and
                // the minus is the whole meaning — hence the sign rather than a bare figure.
                valueFormatter: ({ value }) => (value < 0 ? `−${fmtInt(Math.abs(value))}d` : `${fmtInt(value)}d`),
            },
            {
                colId: 'contact',
                headerName: 'Contact',
                minWidth: 84,
                maxWidth: 84,
                // Pinned, as in the purchase-order grid: an action she has to scroll sideways to
                // reach is an action she will not take.
                pinned: 'right',
                sortable: false,
                filter: false,
                resizable: false,
                cellRenderer: () => <ContactActions />,
            },
        ],
        [supplierColors, selectedSupplierId, onSelect]
    );

    /**
     * The selected supplier stays marked while she reads the charts beside it.
     *
     * A rule rather than `getRowClass`, because the grid only ever *adds* what that returns: it
     * marked the row on select and then had no way to unmark it. A rule is toggled, so deselecting
     * clears the treatment — and unlike keying the style off the button's `aria-pressed`, it reaches
     * the pinned contact column too, which lives in a row container of its own.
     */
    const rowClassRules = useMemo<RowClassRules<Row>>(
        () => ({ 'is-selected': ({ data }) => data?.supplierId === selectedSupplierId }),
        [selectedSupplierId]
    );

    return (
        <div className="pc-grid-host">
            <AgGridReact<Row>
                theme={compactGridTheme}
                rowData={rows}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                getRowId={({ data }) => data.supplierId}
                rowClass="pc-supplier"
                rowClassRules={rowClassRules}
                rowHeight={46}
                domLayout="autoHeight"
            />
        </div>
    );
}
