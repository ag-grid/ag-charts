// The commodity manager's data-access layer.
//
// This is where "my commodity's data" is defined. `data.ts` holds the whole book across
// every commodity; nothing in the UI reads it directly. A workspace is resolved for one
// manager, and every accessor here returns only records inside that manager's remit — her
// commodity, bought from her assigned suppliers — so there is no state in which her views hold
// someone else's orders, and no filter that could be cleared to widen the scope.
//
// The org-wide roll-up the spec puts out of scope would be a second access layer beside
// this one, over the same generated data: a different query, not a different app.
import {
    ALL_ORDERS,
    COMMODITY_BUDGETS,
    COMMODITY_MANAGERS,
    CURRENT_QUARTER,
    CURRENT_QUARTER_FULL,
    DEMO_NOW,
    ON_TIME_TARGET,
    RANGE_PRESETS,
    SUPPLIER_BY_ID,
    YEAR_START,
    buildSpendTree,
    calendarDaysBetween,
    daysBetween,
    deliveredInRange,
    inRange,
    monthBuckets,
    qualityCost,
    scorecard,
    shipmentsCarrying,
    slipDistributions,
    spendBurnUp,
    spendByBucketAndSubcategory,
    sumSpend,
    supplierShareBySubcategory,
    supplierTrendByMonth,
    trackShipment,
    trailingMonths,
    weekBuckets,
} from './data';
import type {
    AttentionItem,
    BurnUpPoint,
    CommodityManager,
    DateRange,
    MonthBucket,
    PurchaseOrder,
    QualityCost,
    Shipment,
    ShipmentStatus,
    SlipDistribution,
    SpendNode,
    SpendTrend,
    Supplier,
    SupplierScorecard,
    SupplierShareRow,
    SupplierTrendPoint,
    TrackedShipment,
} from './types';

/**
 * The signed-in commodity manager.
 *
 * A real deployment resolves this from the session; the demo pins it, which is the point —
 * the workspace has no notion of choosing whose data to look at.
 */
const CURRENT_MANAGER_ID = 'priya-chen';

export const MANAGER: CommodityManager = COMMODITY_MANAGERS.find(
    (manager) => manager.managerId === CURRENT_MANAGER_ID
)!;

/** Her suppliers, in assignment order — the roster the whole workspace is built around. */
export const MY_SUPPLIERS: Supplier[] = MANAGER.supplierIds.map((id) => SUPPLIER_BY_ID.get(id)!);

const OWNED_SUPPLIER_IDS = new Set(MANAGER.supplierIds);

/**
 * Her order book. Scoped once, here, by both halves of her remit — every other accessor and
 * every view works from this, so the scope cannot be bypassed or widened downstream.
 *
 * Supplier assignment alone is not the scope. The catalogue approves a supplier per material, so
 * nothing stops one being approved under two commodities, and a manager owns *her commodity's*
 * business with her suppliers, not everything those suppliers sell the company. Filtering on the
 * assignment alone would let another commodity's lines into her KPIs and her spend hierarchy,
 * where they have no budget to sit against.
 */
export const MY_ORDERS: PurchaseOrder[] = ALL_ORDERS.filter(
    (order) => OWNED_SUPPLIER_IDS.has(order.supplierId) && order.commodity === MANAGER.commodity
);

/**
 * Her active shipments, and the lines of hers each carries.
 *
 * Derived from her order book rather than picked out of the feed by supplier: a shipment is
 * visible because it is carrying material she is accountable for, and it reports only her lines
 * on it. Selecting on supplier instead would surface a consolidated movement of another
 * commodity's material and quote its value in her views.
 */
const { shipments: MY_SHIPMENT_LIST, poIdsByShipment: MY_PO_IDS_BY_SHIPMENT } = shipmentsCarrying(MY_ORDERS);

export const MY_SHIPMENTS: Shipment[] = MY_SHIPMENT_LIST;

/**
 * Her active shipments, each placed on its route.
 *
 * Derived once: the dataset is static, so every position, progress fraction and day count is fixed
 * at `DEMO_NOW`. Nothing here changes after load, which is why the views can treat it as a constant
 * rather than as feed state.
 */
export const MY_TRACKED_SHIPMENTS: TrackedShipment[] = MY_SHIPMENTS.map((shipment) =>
    trackShipment(shipment, DEMO_NOW.getTime())
);

export const MY_BUDGET = COMMODITY_BUDGETS[MANAGER.commodity];

/** Her orders raised within `range`. */
export const myOrdersInRange = (range: DateRange) => inRange(MY_ORDERS, range);

