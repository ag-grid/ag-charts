import { supplierColors as buildSupplierColors } from './chartTheme';
import { type AttentionAlert, createAttentionAlert } from './components/AttentionAlert';
import { buildKpis, buildSpendKpis } from './components/KpiStrip';
import { type OrdersView, createOrdersView } from './components/OrdersView';
import { type SpendView, createSpendView } from './components/SpendView';
import { type SuppliersView, createSuppliersView } from './components/SuppliersView';
import { DEMO_NOW, SUBCATEGORIES } from './data';
import { type View, h, svg } from './dom';
import { fmtDate, fmtInt } from './format';
import { memo } from './memo';
import type { AttentionAction, AttentionItem, DateRange, PoActionKind } from './types';
import { type Select, createSelect, createTabs } from './ui';
import {
    DEFAULT_PERIOD,
    DEFAULT_SPEND_PERIOD,
    MANAGER,
    MY_OPEN_ORDERS,
    MY_ORDERS,
    MY_SUPPLIERS,
    MY_TRACKED_SHIPMENTS,
    PERIOD_OPTIONS,
    type PeriodMonths,
    SPEND_PERIOD_OPTIONS,
    type SpendPeriod,
    myAttentionItems,
    myBurnUp,
    myOrdersInRange,
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
    ordersOnShipment,
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
 * When the dataset is current to. Fixed, because the data is: a moving wall-clock stamp would
 * claim a freshness the workspace does not have.
 */
const DATA_AS_OF = fmtDate(DEMO_NOW);

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
    select?: Select;
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
    let selectedShipmentId: string | undefined;
    let selectedSupplierId: string | undefined;
    /** Items she has acted on, and what she chose — resolved items leave the list. */
    let resolved: Record<string, string> = {};
    let poActions: Record<string, PoActionKind> = {};
    /** The trailing window the suppliers tab's trends and commercial columns are read over. */
    let months: PeriodMonths = DEFAULT_PERIOD;
    /** The calendar window the spend tab is read over, and budgeted against. */
    let spendPeriod: SpendPeriod = DEFAULT_SPEND_PERIOD;

    // The React `useMemo`s: each recomputes only when its inputs change identity.
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
    const scorecardRows = memo((orders: ReturnType<typeof myOrdersInRange>, months: PeriodMonths) =>
        myScorecard(orders, MY_TRACKED_SHIPMENTS, months)
    );
    const slipDistributions = memo(mySlipDistributions);
    const supplierTrend = memo(mySupplierTrend);
    const qualityCost = memo(myQualityCost);
    const shareRows = memo(mySupplierShare);
    // Fixed to the current quarter, matching the allocation it is paced against.
    const burnUp = memo(myBurnUp);
    // Both fixed windows too, for the reasons given on each accessor — neither reads the selector,
    // so neither needs to recompute when it changes.
    const spendTrend = memo(mySpendTrend);
    /**
     * A selected shipment scopes the grid over her whole order book rather than her open lines: a
     * shipment is a live entity, and its lines were typically raised long before the tab's default
     * view of what is still outstanding.
     */
    const gridOrders = memo((selectedShipmentId: string | undefined) =>
        selectedShipmentId == null ? MY_OPEN_ORDERS : ordersOnShipment(MY_ORDERS, selectedShipmentId)
    );
    const summary = memo(mySummary);
    const kpis = memo(buildKpis);
    const spendPosition = memo(mySpendPosition);
    const spendKpis = memo((position: ReturnType<typeof mySpendPosition>, spendPeriod: SpendPeriod) =>
        buildSpendKpis({
            position,
            label: spendKpiLabel(spendPeriod),
            projectionLabel: spendProjectionLabel(spendPeriod),
        })
    );
    const gridSubtitle = memo((shownCount: number, selectedShipmentId: string | undefined) => {
        const shown = fmtInt(shownCount);
        // A shipment's lines are read over her whole order book, delivered ones included, so this
        // one cannot claim to be showing open lines.
        return selectedShipmentId == null
            ? `${shown} of my open order lines`
            : `${shown} of my order lines on ${selectedShipmentId}`;
    });

    // Selecting the same thing again clears it, on both tabs.
    const onSelectSupplier = (supplierId: string) => {
        selectedSupplierId = selectedSupplierId === supplierId ? undefined : supplierId;
        render();
    };

    const onSelectShipment = (shipmentId: string) => {
        selectedShipmentId = selectedShipmentId === shipmentId ? undefined : shipmentId;
        render();
    };

    // The worklist sits on the orders tab, so following an item selects within it.
    const onSelectAttention = (shipmentId: string) => {
        selectedShipmentId = shipmentId;
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
        selectedShipmentId = undefined;
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

    tabs.root.append(
        h(
            'aside',
            { class: 'pc-sidebar' },
            h(
                'span',
                { class: 'pc-brand' },
                svg(
                    'svg',
                    { class: 'pc-brand-mark', viewBox: '0 0 24 24', 'aria-hidden': 'true' },
                    svg('path', { d: 'M12 2.5 21 7v10l-9 4.5L3 17V7z', class: 'pc-brand-mark-box' }),
                    svg('path', { d: 'M3 7l9 4.5L21 7M12 11.5V21.5', class: 'pc-brand-mark-edge' })
                ),
                'Procurement Workspace'
            ),
            tabs.list,
            h('span', { class: 'pc-sidebar-spacer' }),
            h('span', { class: 'pc-stamp' }, `Data as of ${DATA_AS_OF}`),
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
        h(
            'div',
            { class: 'pc-body' },
            h(
                'div',
                { class: 'pc-view' },
                h('div', { class: 'pc-page-head' }, pageTitle, pageActions),
                ...TABS.map((entry) => tabs.content(entry.value))
            )
        )
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
        const orders = gridOrders(selectedShipmentId);
        return {
            kpis: kpis(summary(spendOrders(spendRange(spendPeriod)))),
            shipments: MY_TRACKED_SHIPMENTS,
            selectedShipmentId,
            orders,
            gridSubtitle: gridSubtitle(orders.length, selectedShipmentId),
            poActions,
            canClearSelection: selectedShipmentId != null,
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
     * tab has none: its grid is her open order book and its KPIs are absolute, so there is
     * nothing for a period to narrow.
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
            const view = createSuppliersView({ ...suppliersProps(), onSelectSupplier });
            return { tab, controls, select, view };
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
            return { tab, controls, select, view };
        }
        // Her landing view only: the worklist's items resolve into the order book and the grid
        // below it, so the alert lives where they land.
        const alert = createAttentionAlert({
            items: attentionItems(resolved),
            onSelect: onSelectAttention,
            onResolve: onResolveAttention,
        });
        const view = createOrdersView({
            ...ordersProps(),
            onSelectShipment,
            onPoAction,
            onClearSelection: clearSelection,
        });
        return { tab, alert, view };
    }

    function destroyScene(current: TabScene) {
        current.alert?.destroy();
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
            if (mounted) scene.view.mount();
            return;
        }

        // The same tab re-rendered: hand the views their new props, as React would.
        if (scene.tab === 'suppliers') {
            scene.controls!.firstElementChild!.textContent = periodRange(supplierRange(months));
            scene.select!.setValue(String(months));
            (scene.view as SuppliersView).update(suppliersProps());
        } else if (scene.tab === 'spend') {
            scene.controls!.firstElementChild!.textContent = periodRange(spendRange(spendPeriod));
            scene.select!.setValue(spendPeriod);
            (scene.view as SpendView).update(spendProps());
        } else {
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
