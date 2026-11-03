import { supplierColors as buildSupplierColors } from './chartTheme';
import { type AttentionAlert, createAttentionAlert } from './components/AttentionAlert';
import { demoNotice } from './components/DemoNotice';
import { helpCard } from './components/HelpCard';
import { buildKpis, buildSpendKpis } from './components/KpiStrip';
import { type OrdersView, createOrdersView } from './components/OrdersView';
import { sidebarActions } from './components/SidebarActions';
import { type SpendView, createSpendView } from './components/SpendView';
import { type SuppliersView, createSuppliersView } from './components/SuppliersView';
import { SUBCATEGORIES } from './data';
import { type View, h, svg } from './dom';
import { fmtDate, fmtInt } from './format';
import { memo } from './memo';
import type { AttentionAction, AttentionItem, DateRange, PoActionKind, PurchaseOrder } from './types';
import { type Select, createSelect, createTabs } from './ui';
import {
    ALL_FILTER,
    DEFAULT_ORDERS_FILTER,
    DEFAULT_PERIOD,
    DEFAULT_SPEND_PERIOD,
    MANAGER,
    MY_SUPPLIERS,
    MY_TRACKED_SHIPMENTS,
    type OrdersFilter,
    type OrdersScope,
    PERIOD_OPTIONS,
    type PeriodMonths,
    SPEND_PERIOD_OPTIONS,
    type SpendPeriod,
    applySelectionChange,
    myAttentionItems,
    myBurnUp,
    myMaterialQualityCost,
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

/** The active tab's view and the page-head controls that belong to it. */
interface TabScene {
    tab: string;
    controls?: HTMLDivElement;
    range?: HTMLSpanElement;
    selects: Select[];
    alert?: AttentionAlert;
    view: OrdersView | SuppliersView | SpendView;
}

export function createWorkspaceApp(): View {
    // The React state, and the render that follows a change to it.
    let tab = 'orders';
    /**
     * Selection is per tab, and deliberately does not travel.
     *
     * Each tab asks its own question over its own window: the orders tab is live freight, the
     * suppliers tab a trailing performance record, the spend tab a calendar period. A selection
     * carried across would rescope a grid on a tab the reader is not looking at — and the two
     * scopes rarely intersect, so it would as often empty a view as narrow it.
     */
    let selectedShipmentIds: string[] = [];
    let selectedSupplierId: string | undefined;
    /** Items she has acted on, and what she chose — resolved items leave the list. */
    let resolved: Record<string, string> = {};
    let poActions: Record<string, PoActionKind> = {};
    /** The trailing window the suppliers tab's trends and commercial columns are read over. */
    let months: PeriodMonths = DEFAULT_PERIOD;
    /** The calendar window the spend tab is read over, and budgeted against. */
    let spendPeriod: SpendPeriod = DEFAULT_SPEND_PERIOD;
    /** The supplier and material subcategory the orders tab is narrowed to. */
    let ordersFilter: OrdersFilter = DEFAULT_ORDERS_FILTER;

    // The React `useMemo`s: each recomputes only when its inputs change identity.
    const ordersScope = memo((ordersFilter: OrdersFilter) => myOrdersScope(ordersFilter));

    /** Each filter's choices, led by the option that narrows nothing. */
    const ordersFilterOptions = memo((ordersFilter: OrdersFilter) => {
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
    });

    const supplierRange = memo((months: PeriodMonths) => myPeriod(months));
    const supplierOrders = memo(myOrdersInRange);
    const spendRange = memo((spendPeriod: SpendPeriod) => mySpendPeriod(spendPeriod));
    const spendOrders = memo(myOrdersInRange);
    const attentionItems = memo((resolved: Record<string, string>) =>
        ALL_ATTENTION_ITEMS.filter((item) => resolved[item.itemId] == null)
    );
    const tree = memo(mySpendTree);
    // The roster is never narrowed by the selected supplier — that would leave a single card,
    // defeating the comparison it exists for. Selection dims the other cards instead.
    const scorecardRows = memo((orders: PurchaseOrder[], months: PeriodMonths) =>
        myScorecard(orders, MY_TRACKED_SHIPMENTS, months)
    );
    const slipDistributions = memo(mySlipDistributions);
    const supplierTrend = memo(mySupplierTrend);
    const qualityCost = memo(myQualityCost);
    const materialQualityCost = memo(myMaterialQualityCost);
    const shareRows = memo(mySupplierShare);
    // Fixed to the current quarter, matching the allocation it is paced against.
    const burnUp = memo(myBurnUp);
    // Both fixed windows too, for the reasons given on each accessor — neither reads the selector,
    // so neither needs to recompute when it changes.
    const spendTrend = memo(mySpendTrend);
    /**
     * The grid starts empty and is filled by selecting a shipment on the map or the schedule. A
     * shipment's lines are read over her filtered order book, delivered lines included: a shipment
     * is a live entity, and its lines were typically raised long before they were due.
     */
    const gridOrders = memo((scope: OrdersScope, selectedShipmentIds: string[]) =>
        ordersOnShipments(scope.orders, selectedShipmentIds)
    );
    const summary = memo((orders: PurchaseOrder[], scope: OrdersScope) => mySummary(orders, scope));
    const filterLabel = memo((ordersFilter: OrdersFilter) => {
        const parts = [
            ordersFilter.supplierId === ALL_FILTER ? undefined : SUPPLIER_NAMES.get(ordersFilter.supplierId),
            ordersFilter.subcategory === ALL_FILTER ? undefined : ordersFilter.subcategory,
        ].filter((part) => part != null);
        return parts.length > 0 ? parts.join(' · ') : undefined;
    });
    const kpis = memo(buildKpis);
    const spendPosition = memo(mySpendPosition);
    const spendKpis = memo((position: ReturnType<typeof mySpendPosition>, spendPeriod: SpendPeriod) =>
        buildSpendKpis({
            position,
            label: spendKpiLabel(spendPeriod),
            projectionLabel: spendProjectionLabel(spendPeriod),
        })
    );
    const gridSubtitle = memo((shownCount: number, selectedShipmentIds: string[]) => {
        if (selectedShipmentIds.length === 0) return 'No shipment selected.';
        // Delivered lines are included, so this cannot claim to be showing open lines.
        const on =
            selectedShipmentIds.length === 1
                ? selectedShipmentIds[0]
                : `${fmtInt(selectedShipmentIds.length)} shipments`;
        return `${fmtInt(shownCount)} of my order lines on ${on}`;
    });

    // The grid lists the selected shipments' lines, so a shipment the filters hide cannot stay selected.
    const onOrdersFilterChange = (change: Partial<OrdersFilter>) => {
        const next = { ...ordersFilter, ...change };
        const visible = new Set(myOrdersScope(next).shipments.map((shipment) => shipment.shipmentId));
        ordersFilter = next;
        selectedShipmentIds = selectedShipmentIds.filter((id) => visible.has(id));
        render();
    };

    const onShipmentSelectionChange = (added: string[], removed: string[]) => {
        selectedShipmentIds = applySelectionChange(selectedShipmentIds, added, removed);
        render();
    };

    const onSelectedSupplierChange = (supplierId: string | undefined) => {
        selectedSupplierId = supplierId;
        render();
    };

    // The worklist ignores the filters, so following an item clears any that hide its shipment.
    const onSelectAttention = (shipmentId: string) => {
        if (!ordersScope(ordersFilter).shipments.some((shipment) => shipment.shipmentId === shipmentId)) {
            ordersFilter = DEFAULT_ORDERS_FILTER;
        }
        selectedShipmentIds = [shipmentId];
        render();
    };

    /** Acting on an item resolves it in place. */
    const onResolveAttention = (item: AttentionItem, action: AttentionAction) => {
        resolved = { ...resolved, [item.itemId]: action.label };
        render();
    };

    /**
     * Recording a decision on a PO line also resolves the attention item that raised it, so the
     * worklist and the grid cannot disagree about whether something has been dealt with.
     */
    const onPoAction = (poId: string, kind: PoActionKind) => {
        poActions = { ...poActions, [poId]: kind };
        const shipmentId = shipmentCarryingOrder(poId);
        if (shipmentId != null) resolved = { ...resolved, [`shipment-${shipmentId}`]: kind };
        render();
    };

    const clearSelection = () => {
        selectedShipmentIds = [];
        render();
    };

    const tabs = createTabs({
        value: tab,
        onValueChange: (value) => {
            tab = value;
            render();
        },
        tabs: TABS.map((entry) => ({ value: entry.value, label: entry.label })),
        ariaLabel: 'Workspace views',
        rootClass: 'pc-app',
        listClass: 'pc-tabs-list',
        triggerClass: 'pc-tab-trigger',
        contentClass: 'pc-tab-content',
    });

    const pageTitle = h('h1', { class: 'pc-page-title' });
    const pageActions = h('div', { class: 'pc-page-actions' });
    const body = h(
        'div',
        { class: 'pc-body' },
        h(
            'div',
            { class: 'pc-view' },
            h('div', { class: 'pc-page-head' }, pageTitle, pageActions),
            ...TABS.map((entry) => tabs.content(entry.value))
        )
    );

    tabs.root.append(
        h(
            'aside',
            { class: 'pc-sidebar' },
            h(
                'div',
                { class: 'pc-brand-row' },
                h(
                    'span',
                    { class: 'pc-brand' },
                    svg(
                        'svg',
                        { class: 'pc-brand-mark', viewBox: '0 0 24 24', 'aria-hidden': 'true' },
                        svg('path', { d: 'M12 2.5 21 7v10l-9 4.5L3 17V7z', class: 'pc-brand-mark-box' }),
                        svg('path', { d: 'M3 7l9 4.5L21 7M12 11.5V21.5', class: 'pc-brand-mark-edge' })
                    ),
                    'Supply Desk'
                ),
                demoNotice()
            ),
            tabs.list,
            h('span', { class: 'pc-sidebar-spacer' }),
            helpCard(),
            sidebarActions(),
            h(
                'div',
                { class: 'pc-account' },
                // Titled because the name beside it is hidden in the collapsed layout.
                h('span', { class: 'pc-avatar', title: `${MANAGER.name} · ${MANAGER.title}` }, INITIALS),
                h(
                    'span',
                    { class: 'pc-account-text' },
                    h('span', { class: 'pc-account-name' }, MANAGER.name),
                    h('span', { class: 'pc-account-title' }, MANAGER.title)
                )
            )
        ),
        body
    );

    /**
     * The active tab's content. React unmounts a Tabs.Content's children when another tab is
     * selected, so switching tabs destroys the view (and its charts and grids) and creates the
     * new tab's view fresh: a tab's own state, such as the trend metric, starts over.
     */
    let scene: TabScene | undefined;
    let mounted = false;

    function periodRange(range: DateRange): string {
        // The dates the period resolves to, beside the control that sets it.
        return `${fmtDate(range.start)} – ${fmtDate(range.end)}`;
    }

    function ordersProps() {
        const scope = ordersScope(ordersFilter);
        const orders = gridOrders(scope, selectedShipmentIds);
        return {
            kpis: kpis(summary(spendOrders(spendRange(spendPeriod)), scope), filterLabel(ordersFilter)),
            shipments: scope.shipments,
            selectedShipmentIds,
            orders,
            gridSubtitle: gridSubtitle(orders.length, selectedShipmentIds),
            poActions,
            canClearSelection: selectedShipmentIds.length > 0,
        };
    }

    function suppliersProps() {
        const orders = supplierOrders(supplierRange(months));
        return {
            rows: scorecardRows(orders, months),
            supplierNames: SUPPLIER_NAMES,
            supplierColors: SUPPLIER_COLORS,
            selectedSupplierId,
            slipDistributions: slipDistributions(months),
            qualityCost: qualityCost(months),
            materialQualityCost: materialQualityCost(months),
            trend: supplierTrend(months),
        };
    }

    function spendProps() {
        const orders = spendOrders(spendRange(spendPeriod));
        const position = spendPosition(spendPeriod);
        return {
            kpis: spendKpis(position, spendPeriod),
            tree: tree(orders),
            supplierNames: SUPPLIER_NAMES,
            supplierColors: SUPPLIER_COLORS,
            shareRows: shareRows(orders),
            burnUp: burnUp(spendPeriod),
            spendPosition: position,
            spendTrend: spendTrend(spendPeriod),
            subcategories: SUBCATEGORIES[MANAGER.commodity],
        };
    }

    /**
     * The period control belongs to the tab it scopes, and the two tabs that have one do not
     * share a window — so it is rendered per tab rather than once for the workspace. The orders
     * tab has none: its KPIs follow the supplier and subcategory filters and its grid the shipment
     * selection, so there is nothing for a period to narrow.
     */
    function createScene(): TabScene {
        if (tab === 'suppliers') {
            const range = h('span', { class: 'pc-page-range' }, periodRange(supplierRange(months)));
            const select = createSelect({
                label: 'Period',
                ariaLabel: 'Trailing period my supplier performance is read over',
                value: String(months),
                onValueChange: (value) => {
                    months = Number(value) as PeriodMonths;
                    render();
                },
                options: PERIOD_OPTIONS.map((option) => ({ value: String(option), label: periodLabel(option) })),
            });
            const controls = h('div', { class: 'pc-page-controls' }, range, select.el);
            const view = createSuppliersView({ ...suppliersProps(), onSelectedSupplierChange });
            return { tab, controls, range, selects: [select], view };
        }
        if (tab === 'spend') {
            const range = h('span', { class: 'pc-page-range' }, periodRange(spendRange(spendPeriod)));
            const select = createSelect({
                label: 'Period',
                ariaLabel: 'Calendar period my spend is read over',
                value: spendPeriod,
                onValueChange: (value) => {
                    spendPeriod = value as SpendPeriod;
                    render();
                },
                options: SPEND_PERIOD_OPTIONS.map((option) => ({ value: option, label: spendPeriodLabel(option) })),
            });
            const controls = h('div', { class: 'pc-page-controls' }, range, select.el);
            const view = createSpendView(spendProps());
            return { tab, controls, range, selects: [select], view };
        }
        // Her landing view only: the worklist's items resolve into the order book and the grid
        // below it, so the alert lives where they land.
        const options = ordersFilterOptions(ordersFilter);
        const supplierSelect = createSelect({
            label: 'Supplier',
            ariaLabel: 'Supplier my orders are narrowed to',
            value: ordersFilter.supplierId,
            onValueChange: (supplierId) => onOrdersFilterChange({ supplierId }),
            options: options.suppliers,
        });
        const subcategorySelect = createSelect({
            label: 'Subcategory',
            ariaLabel: 'Material subcategory my orders are narrowed to',
            value: ordersFilter.subcategory,
            onValueChange: (subcategory) => onOrdersFilterChange({ subcategory }),
            options: options.subcategories,
        });
        const controls = h('div', { class: 'pc-page-controls' }, supplierSelect.el, subcategorySelect.el);
        const alert = createAttentionAlert({
            items: attentionItems(resolved),
            onSelect: onSelectAttention,
            onResolve: onResolveAttention,
        });
        const view = createOrdersView({
            ...ordersProps(),
            onShipmentSelectionChange,
            onPoAction,
            onClearSelection: clearSelection,
        });
        return { tab, controls, selects: [supplierSelect, subcategorySelect], alert, view };
    }

    function destroyScene(current: TabScene) {
        current.alert?.destroy();
        current.selects.forEach((select) => select.destroy());
        current.view.destroy();
        current.view.el.remove();
        current.controls?.remove();
        current.alert?.el.remove();
    }

    function render() {
        tabs.setValue(tab);
        pageTitle.textContent = TAB_LABELS.get(tab) ?? '';

        if (scene && scene.tab !== tab) {
            destroyScene(scene);
            scene = undefined;
        }
        if (!scene) {
            scene = createScene();
            if (scene.controls) pageActions.append(scene.controls);
            if (scene.alert) pageActions.append(scene.alert.el);
            tabs.content(tab).append(scene.view.el);
            // The tabs share one scroll region, so each would otherwise open at the last one's offset.
            body.scrollTo({ top: 0 });
            if (mounted) scene.view.mount();
            return;
        }

        // The same tab re-rendered: hand the views their new props, as React would.
        if (scene.tab === 'suppliers') {
            scene.range!.textContent = periodRange(supplierRange(months));
            scene.selects[0].setValue(String(months));
            (scene.view as SuppliersView).update(suppliersProps());
        } else if (scene.tab === 'spend') {
            scene.range!.textContent = periodRange(spendRange(spendPeriod));
            scene.selects[0].setValue(spendPeriod);
            (scene.view as SpendView).update(spendProps());
        } else {
            const options = ordersFilterOptions(ordersFilter);
            const [supplierSelect, subcategorySelect] = scene.selects;
            supplierSelect.setOptions(options.suppliers);
            supplierSelect.setValue(ordersFilter.supplierId);
            subcategorySelect.setOptions(options.subcategories);
            subcategorySelect.setValue(ordersFilter.subcategory);
            scene.alert!.update(attentionItems(resolved));
            (scene.view as OrdersView).update(ordersProps());
        }
    }

    render();

    return {
        el: tabs.root,
        mount() {
            mounted = true;
            scene?.view.mount();
        },
        destroy() {
            if (scene) destroyScene(scene);
            scene = undefined;
            mounted = false;
        },
    };
}