/**
 * Her order lines not yet delivered — the scope of the orders tab's grid.
 *
 * Deliberately not date-scoped. That tab is her daily check: what it has to show is everything
 * still in flight, and a line raised eight months ago that has not landed is exactly the line she
 * most needs in front of her. Delivered history is read on the suppliers and spend tabs, both of
 * which have a period control to scope it with.
 */
export const MY_OPEN_ORDERS = MY_ORDERS.filter((order) => order.actualDate == null);

/** Her spend hierarchy for a period: commodity → subcategory → supplier. */
export const mySpendTree = (orders: PurchaseOrder[]): SpendNode =>
    buildSpendTree(MANAGER.commodity, orders, MANAGER.supplierIds);

/**
 * Her supplier roster: commercial figures for the selected period, delivery performance over
 * a rolling twelve months.
 *
 * The split is deliberate and is how a supplier scorecard actually works. Steel lead times run
 * to six weeks, so almost nothing ordered inside one quarter has been delivered inside it —
 * reading on-time performance off the period would rest it on a handful of deliveries and
 * swing it wildly whenever she changed the period. Spend and volume are the opposite: they
 * are about what she is committing now.
 */
export function myScorecard(
    periodOrders: PurchaseOrder[],
    shipments: Shipment[],
    months: PeriodMonths
): SupplierScorecard[] {
    // Delivery performance is measured on receipt, so this window is scoped by delivery date.
    const delivered = deliveredInRange(MY_ORDERS, trailingMonths(months));
    return scorecard(periodOrders, delivered, MANAGER.supplierIds, shipments);
}

/**
 * Her order lines on one shipment.
 *
 * The orders tab's only selection, and the only one in the workspace that narrows a grid. A
 * selection made on the suppliers or spend tab stays there: each tab answers its own question over
 * its own window, and a selection carried across would silently rescope a grid the reader is not
 * looking at. Note this only ever narrows within her scope — it can never reach another manager's
 * records, because `orders` is already hers.
 */
export function ordersOnShipment(orders: PurchaseOrder[], shipmentId: string): PurchaseOrder[] {
    const poIds = MY_PO_IDS_BY_SHIPMENT.get(shipmentId);
    return poIds == null ? [] : orders.filter((order) => poIds.has(order.poId));
}

/**
 * The shipment carrying one of her order lines, if any.
 *
 * The reverse of `ordersOnShipment`, and scoped the same way: a PO id outside her book resolves
 * to nothing rather than naming someone else's movement.
 */
export function shipmentCarryingOrder(poId: string): string | undefined {
    for (const [shipmentId, poIds] of MY_PO_IDS_BY_SHIPMENT) {
        if (poIds.has(poId)) return shipmentId;
    }
    return undefined;
}

// --- her scorecard figures ----------------------------------------------------

/**
 * The window the headline on-time rate is measured over — fixed, because the tile lives on the
 * orders tab, which has no period control. Matches `DEFAULT_PERIOD`, so the headline and the
 * supplier cards quote the same rate as the workspace opens.
 */
const PERFORMANCE_MONTHS: PeriodMonths = 12;

export interface MySummary {
    /** Spend on her orders raised since 1 January. */
    spendYtd: number;
    /** `spendYtd` as a share of her commodity's annual budget. */
    annualBudgetUsed: number;
    /** Spend on her orders raised this quarter. */
    spendQuarter: number;
    /** `spendQuarter` as a share of her commodity's quarterly budget. */
    quarterBudgetUsed: number;
    /** Her orders not yet delivered. */
    openOrders: number;
    /**
     * Delivered-on-time over delivered, scoped by *delivery* date over `PERFORMANCE_MONTHS` — the
     * same basis the scorecard measures each supplier on, so the headline and the cards agree.
     */
    onTimeRate: number;
    deliveredCount: number;
    /** Her active shipments flagged at risk or late. */
    atRiskShipments: number;
    /** Every active shipment by status, so the at-risk figure can show what it is drawn from. */
    shipmentsByStatus: Record<ShipmentStatus, number>;
    /** Spend on her orders raised within the selected period. */
    spendInRange: number;
    rangeOrderCount: number;
}

/**
 * Her KPI figures.
 *
 * Every tile here is absolute rather than period-scoped, and each says which window it covers.
 * Three of them are absolute by definition — "how many of my shipments are at risk" means right
 * now. The fourth, on-time delivery, is measured over the same rolling twelve months and on the
 * same delivery-date basis the scorecard uses: reading it off the selected period would put a
 * figure in the headline that no supplier card agrees with, and rest it on the handful of orders
 * that both were placed and landed inside one quarter. The period selector drives the spend views
 * instead — the sunburst, the scorecard's commercial columns, and the grid.
 */
