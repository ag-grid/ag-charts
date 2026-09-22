import { Component, computed, inject, signal } from '@angular/core';

import { supplierColors as buildSupplierColors } from './chartTheme';
import { AttentionAlert, type AttentionResolution } from './components/attention-alert';
import { buildKpis, buildSpendKpis } from './components/kpi-strip';
import { OrdersView } from './components/orders-view';
import { type PoAction } from './components/purchase-order-grid';
import { SpendView } from './components/spend-view';
import { SuppliersView } from './components/suppliers-view';
import { DEMO_NOW, SUBCATEGORIES } from './data';
import { fmtDate, fmtInt } from './format';
import type { PoActionKind } from './types';
import { Select, TabContent, TabTrigger, Tabs, TabsList } from './ui';
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

const PERIOD_SELECT_OPTIONS = PERIOD_OPTIONS.map((option) => ({ value: String(option), label: periodLabel(option) }));
const SPEND_PERIOD_SELECT_OPTIONS = SPEND_PERIOD_OPTIONS.map((option) => ({
    value: option,
    label: spendPeriodLabel(option),
}));

/**
 * The React `WorkspaceApp`: its root, the Radix `Tabs.Root` rendered as `.pc-app`, is this
 * component's host, with the `Tabs` directive on it holding the selected tab.
 */
@Component({
    selector: 'div[pcWorkspaceApp]',
    imports: [AttentionAlert, OrdersView, Select, SpendView, SuppliersView, TabContent, TabTrigger, TabsList],
    hostDirectives: [Tabs],
    host: { class: 'pc-app' },
    template: `
        <aside class="pc-sidebar">
            <span class="pc-brand"
                ><svg class="pc-brand-mark" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2.5 21 7v10l-9 4.5L3 17V7z" class="pc-brand-mark-box" />
                    <path d="M3 7l9 4.5L21 7M12 11.5V21.5" class="pc-brand-mark-edge" />
                </svg>
                Procurement Workspace</span
            >
            <div pcTabsList class="pc-tabs-list" aria-label="Workspace views">
                @for (entry of tabs; track entry.value) {
                    <button pcTabTrigger class="pc-tab-trigger" [value]="entry.value">{{ entry.label }}</button>
                }
            </div>
            <span class="pc-sidebar-spacer"></span>
            <span class="pc-stamp">Data as of {{ dataAsOf }}</span>
            <div class="pc-account">
                <!-- Titled because the name beside it is hidden in the collapsed layout. -->
                <span class="pc-avatar" [title]="manager.name + ' · ' + manager.title">{{ initials }}</span>
                <span class="pc-account-text">
                    <span class="pc-account-name">{{ manager.name }}</span>
                    <span class="pc-account-title">{{ manager.title }}</span>
                </span>
            </div>
        </aside>

        <div class="pc-body">
            <div class="pc-view">
                <div class="pc-page-head">
                    <h1 class="pc-page-title">{{ pageTitle() }}</h1>
                    <div class="pc-page-actions">
                        <!--
                            The period control belongs to the tab it scopes, and the two tabs that
                            have one do not share a window — so it is rendered per tab rather than
                            once for the workspace. The orders tab has none: its grid is her open
                            order book and its KPIs are absolute, so there is nothing for a period
                            to narrow.
                        -->
                        @if (tab() === 'suppliers') {
                            <div class="pc-page-controls">
                                <!-- The dates the period resolves to, beside the control that sets it. -->
                                <span class="pc-page-range"
                                    >{{ fmtDate(supplierRange().start) }} – {{ fmtDate(supplierRange().end) }}</span
                                >
                                <label
                                    pcSelect
                                    label="Period"
                                    ariaLabel="Trailing period my supplier performance is read over"
                                    [value]="String(months())"
                                    (valueChange)="setMonths($event)"
                                    [options]="periodOptions"
                                ></label>
                            </div>
                        }
                        @if (tab() === 'spend') {
                            <div class="pc-page-controls">
                                <span class="pc-page-range"
                                    >{{ fmtDate(spendRange().start) }} – {{ fmtDate(spendRange().end) }}</span
                                >
                                <label
                                    pcSelect
                                    label="Period"
                                    ariaLabel="Calendar period my spend is read over"
                                    [value]="spendPeriod()"
                                    (valueChange)="setSpendPeriod($event)"
                                    [options]="spendPeriodOptions"
                                ></label>
                            </div>
                        }
                        <!-- Her landing view only: the worklist's items resolve into the order
                            book and the grid below it, so the alert lives where they land. -->
                        @if (tab() === 'orders') {
                            <div
                                pcAttentionAlert
                                [items]="attentionItems()"
                                (select)="onSelectAttention($event)"
                                (resolve)="onResolveAttention($event)"
                            ></div>
                        }
                    </div>
                </div>

                <!-- Radix unmounts the content of the tabs that are not selected; only the selected panel renders. -->
                @if (tab() === 'orders') {
                    <div pcTabContent class="pc-tab-content" value="orders">
                        <div
                            pcOrdersView
                            [kpis]="kpis()"
                            [shipments]="trackedShipments"
                            [selectedShipmentId]="selectedShipmentId()"
                            (selectShipment)="onSelectShipment($event)"
                            [orders]="gridOrders()"
                            [gridSubtitle]="gridSubtitle()"
                            [poActions]="poActions()"
                            (poAction)="onPoAction($event)"
                            (clearSelection)="clearSelection()"
                            [canClearSelection]="selectedShipmentId() != null"
                        ></div>
                    </div>
                }

                @if (tab() === 'suppliers') {
                    <div pcTabContent class="pc-tab-content" value="suppliers">
                        <div
                            pcSuppliersView
                            [rows]="scorecardRows()"
                            [supplierNames]="supplierNames"
                            [supplierColors]="supplierColors"
                            [selectedSupplierId]="selectedSupplierId()"
                            (selectSupplier)="onSelectSupplier($event)"
                            [slipDistributions]="slipDistributions()"
                            [qualityCost]="qualityCost()"
                            [trend]="supplierTrend()"
                        ></div>
                    </div>
                }

                @if (tab() === 'spend') {
                    <div pcTabContent class="pc-tab-content" value="spend">
                        <div
                            pcSpendView
                            [kpis]="spendKpis()"
                            [tree]="tree()"
                            [supplierNames]="supplierNames"
                            [supplierColors]="supplierColors"
                            [shareRows]="shareRows()"
                            [burnUp]="burnUp()"
                            [spendPosition]="spendPosition()"
                            [spendTrend]="spendTrend()"
                            [subcategories]="subcategories"
                        ></div>
                    </div>
                }
            </div>
        </div>
    `,
})
export class WorkspaceApp {
    protected readonly tabs = TABS;
    protected readonly manager = MANAGER;
    protected readonly initials = INITIALS;
    protected readonly dataAsOf = DATA_AS_OF;
    protected readonly trackedShipments = MY_TRACKED_SHIPMENTS;
    protected readonly supplierNames = SUPPLIER_NAMES;
    protected readonly supplierColors = SUPPLIER_COLORS;
    protected readonly subcategories = SUBCATEGORIES[MANAGER.commodity];
    protected readonly periodOptions = PERIOD_SELECT_OPTIONS;
    protected readonly spendPeriodOptions = SPEND_PERIOD_SELECT_OPTIONS;
    protected readonly fmtDate = fmtDate;
    protected readonly String = String;

