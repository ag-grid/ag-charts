<script lang="ts">
import { supplierColors as buildSupplierColors } from './chartTheme';
import { SUBCATEGORIES } from './data';
import { fmtDate, fmtInt } from './format';
import type { AttentionAction, AttentionItem, PoActionKind } from './types';
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

/** The period controls speak option values (strings). */
const PERIOD_SELECT_OPTIONS = PERIOD_OPTIONS.map((option) => ({ value: String(option), label: periodLabel(option) }));
const SPEND_PERIOD_SELECT_OPTIONS = SPEND_PERIOD_OPTIONS.map((option) => ({
    value: option,
    label: spendPeriodLabel(option),
}));
</script>

<script setup lang="ts">
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui';
import { computed, ref, shallowRef, watch } from 'vue';

import AttentionAlert from './components/AttentionAlert.vue';
import DemoNotice from './components/DemoNotice.vue';
import HelpCard from './components/HelpCard.vue';
import { buildKpis, buildSpendKpis } from './components/KpiStrip.vue';
import OrdersView from './components/OrdersView.vue';
import SidebarActions from './components/SidebarActions.vue';
import SpendView from './components/SpendView.vue';
import SuppliersView from './components/SuppliersView.vue';
import Select from './ui/Select.vue';

const tab = ref<string>('orders');
const bodyRef = ref<HTMLDivElement>();
// The tabs share one scroll region, so each would otherwise open at the last one's offset.
watch(
    tab,
    () => {
        bodyRef.value?.scrollTo({ top: 0 });
    },
    { flush: 'post' }
);
/**
 * Selection is per tab, and deliberately does not travel.
 *
 * Each tab asks its own question over its own window: the orders tab is live freight, the
 * suppliers tab a trailing performance record, the spend tab a calendar period. A selection
 * carried across would rescope a grid on a tab the reader is not looking at — and the two
 * scopes rarely intersect, so it would as often empty a view as narrow it.
 */
const selectedShipmentIds = shallowRef<string[]>([]);
const selectedSupplierId = ref<string>();
/** Items she has acted on, and what she chose — resolved items leave the list. */
const resolved = shallowRef<Record<string, string>>({});
const poActions = shallowRef<Record<string, PoActionKind>>({});
/** The trailing window the suppliers tab's trends and commercial columns are read over. */
const months = ref<PeriodMonths>(DEFAULT_PERIOD);
/** The calendar window the spend tab is read over, and budgeted against. */
const spendPeriod = ref<SpendPeriod>(DEFAULT_SPEND_PERIOD);
/** The supplier and material subcategory the orders tab is narrowed to. */
const ordersFilter = shallowRef<OrdersFilter>(DEFAULT_ORDERS_FILTER);

// The controls speak option values (strings); the state is typed.
const monthsValue = computed({
    get: () => String(months.value),
    set: (value: string) => {
        months.value = Number(value) as PeriodMonths;
    },
});
const spendPeriodValue = computed({
    get: () => spendPeriod.value as string,
    set: (value: string) => {
        spendPeriod.value = value as SpendPeriod;
    },
});
const supplierFilterValue = computed({
    get: () => ordersFilter.value.supplierId,
    set: (supplierId: string) => onOrdersFilterChange({ supplierId }),
});
const subcategoryFilterValue = computed({
    get: () => ordersFilter.value.subcategory,
    set: (subcategory: string) => onOrdersFilterChange({ subcategory }),
});

const ordersScope = computed(() => myOrdersScope(ordersFilter.value));