export function mySummary(rangeOrders: PurchaseOrder[]): MySummary {
    let spendYtd = 0;
    let openOrders = 0;
    for (const order of MY_ORDERS) {
        if (order.orderDate >= YEAR_START) spendYtd += order.totalCost;
        if (order.actualDate == null) openOrders += 1;
    }

    // Scoped by delivery date, as `myScorecard` scopes each supplier's rate: by order date the same
    // window holds a smaller set, and the headline would quote a figure no supplier card agrees with.
    let delivered = 0;
    let onTime = 0;
    for (const order of deliveredInRange(MY_ORDERS, trailingMonths(PERFORMANCE_MONTHS))) {
        if (order.actualDate == null) continue;
        delivered += 1;
        if (order.actualDate <= order.expectedDate) onTime += 1;
    }

    const spendInRange = sumSpend(rangeOrders);
    const spendQuarter = sumSpend(inRange(MY_ORDERS, CURRENT_QUARTER));

    const shipmentsByStatus: Record<ShipmentStatus, number> = { 'On time': 0, 'At risk': 0, Late: 0 };
    for (const shipment of MY_SHIPMENTS) shipmentsByStatus[shipment.status] += 1;

    return {
        spendYtd,
        annualBudgetUsed: spendYtd / MY_BUDGET.annual,
        spendQuarter,
        quarterBudgetUsed: spendQuarter / MY_BUDGET.quarterly,
        openOrders,
        onTimeRate: delivered > 0 ? onTime / delivered : 0,
        deliveredCount: delivered,
        atRiskShipments: shipmentsByStatus['At risk'] + shipmentsByStatus.Late,
        shipmentsByStatus,
        spendInRange,
        rangeOrderCount: rangeOrders.length,
    };
}

// --- needs my attention -------------------------------------------------------

const SHIPMENT_ACTIONS = [{ id: 'contact', label: 'Contact supplier' }] as const;

/**
 * Her late shipments, worst first: the ones already projected to miss the date production needs
 * them, so every item is something she has to act on rather than watch.
 *
 * Derived from the same records as the KPIs and the grid — a view over her own data, not a
 * separate feed — so every item can hand the workspace the context it was raised in.
 */
export function myAttentionItems(): AttentionItem[] {
    const late = MY_SHIPMENTS.filter((shipment) => shipment.status === 'Late');

    return late
        .sort((a, b) => a.requiredDate - b.requiredDate)
        .map((shipment) => {
            // Late is defined by the projection having passed the required date, so the slack is
            // always negative and the item can state the overrun directly.
            const daysLate = Math.abs(daysBetween(shipment.projectedDate, shipment.requiredDate));
            const carrier = shipment.carrierDelay ? ' · carrier delay logged' : '';
            return {
                itemId: `shipment-${shipment.shipmentId}`,
                kind: 'shipment',
                severity: 'bad',
                title: `${shipment.supplierName} shipment ${shipment.shipmentId} — late`,
                detail: `Projected ${daysLate} ${daysLate === 1 ? 'day' : 'days'} past the date production needs it${carrier} · ${shipment.material} to ${shipment.plantName}`,
                shipmentId: shipment.shipmentId,
                actions: [...SHIPMENT_ACTIONS],
            };
        });
}

/** The on-time target the KPI tile states, re-exported so it and the scorecard agree. */
export { ON_TIME_TARGET };

// --- her periods --------------------------------------------------------------

// Two period controls, because the two tabs are asking different questions of the same orders.
// Supplier performance is a trend and needs a trailing window of whole months; spend is a
// commitment against an allocation, and an allocation only exists for a calendar period. Sharing
// one selector would force one of the two to be read over a window that means nothing to it.

/**
 * The trailing windows the suppliers tab can be read over, longest first.
 *
 * Whole months rather than quarters, because everything on that tab is a monthly series: a window
 * has to hold enough buckets to be a trend, and six is the shortest that does.
 */
export const PERIOD_OPTIONS = [12, 6] as const;

export type PeriodMonths = (typeof PERIOD_OPTIONS)[number];

export const DEFAULT_PERIOD: PeriodMonths = 12;

export const periodLabel = (months: PeriodMonths) => `Last ${months} months`;

/** The selected window as a range, for the views that read one directly. */
export const myPeriod = (months: PeriodMonths): DateRange => trailingMonths(months);

/**
 * The windows the spend tab can be read over.
 *
 * Calendar periods rather than trailing months, because every figure on that tab is measured
 * against a budget: her allocation is annual and quarterly, so those are the only two windows in
 * which "am I on plan" has an answer. A trailing twelve months has no allocation to compare to.
 */
