import * as RTabs from '@radix-ui/react-tabs';
import { useCallback, useMemo, useState } from 'react';

import { supplierColors as buildSupplierColors } from './chartTheme';
import { AttentionAlert } from './components/AttentionAlert';
import { DemoNotice } from './components/DemoNotice';
import { HelpCard } from './components/HelpCard';
import { buildKpis, buildSpendKpis } from './components/KpiStrip';
import { OrdersView } from './components/OrdersView';
import { SidebarActions } from './components/SidebarActions';
import { SpendView } from './components/SpendView';
import { SuppliersView } from './components/SuppliersView';
import { SUBCATEGORIES } from './data';
import { fmtDate, fmtInt } from './format';
import type { AttentionAction, AttentionItem, PoActionKind } from './types';
import { Select } from './ui';
import {
    ALL_FILTER,
    DEFAULT_ORDERS_FILTER,
    DEFAULT_PERIOD,
    DEFAULT_SPEND_PERIOD,
    MANAGER,
    MY_SUPPLIERS,
    MY_TRACKED_SHIPMENTS,
    type OrdersFilter,
    PERIOD_OPTIONS,
    type PeriodMonths,
    SPEND_PERIOD_OPTIONS,
    type SpendPeriod,
    applySelectionChange,
    myAttentionItems,
    myBurnUp,
    myOrdersFilterOptions,
    myOrdersInRange,
    myOrdersScope,
    myPeriod,
    myQualityCost,
    myScorecard,
    mySlipDistributions,
    mySpendPeriod,
    mySpendPosition,
    mySpendTree,
    mySpendTrend,
    mySummary,
    mySupplierShare,
    mySupplierTrend,
    ordersOnShipments,
    periodLabel,
    shipmentCarryingOrder,
    spendKpiLabel,
    spendPeriodLabel,
    spendProjectionLabel,
} from './workspace';

const SUPPLIER_COLORS = buildSupplierColors(MANAGER.supplierIds);

/** Roster order, so every chart lists and colours her suppliers the same way. */
const SUPPLIER_NAMES = new Map(MY_SUPPLIERS.map((supplier) => [supplier.supplierId, supplier.name]));

/**
 * The late shipments needing a decision from her. Resolving one hides it; it is never re-raised.
 *
 * Only lateness raises an item. Everything else she would want to watch — a renewal coming up, her
 * budget position — is still on the views built from the same records, so nothing is lost; the
 * worklist stays the list she cannot defer.
 */
const ALL_ATTENTION_ITEMS = myAttentionItems();

/** Monogram for the account block at the foot of the sidebar. */
const INITIALS = MANAGER.name
    .split(' ')
    .map((part) => part[0])
    .join('');

/**
 * The tabs follow her own working cadences, which the spec spells out: she checks the workspace
 * daily, reviews scorecard trends weekly, and does spend and contract work quarterly. Grouping by
 * cadence rather than by chart type is what keeps each tab answerable in one screen.
 */
const TABS = [
    { value: 'orders', label: 'My orders' },
    { value: 'suppliers', label: 'My suppliers' },
    { value: 'spend', label: 'My spend' },
] as const;

/** The active tab's label, which doubles as the page title. */
const TAB_LABELS = new Map<string, string>(TABS.map((entry) => [entry.value, entry.label]));