/** Each filter's choices, led by the option that narrows nothing. */
const ordersFilterOptions = computed(() => {
    const { supplierIds, subcategories } = myOrdersFilterOptions(ordersFilter.value);
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

// The grid lists the selected shipments' lines, so a shipment the filters hide cannot stay selected.
function onOrdersFilterChange(change: Partial<OrdersFilter>) {
    const next = { ...ordersFilter.value, ...change };
    const visible = new Set(myOrdersScope(next).shipments.map((shipment) => shipment.shipmentId));
    ordersFilter.value = next;
    selectedShipmentIds.value = selectedShipmentIds.value.filter((id) => visible.has(id));
}

const supplierRange = computed(() => myPeriod(months.value));
const supplierOrders = computed(() => myOrdersInRange(supplierRange.value));

const spendRange = computed(() => mySpendPeriod(spendPeriod.value));
const spendOrders = computed(() => myOrdersInRange(spendRange.value));

function onShipmentSelectionChange(added: string[], removed: string[]) {
    selectedShipmentIds.value = applySelectionChange(selectedShipmentIds.value, added, removed);
}

// The worklist ignores the filters, so following an item clears any that hide its shipment.
function onSelectAttention(shipmentId: string) {
    if (!ordersScope.value.shipments.some((shipment) => shipment.shipmentId === shipmentId)) {
        ordersFilter.value = DEFAULT_ORDERS_FILTER;
    }
    selectedShipmentIds.value = [shipmentId];
}

/** Acting on an item resolves it in place. */
function onResolveAttention(item: AttentionItem, action: AttentionAction) {
    resolved.value = { ...resolved.value, [item.itemId]: action.label };
}

/**
 * Recording a decision on a PO line also resolves the attention item that raised it, so the
 * worklist and the grid cannot disagree about whether something has been dealt with.
 */
function onPoAction(poId: string, kind: PoActionKind) {
    poActions.value = { ...poActions.value, [poId]: kind };
    const shipmentId = shipmentCarryingOrder(poId);
    if (shipmentId != null) resolved.value = { ...resolved.value, [`shipment-${shipmentId}`]: kind };
}

function clearSelection() {
    selectedShipmentIds.value = [];
}

function onSelectedSupplierChange(supplierId: string | undefined) {
    selectedSupplierId.value = supplierId;
}

const attentionItems = computed(() => ALL_ATTENTION_ITEMS.filter((item) => resolved.value[item.itemId] == null));

const tree = computed(() => mySpendTree(spendOrders.value));

// The roster is never narrowed by the selected supplier — that would leave a single card,
// defeating the comparison it exists for. Selection dims the other cards instead.
const scorecardRows = computed(() => myScorecard(supplierOrders.value, MY_TRACKED_SHIPMENTS, months.value));

const slipDistributions = computed(() => mySlipDistributions(months.value));
const supplierTrend = computed(() => mySupplierTrend(months.value));
const qualityCost = computed(() => myQualityCost(months.value));
const materialQualityCost = computed(() => myMaterialQualityCost(months.value));

const shareRows = computed(() => mySupplierShare(spendOrders.value));
// Fixed to the current quarter, matching the allocation it is paced against.
const burnUp = computed(() => myBurnUp(spendPeriod.value));
// Both fixed windows too, for the reasons given on each accessor — neither reads the selector,
// so neither needs to recompute when it changes.
const spendTrend = computed(() => mySpendTrend(spendPeriod.value));

/**
 * The grid starts empty and is filled by selecting a shipment on the map or the schedule. A
 * shipment's lines are read over her filtered order book, delivered lines included: a shipment
 * is a live entity, and its lines were typically raised long before they were due.
 */
const gridOrders = computed(() => ordersOnShipments(ordersScope.value.orders, selectedShipmentIds.value));

const summary = computed(() => mySummary(spendOrders.value, ordersScope.value));
const filterLabel = computed(() => {
    const filter = ordersFilter.value;
    const parts = [
        filter.supplierId === ALL_FILTER ? undefined : SUPPLIER_NAMES.get(filter.supplierId),
        filter.subcategory === ALL_FILTER ? undefined : filter.subcategory,
    ].filter((part) => part != null);
    return parts.length > 0 ? parts.join(' · ') : undefined;
});
const kpis = computed(() => buildKpis(summary.value, filterLabel.value));
const spendPosition = computed(() => mySpendPosition(spendPeriod.value));
const spendKpis = computed(() =>
    buildSpendKpis({
        position: spendPosition.value,
        label: spendKpiLabel(spendPeriod.value),
        projectionLabel: spendProjectionLabel(spendPeriod.value),
    })
);
const gridSubtitle = computed(() => {
    const ids = selectedShipmentIds.value;
    if (ids.length === 0) return 'No shipment selected.';
    // Delivered lines are included, so this cannot claim to be showing open lines.
    const on = ids.length === 1 ? ids[0] : `${fmtInt(ids.length)} shipments`;
    return `${fmtInt(gridOrders.value.length)} of my order lines on ${on}`;
});
</script>

<template>
    <TabsRoot v-model="tab" class="pc-app" orientation="vertical">
        <aside class="pc-sidebar">
            <div class="pc-brand-row">
                <span class="pc-brand">
                    <svg class="pc-brand-mark" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 2.5 21 7v10l-9 4.5L3 17V7z" class="pc-brand-mark-box" />
                        <path d="M3 7l9 4.5L21 7M12 11.5V21.5" class="pc-brand-mark-edge" />
                    </svg>
                    Supply Desk
                </span>
                <DemoNotice />
            </div>
            <TabsList class="pc-tabs-list" aria-label="Workspace views">
                <TabsTrigger v-for="entry in TABS" :key="entry.value" class="pc-tab-trigger" :value="entry.value">
                    {{ entry.label }}
                </TabsTrigger>
            </TabsList>
            <span class="pc-sidebar-spacer" />
            <HelpCard />
            <SidebarActions />
            <div class="pc-account">
                <!-- Titled because the name beside it is hidden in the collapsed layout. -->
                <span class="pc-avatar" :title="`${MANAGER.name} · ${MANAGER.title}`">{{ INITIALS }}</span>
                <span class="pc-account-text">
                    <span class="pc-account-name">{{ MANAGER.name }}</span>
                    <span class="pc-account-title">{{ MANAGER.title }}</span>
                </span>
            </div>
        </aside>

        <div ref="bodyRef" class="pc-body">
            <div class="pc-view">
                <div class="pc-page-head">
                    <h1 class="pc-page-title">{{ TAB_LABELS.get(tab) ?? '' }}</h1>
                    <div class="pc-page-actions">
                        <!--
                            The period control belongs to the tab it scopes, and the two tabs that
                            have one do not share a window — so it is rendered per tab rather than
                            once for the workspace. The orders tab has none: its KPIs follow the
                            supplier and subcategory filters and its grid the shipment selection,
                            so there is nothing for a period to narrow.
                        -->
                        <div v-if="tab === 'suppliers'" class="pc-page-controls">
                            <!-- The dates the period resolves to, beside the control that sets it. -->
                            <span
                                class="pc-page-range"
                                v-text="`${fmtDate(supplierRange.start)} – ${fmtDate(supplierRange.end)}`"
                            />
                            <Select
                                v-model="monthsValue"
                                label="Period"
                                aria-label="Trailing period my supplier performance is read over"
                                :options="PERIOD_SELECT_OPTIONS"
                            />
                        </div>
                        <div v-if="tab === 'spend'" class="pc-page-controls">
                            <span
                                class="pc-page-range"
                                v-text="`${fmtDate(spendRange.start)} – ${fmtDate(spendRange.end)}`"
                            />
                            <Select
                                v-model="spendPeriodValue"
                                label="Period"
                                aria-label="Calendar period my spend is read over"
                                :options="SPEND_PERIOD_SELECT_OPTIONS"
                            />
                        </div>
                        <!-- Her landing view only: the worklist's items resolve into the order
                             book and the grid below it, so the alert lives where they land. -->
                        <template v-if="tab === 'orders'">
                            <div class="pc-page-controls">
                                <Select
                                    v-model="supplierFilterValue"
                                    label="Supplier"
                                    aria-label="Supplier my orders are narrowed to"
                                    :options="ordersFilterOptions.suppliers"
                                />
                                <Select
                                    v-model="subcategoryFilterValue"
                                    label="Subcategory"
                                    aria-label="Material subcategory my orders are narrowed to"
                                    :options="ordersFilterOptions.subcategories"
                                />
                            </div>
                            <AttentionAlert
                                :items="attentionItems"
                                @select="onSelectAttention"
                                @resolve="onResolveAttention"
                            />
                        </template>
                    </div>
                </div>

                <TabsContent class="pc-tab-content" value="orders">
                    <OrdersView
                        :kpis="kpis"
                        :shipments="ordersScope.shipments"
                        :selected-shipment-ids="selectedShipmentIds"
                        :orders="gridOrders"
                        :grid-subtitle="gridSubtitle"
                        :po-actions="poActions"
                        :can-clear-selection="selectedShipmentIds.length > 0"
                        @shipment-selection-change="onShipmentSelectionChange"
                        @po-action="onPoAction"
                        @clear-selection="clearSelection"
                    />
                </TabsContent>

                <TabsContent class="pc-tab-content" value="suppliers">
                    <SuppliersView
                        :rows="scorecardRows"
                        :supplier-names="SUPPLIER_NAMES"
                        :supplier-colors="SUPPLIER_COLORS"
                        :selected-supplier-id="selectedSupplierId"
                        :slip-distributions="slipDistributions"
                        :quality-cost="qualityCost"
                        :material-quality-cost="materialQualityCost"
                        :trend="supplierTrend"
                        @selected-supplier-change="onSelectedSupplierChange"
                    />
                </TabsContent>

                <TabsContent class="pc-tab-content" value="spend">
                    <SpendView
                        :kpis="spendKpis"
                        :tree="tree"
                        :supplier-names="SUPPLIER_NAMES"
                        :supplier-colors="SUPPLIER_COLORS"
                        :share-rows="shareRows"
                        :burn-up="burnUp"
                        :spend-position="spendPosition"
                        :spend-trend="spendTrend"
                        :subcategories="SUBCATEGORIES[MANAGER.commodity]"
                    />
                </TabsContent>
            </div>
        </div>
    </TabsRoot>
</template>