export const SPEND_PERIOD_OPTIONS = ['ytd', 'quarter'] as const;

export type SpendPeriod = (typeof SPEND_PERIOD_OPTIONS)[number];

export const DEFAULT_SPEND_PERIOD: SpendPeriod = 'ytd';

const SPEND_PERIOD_LABELS: Record<SpendPeriod, string> = { ytd: 'YTD', quarter: 'This quarter' };

export const spendPeriodLabel = (period: SpendPeriod) => SPEND_PERIOD_LABELS[period];

/** The spend tile's own label, written out per window rather than composed from the period's. */
const SPEND_KPI_LABELS: Record<SpendPeriod, string> = {
    ytd: 'My spend YTD',
    quarter: 'My spend this quarter',
};

export const spendKpiLabel = (period: SpendPeriod) => SPEND_KPI_LABELS[period];

/** The projection tile names where the window ends, not the window itself. */
const SPEND_PROJECTION_LABELS: Record<SpendPeriod, string> = {
    ytd: 'Projected year end',
    quarter: 'Projected quarter end',
};

export const spendProjectionLabel = (period: SpendPeriod) => SPEND_PROJECTION_LABELS[period];

/** The selected spend window as a range. Both run to the demo's fixed now. */
export const mySpendPeriod = (period: SpendPeriod): DateRange =>
    period === 'ytd' ? RANGE_PRESETS.yearToDate() : RANGE_PRESETS.currentQuarter();

/**
 * The selected window as it will be once complete, including the part still to come.
 *
 * What a pace or a runway is measured against: the elapsed window answers how much has been spent,
 * and only the whole one answers whether that is too much this early.
 */
export const mySpendPeriodFull = (period: SpendPeriod): DateRange =>
    period === 'ytd'
        ? { start: new Date(DEMO_NOW.getFullYear(), 0, 1), end: new Date(DEMO_NOW.getFullYear(), 11, 31) }
        : CURRENT_QUARTER_FULL;

/** The allocation the selected window is accountable against, and what to call it. */
const mySpendAllocation = (period: SpendPeriod) =>
    period === 'ytd'
        ? { amount: MY_BUDGET.annual, label: 'annual budget', windowLabel: 'year' }
        : { amount: MY_BUDGET.quarterly, label: 'quarterly allocation', windowLabel: 'quarter' };

/** The month buckets of the selected window — the x axis every trend series is plotted on. */
export const myPeriodMonths = (months: PeriodMonths): MonthBucket[] => monthBuckets(trailingMonths(months));

// --- her trends ---------------------------------------------------------------

/**
 * Her orders *raised* in the selected window — the basis for anything agreed at order time.
 */
const myOrderedIn = (months: PeriodMonths) => inRange(MY_ORDERS, trailingMonths(months));

/**
 * Her orders *delivered* in the selected window, whenever they were raised — the basis for
 * anything measured on receipt.
 *
 * Scoped by delivery date rather than order date on purpose. Steel lead times run to six weeks, so
 * filtering receipts by when the order was raised drops everything that arrived in the window's
 * first month and everything raised near its end, leaving both edges of every delivery series
 * blank for a reason that has nothing to do with the suppliers.
 */
const myDeliveredIn = (months: PeriodMonths) => deliveredInRange(MY_ORDERS, trailingMonths(months));

/** The delivery-slip observations per supplier, for the per-supplier histograms. */
export const mySlipDistributions = (months: PeriodMonths): SlipDistribution[] =>
    slipDistributions(myDeliveredIn(months), MANAGER.supplierIds);

/** Every monthly performance metric per supplier over the selected window. */
export const mySupplierTrend = (months: PeriodMonths): Map<string, SupplierTrendPoint[]> =>
    supplierTrendByMonth(myOrderedIn(months), myDeliveredIn(months), MANAGER.supplierIds, myPeriodMonths(months));

/** What her rejected material cost, per supplier, over the selected window. */
export const myQualityCost = (months: PeriodMonths): QualityCost[] =>
    qualityCost(myDeliveredIn(months), MANAGER.supplierIds);

/**
 * Her committed spend against budget pace, across the whole of the selected window.
 *
 * The window has to be the complete one, not the part elapsed: a burn-up is read for where the
 * trajectory lands, and that needs the remaining runway on the chart. `spendBurnUp` stops the
 * committed line at today of its own accord.
 */
export const myBurnUp = (period: SpendPeriod): BurnUpPoint[] =>
    spendBurnUp(
        inRange(MY_ORDERS, mySpendPeriod(period)),
        mySpendPeriodFull(period),
        mySpendAllocation(period).amount,
        DEMO_NOW
    );