    /** The selected tab, held by the `Tabs` host directive so the tab list and panels can read it. */
    protected readonly tab = inject(Tabs).value;
    /**
     * Selection is per tab, and deliberately does not travel.
     *
     * Each tab asks its own question over its own window: the orders tab is live freight, the
     * suppliers tab a trailing performance record, the spend tab a calendar period. A selection
     * carried across would rescope a grid on a tab the reader is not looking at — and the two
     * scopes rarely intersect, so it would as often empty a view as narrow it.
     */
    protected readonly selectedShipmentId = signal<string | undefined>(undefined);
    protected readonly selectedSupplierId = signal<string | undefined>(undefined);
    /** Items she has acted on, and what she chose — resolved items leave the list. */
    private readonly resolved = signal<Record<string, string>>({});
    protected readonly poActions = signal<Record<string, PoActionKind>>({});
    /** The trailing window the suppliers tab's trends and commercial columns are read over. */
    protected readonly months = signal<PeriodMonths>(DEFAULT_PERIOD);
    /** The calendar window the spend tab is read over, and budgeted against. */
    protected readonly spendPeriod = signal<SpendPeriod>(DEFAULT_SPEND_PERIOD);

    protected readonly pageTitle = computed(() => TAB_LABELS.get(this.tab()) ?? '');

    protected readonly supplierRange = computed(() => myPeriod(this.months()));
    private readonly supplierOrders = computed(() => myOrdersInRange(this.supplierRange()));