export function WorkspaceApp() {
    const [tab, setTab] = useState<string>('orders');
    /**
     * Selection is per tab, and deliberately does not travel.
     *
     * Each tab asks its own question over its own window: the orders tab is live freight, the
     * suppliers tab a trailing performance record, the spend tab a calendar period. A selection
     * carried across would rescope a grid on a tab the reader is not looking at — and the two
     * scopes rarely intersect, so it would as often empty a view as narrow it.
     */
    const [selectedShipmentIds, setSelectedShipmentIds] = useState<string[]>([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>();
    /** Items she has acted on, and what she chose — resolved items leave the list. */
    const [resolved, setResolved] = useState<Record<string, string>>({});
    const [poActions, setPoActions] = useState<Record<string, PoActionKind>>({});
    /** The trailing window the suppliers tab's trends and commercial columns are read over. */
    const [months, setMonths] = useState<PeriodMonths>(DEFAULT_PERIOD);
    /** The calendar window the spend tab is read over, and budgeted against. */
    const [spendPeriod, setSpendPeriod] = useState<SpendPeriod>(DEFAULT_SPEND_PERIOD);
    /** The supplier and material subcategory the orders tab is narrowed to. */
    const [ordersFilter, setOrdersFilter] = useState<OrdersFilter>(DEFAULT_ORDERS_FILTER);

    const ordersScope = useMemo(() => myOrdersScope(ordersFilter), [ordersFilter]);

    /** Each filter's choices, led by the option that narrows nothing. */
    const ordersFilterOptions = useMemo(() => {
        const { supplierIds, subcategories } = myOrdersFilterOptions(ordersFilter);
        return {
            suppliers: [
                { value: ALL_FILTER, label: 'All suppliers' },
                ...supplierIds.map((supplierId) => ({ value: supplierId, label: SUPPLIER_NAMES.get(supplierId)! })),
            ],
            subcategories: [
                { value: ALL_FILTER, label: 'All subcategories' },
                ...subcategories.map((subcategory) => ({ value: subcategory, label: subcategory })),
            ],
        };
    }, [ordersFilter]);

    // The grid lists the selected shipments' lines, so a shipment the filters hide cannot stay selected.
    const onOrdersFilterChange = useCallback(
        (change: Partial<OrdersFilter>) => {
            const next = { ...ordersFilter, ...change };
            const visible = new Set(myOrdersScope(next).shipments.map((shipment) => shipment.shipmentId));
            setOrdersFilter(next);
            setSelectedShipmentIds((selected) => selected.filter((id) => visible.has(id)));
        },
        [ordersFilter]
    );

    const supplierRange = useMemo(() => myPeriod(months), [months]);
    const supplierOrders = useMemo(() => myOrdersInRange(supplierRange), [supplierRange]);

    const spendRange = useMemo(() => mySpendPeriod(spendPeriod), [spendPeriod]);
    const spendOrders = useMemo(() => myOrdersInRange(spendRange), [spendRange]);

    // Selecting the same thing again clears it, on both tabs.
    const onSelectSupplier = useCallback((supplierId: string) => {
        setSelectedSupplierId((prev) => (prev === supplierId ? undefined : supplierId));
    }, []);

    const onShipmentSelectionChange = useCallback((added: string[], removed: string[]) => {
        setSelectedShipmentIds((prev) => applySelectionChange(prev, added, removed));
    }, []);

    // The worklist ignores the filters, so following an item clears any that hide its shipment.
    const onSelectAttention = useCallback(
        (shipmentId: string) => {
            if (!ordersScope.shipments.some((shipment) => shipment.shipmentId === shipmentId)) {
                setOrdersFilter(DEFAULT_ORDERS_FILTER);
            }
            setSelectedShipmentIds([shipmentId]);
        },
        [ordersScope]
    );

    /** Acting on an item resolves it in place. */
    const onResolveAttention = useCallback((item: AttentionItem, action: AttentionAction) => {
        setResolved((prev) => ({ ...prev, [item.itemId]: action.label }));
    }, []);

    /**
     * Recording a decision on a PO line also resolves the attention item that raised it, so the
     * worklist and the grid cannot disagree about whether something has been dealt with.
     */
    const onPoAction = useCallback((poId: string, kind: PoActionKind) => {
        setPoActions((prev) => ({ ...prev, [poId]: kind }));
        const shipmentId = shipmentCarryingOrder(poId);
        if (shipmentId != null) setResolved((prev) => ({ ...prev, [`shipment-${shipmentId}`]: kind }));
    }, []);

    const clearSelection = useCallback(() => setSelectedShipmentIds([]), []);

    const attentionItems = useMemo(
        () => ALL_ATTENTION_ITEMS.filter((item) => resolved[item.itemId] == null),
        [resolved]
    );

    const tree = useMemo(() => mySpendTree(spendOrders), [spendOrders]);

    // The roster is never narrowed by the selected supplier — that would leave a single card,
    // defeating the comparison it exists for. Selection dims the other cards instead.
    const scorecardRows = useMemo(
        () => myScorecard(supplierOrders, MY_TRACKED_SHIPMENTS, months),
        [supplierOrders, months]
    );

    const slipDistributions = useMemo(() => mySlipDistributions(months), [months]);
    const supplierTrend = useMemo(() => mySupplierTrend(months), [months]);
    const qualityCost = useMemo(() => myQualityCost(months), [months]);

    const shareRows = useMemo(() => mySupplierShare(spendOrders), [spendOrders]);
    // Fixed to the current quarter, matching the allocation it is paced against.
    const burnUp = useMemo(() => myBurnUp(spendPeriod), [spendPeriod]);
    // Both fixed windows too, for the reasons given on each accessor — neither reads the selector,
    // so neither needs to recompute when it changes.
    const spendTrend = useMemo(() => mySpendTrend(spendPeriod), [spendPeriod]);

    /**
     * The grid starts empty and is filled by selecting a shipment on the map or the schedule. A
     * shipment's lines are read over her filtered order book, delivered lines included: a shipment
     * is a live entity, and its lines were typically raised long before they were due.
     */
    const gridOrders = useMemo(
        () => ordersOnShipments(ordersScope.orders, selectedShipmentIds),
        [ordersScope, selectedShipmentIds]
    );

    const summary = useMemo(() => mySummary(spendOrders, ordersScope), [spendOrders, ordersScope]);
    const kpis = useMemo(() => buildKpis(summary), [summary]);
    const spendPosition = useMemo(() => mySpendPosition(spendPeriod), [spendPeriod]);
    const spendKpis = useMemo(
        () =>
            buildSpendKpis({
                position: spendPosition,
                label: spendKpiLabel(spendPeriod),
                projectionLabel: spendProjectionLabel(spendPeriod),
            }),
        [spendPosition, spendPeriod]
    );
    const gridSubtitle = useMemo(() => {
        if (selectedShipmentIds.length === 0) return 'No shipment selected.';
        // Delivered lines are included, so this cannot claim to be showing open lines.
        const on =
            selectedShipmentIds.length === 1
                ? selectedShipmentIds[0]
                : `${fmtInt(selectedShipmentIds.length)} shipments`;
        return `${fmtInt(gridOrders.length)} of my order lines on ${on}`;
    }, [gridOrders.length, selectedShipmentIds]);

    return (
        <RTabs.Root className="pc-app" orientation="vertical" value={tab} onValueChange={setTab}>
            <aside className="pc-sidebar">
                <div className="pc-brand-row">
                    <span className="pc-brand">
                        <svg className="pc-brand-mark" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 2.5 21 7v10l-9 4.5L3 17V7z" className="pc-brand-mark-box" />
                            <path d="M3 7l9 4.5L21 7M12 11.5V21.5" className="pc-brand-mark-edge" />
                        </svg>
                        Supply Desk
                    </span>
                    <DemoNotice />
                </div>
                <RTabs.List className="pc-tabs-list" aria-label="Workspace views">
                    {TABS.map((entry) => (
                        <RTabs.Trigger key={entry.value} className="pc-tab-trigger" value={entry.value}>
                            {entry.label}
                        </RTabs.Trigger>
                    ))}
                </RTabs.List>
                <span className="pc-sidebar-spacer" />
                <HelpCard />
                <SidebarActions />
                <div className="pc-account">
                    {/* Titled because the name beside it is hidden in the collapsed layout. */}
                    <span className="pc-avatar" title={`${MANAGER.name} · ${MANAGER.title}`}>
                        {INITIALS}
                    </span>
                    <span className="pc-account-text">
                        <span className="pc-account-name">{MANAGER.name}</span>
                        <span className="pc-account-title">{MANAGER.title}</span>
                    </span>
                </div>
            </aside>

            <div className="pc-body">
                <div className="pc-view">
                    <div className="pc-page-head">
                        <h1 className="pc-page-title">{TAB_LABELS.get(tab) ?? ''}</h1>
                        <div className="pc-page-actions">
                            {/*
                             * The period control belongs to the tab it scopes, and the two tabs that
                             * have one do not share a window — so it is rendered per tab rather than
                             * once for the workspace. The orders tab has none: its KPIs follow the
                             * supplier and subcategory filters and its grid the shipment selection,
                             * so there is nothing for a period to narrow.
                             */}
                            {tab === 'suppliers' && (
                                <div className="pc-page-controls">
                                    {/* The dates the period resolves to, beside the control that sets it. */}
                                    <span className="pc-page-range">
                                        {fmtDate(supplierRange.start)} – {fmtDate(supplierRange.end)}
                                    </span>
                                    <Select
                                        label="Period"
                                        ariaLabel="Trailing period my supplier performance is read over"
                                        value={String(months)}
                                        onValueChange={(value) => setMonths(Number(value) as PeriodMonths)}
                                        options={PERIOD_OPTIONS.map((option) => ({
                                            value: String(option),
                                            label: periodLabel(option),
                                        }))}
                                    />
                                </div>
                            )}
                            {tab === 'spend' && (
                                <div className="pc-page-controls">
                                    <span className="pc-page-range">
                                        {fmtDate(spendRange.start)} – {fmtDate(spendRange.end)}
                                    </span>
                                    <Select
                                        label="Period"
                                        ariaLabel="Calendar period my spend is read over"
                                        value={spendPeriod}
                                        onValueChange={(value) => setSpendPeriod(value as SpendPeriod)}
                                        options={SPEND_PERIOD_OPTIONS.map((option) => ({
                                            value: option,
                                            label: spendPeriodLabel(option),
                                        }))}
                                    />
                                </div>
                            )}
                            {/* Her landing view only: the worklist's items resolve into the order
                                book and the grid below it, so the alert lives where they land. */}
                            {tab === 'orders' && (
                                <>
                                    <div className="pc-page-controls">
                                        <Select
                                            label="Supplier"
                                            ariaLabel="Supplier my orders are narrowed to"
                                            value={ordersFilter.supplierId}
                                            onValueChange={(supplierId) => onOrdersFilterChange({ supplierId })}
                                            options={ordersFilterOptions.suppliers}
                                        />
                                        <Select
                                            label="Subcategory"
                                            ariaLabel="Material subcategory my orders are narrowed to"
                                            value={ordersFilter.subcategory}
                                            onValueChange={(subcategory) => onOrdersFilterChange({ subcategory })}
                                            options={ordersFilterOptions.subcategories}
                                        />
                                    </div>
                                    <AttentionAlert
                                        items={attentionItems}
                                        onSelect={onSelectAttention}
                                        onResolve={onResolveAttention}
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    <RTabs.Content className="pc-tab-content" value="orders">
                        <OrdersView
                            kpis={kpis}
                            shipments={ordersScope.shipments}
                            selectedShipmentIds={selectedShipmentIds}
                            onShipmentSelectionChange={onShipmentSelectionChange}
                            orders={gridOrders}
                            gridSubtitle={gridSubtitle}
                            poActions={poActions}
                            onPoAction={onPoAction}
                            onClearSelection={clearSelection}
                            canClearSelection={selectedShipmentIds.length > 0}
                        />
                    </RTabs.Content>

                    <RTabs.Content className="pc-tab-content" value="suppliers">
                        <SuppliersView
                            rows={scorecardRows}
                            supplierNames={SUPPLIER_NAMES}
                            supplierColors={SUPPLIER_COLORS}
                            selectedSupplierId={selectedSupplierId}
                            onSelectSupplier={onSelectSupplier}
                            slipDistributions={slipDistributions}
                            qualityCost={qualityCost}
                            trend={supplierTrend}
                        />
                    </RTabs.Content>

                    <RTabs.Content className="pc-tab-content" value="spend">
                        <SpendView
                            kpis={spendKpis}
                            tree={tree}
                            supplierNames={SUPPLIER_NAMES}
                            supplierColors={SUPPLIER_COLORS}
                            shareRows={shareRows}
                            burnUp={burnUp}
                            spendPosition={spendPosition}
                            spendTrend={spendTrend}
                            subcategories={SUBCATEGORIES[MANAGER.commodity]}
                        />
                    </RTabs.Content>
                </div>
            </div>
        </RTabs.Root>
    );
}