/** Her position against the selected window's allocation. */
export interface MySpendPosition {
    /** Committed spend inside the window, to date. */
    spend: number;
    /** The allocation the window is judged against. */
    budget: number;
    /** Share of that allocation committed so far. */
    used: number;
    /**
     * Share of the window already elapsed — what `used` has to beat to be running hot.
     *
     * Without it a share of an allocation says nothing: 70% of an annual budget is comfortable in
     * November and alarming in March, and the tile has to be able to tell those apart.
     */
    elapsed: number;
    /**
     * Where the window lands if her recent rate holds: committed to date, plus the trailing
     * daily rate across the days the window has left.
     *
     * Rated off a trailing window rather than off this one's elapsed part, because early in a
     * quarter the elapsed part is a handful of lumpy steel orders and dividing by it swings the
     * projection wildly. It is still a straight-line assumption — she can stop ordering.
     */
    projected: number;
    /** What the allocation is called, for the tile's supporting line. */
    budgetLabel: string;
    /** What the window is called, for the same line. */
    windowLabel: string;
}

/** The trailing window her run rate is measured over — a quarter of ordering, whatever the period. */
const RUN_RATE_DAYS = 90;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Her spend position in the selected window, for the KPI tile and the runway card.
 *
 * Both read this rather than computing their own, so the figure in the tile and the figure in the
 * card's subtitle cannot disagree.
 */
export function mySpendPosition(period: SpendPeriod): MySpendPosition {
    const allocation = mySpendAllocation(period);
    const spend = sumSpend(inRange(MY_ORDERS, mySpendPeriod(period)));
    const full = mySpendPeriodFull(period);
    const windowDays = Math.max(1, calendarDaysBetween(full.start, full.end) + 1);
    const elapsedDays = calendarDaysBetween(full.start, DEMO_NOW) + 1;

    const runRateStart = new Date(DEMO_NOW.getTime() - RUN_RATE_DAYS * DAY_MS);
    const dailyRate = sumSpend(inRange(MY_ORDERS, { start: runRateStart, end: DEMO_NOW })) / RUN_RATE_DAYS;
    const remainingDays = Math.max(0, calendarDaysBetween(DEMO_NOW, full.end));

    return {
        spend,
        budget: allocation.amount,
        used: allocation.amount > 0 ? spend / allocation.amount : 0,
        elapsed: Math.min(1, elapsedDays / windowDays),
        projected: spend + dailyRate * remainingDays,
        budgetLabel: allocation.label,
        windowLabel: allocation.windowLabel,
    };
}

/** Her supplier split within each subcategory, for the single-sourcing view. */
export const mySupplierShare = (rangeOrders: PurchaseOrder[]): SupplierShareRow[] =>
    supplierShareBySubcategory(MANAGER.commodity, rangeOrders, MANAGER.supplierIds);

/**
 * Her committed spend per bucket over the selected window, split by subcategory.
 *
 * The grain follows the window, because a fixed one cannot serve both: twelve months of a year is
 * a trend, whereas a quarter drawn monthly is two bars — one of them the month still in progress.
 * So a year is read in months and a quarter in weeks, and the card says which.
 *
 * Either way the unfinished bucket at the end is excluded. A month a third elapsed draws a
 * third-height bar, and on a run-rate chart that reads as a collapse in committed spend rather
 * than as a period still in progress — the same reasoning as `onTimeByMonth` plotting an empty
 * month as `null` instead of zero. A chart should not invent a movement the data does not contain.
 */
export function mySpendTrend(period: SpendPeriod): SpendTrend {
    const grain = period === 'ytd' ? 'month' : 'week';

    // For months, the window stops where the current month began, so `monthBuckets` cannot emit a
    // partial one; for weeks, `weekBuckets` drops the trailing partial itself.
    const range: DateRange =
        grain === 'month'
            ? {
                  start: mySpendPeriodFull(period).start,
                  end: new Date(new Date(DEMO_NOW.getFullYear(), DEMO_NOW.getMonth(), 1).getTime() - 1),
              }
            : mySpendPeriod(period);

    const buckets = grain === 'month' ? monthBuckets(range) : weekBuckets(range);
    const rows = spendByBucketAndSubcategory(MANAGER.commodity, inRange(MY_ORDERS, range), buckets);
    const last = buckets.at(-1);

    return {
        rows,
        grain,
        // Inclusive: a bucket's `end` is the next one's start, so the last day it covers is before it.
        end: new Date((last?.end ?? range.start.getTime()) - 1),
    };
}