    protected readonly spendRange = computed(() => mySpendPeriod(this.spendPeriod()));
    private readonly spendOrders = computed(() => myOrdersInRange(this.spendRange()));

    protected readonly attentionItems = computed(() => {
        const resolved = this.resolved();
        return ALL_ATTENTION_ITEMS.filter((item) => resolved[item.itemId] == null);
    });

    protected readonly tree = computed(() => mySpendTree(this.spendOrders()));

    // The roster is never narrowed by the selected supplier — that would leave a single card,
    // defeating the comparison it exists for. Selection dims the other cards instead.
    protected readonly scorecardRows = computed(() =>
        myScorecard(this.supplierOrders(), MY_TRACKED_SHIPMENTS, this.months())
    );

    protected readonly slipDistributions = computed(() => mySlipDistributions(this.months()));
    protected readonly supplierTrend = computed(() => mySupplierTrend(this.months()));
    protected readonly qualityCost = computed(() => myQualityCost(this.months()));

    protected readonly shareRows = computed(() => mySupplierShare(this.spendOrders()));
    // Fixed to the current quarter, matching the allocation it is paced against.
    protected readonly burnUp = computed(() => myBurnUp(this.spendPeriod()));
    // Both fixed windows too, for the reasons given on each accessor — neither reads the selector,
    // so neither needs to recompute when it changes.
    protected readonly spendTrend = computed(() => mySpendTrend(this.spendPeriod()));

    /**
     * A selected shipment scopes the grid over her whole order book rather than her open lines: a
     * shipment is a live entity, and its lines were typically raised long before the tab's default
     * view of what is still outstanding.
     */
    protected readonly gridOrders = computed(() => {
        const selectedShipmentId = this.selectedShipmentId();
        return selectedShipmentId == null ? MY_OPEN_ORDERS : ordersOnShipment(MY_ORDERS, selectedShipmentId);
    });

    private readonly summary = computed(() => mySummary(this.spendOrders()));
    protected readonly kpis = computed(() => buildKpis(this.summary()));
    protected readonly spendPosition = computed(() => mySpendPosition(this.spendPeriod()));
    protected readonly spendKpis = computed(() =>
        buildSpendKpis({
            position: this.spendPosition(),
            label: spendKpiLabel(this.spendPeriod()),
            projectionLabel: spendProjectionLabel(this.spendPeriod()),
        })
    );
    protected readonly gridSubtitle = computed(() => {
        const shown = fmtInt(this.gridOrders().length);
        const selectedShipmentId = this.selectedShipmentId();
        // A shipment's lines are read over her whole order book, delivered ones included, so this
        // one cannot claim to be showing open lines.
        return selectedShipmentId == null
            ? `${shown} of my open order lines`
            : `${shown} of my order lines on ${selectedShipmentId}`;
    });

    constructor() {
        this.tab.set('orders');
    }

    // Selecting the same thing again clears it, on both tabs.
    protected onSelectSupplier(supplierId: string): void {
        this.selectedSupplierId.update((prev) => (prev === supplierId ? undefined : supplierId));
    }

    protected onSelectShipment(shipmentId: string): void {
        this.selectedShipmentId.update((prev) => (prev === shipmentId ? undefined : shipmentId));
    }

    // The worklist sits on the orders tab, so following an item selects within it.
    protected onSelectAttention(shipmentId: string): void {
        this.selectedShipmentId.set(shipmentId);
    }

    /** Acting on an item resolves it in place. */
    protected onResolveAttention({ item, action }: AttentionResolution): void {
        this.resolved.update((prev) => ({ ...prev, [item.itemId]: action.label }));
    }

    /**
     * Recording a decision on a PO line also resolves the attention item that raised it, so the
     * worklist and the grid cannot disagree about whether something has been dealt with.
     */
    protected onPoAction({ poId, kind }: PoAction): void {
        this.poActions.update((prev) => ({ ...prev, [poId]: kind }));
        const shipmentId = shipmentCarryingOrder(poId);
        if (shipmentId != null) this.resolved.update((prev) => ({ ...prev, [`shipment-${shipmentId}`]: kind }));
    }

    protected clearSelection(): void {
        this.selectedShipmentId.set(undefined);
    }

    protected setMonths(value: string): void {
        this.months.set(Number(value) as PeriodMonths);
    }

    protected setSpendPeriod(value: string): void {
        this.spendPeriod.set(value as SpendPeriod);
    }
}
