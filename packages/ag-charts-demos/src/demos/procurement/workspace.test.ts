import { describe, expect, it } from 'vitest';

import {
    ALL_ORDERS,
    COMMODITY_MANAGERS,
    DEMO_NOW,
    PO_IDS_BY_SHIPMENT,
    RANGE_PRESETS,
    SHIPMENTS,
    SUBCATEGORIES,
    SUPPLIERS,
    sumSpend,
} from './data';
import {
    DEFAULT_PERIOD,
    MANAGER,
    MY_ORDERS,
    MY_SHIPMENTS,
    MY_SUPPLIERS,
    MY_TRACKED_SHIPMENTS,
    myAttentionItems,
    myOrdersInRange,
    myPeriod,
    myScorecard,
    mySpendTree,
    mySpendTrend,
    mySummary,
    ordersOnShipment,
    shipmentCarryingOrder,
} from './workspace';

/**
 * The access model is the load-bearing claim of a personal view: not "the portfolio filtered
 * to me" but "only my records were ever fetched". These tests assert the boundary holds from
 * both directions — everything of hers is present, and nothing of anyone else's is.
 */
describe('access scope', () => {
    const otherSupplierIds = SUPPLIERS.map((s) => s.supplierId).filter((id) => !MANAGER.supplierIds.includes(id));

    it('resolves one manager and her assigned roster', () => {
        expect(MANAGER.commodity).toBe('Steel & Metals');
        expect(MY_SUPPLIERS.map((supplier) => supplier.supplierId)).toEqual(MANAGER.supplierIds);
        // The spec's roster size for a commodity manager.
        expect(MY_SUPPLIERS.length).toBeGreaterThanOrEqual(4);
        expect(MY_SUPPLIERS.length).toBeLessThanOrEqual(6);
    });

    it('exposes only her orders, and all of them', () => {
        expect(MY_ORDERS.length).toBeGreaterThan(0);
        expect(MY_ORDERS.length).toBeLessThan(ALL_ORDERS.length);
        for (const order of MY_ORDERS) {
            expect(MANAGER.supplierIds).toContain(order.supplierId);
            expect(order.commodity).toBe(MANAGER.commodity);
        }
        expect(MY_ORDERS.length).toBe(
            ALL_ORDERS.filter(
                (order) => MANAGER.supplierIds.includes(order.supplierId) && order.commodity === MANAGER.commodity
            ).length
        );
    });

    it('exposes only her shipments, and all of them', () => {
        expect(MY_SHIPMENTS.length).toBeGreaterThan(0);
        const mine = new Set(MY_ORDERS.map((order) => order.poId));
        for (const shipment of MY_SHIPMENTS) {
            expect(MANAGER.supplierIds).toContain(shipment.supplierId);
            // Visible because it carries lines of hers, and reporting only those lines.
            const poIds = [...PO_IDS_BY_SHIPMENT.get(shipment.shipmentId)!].filter((poId) => mine.has(poId));
            expect(poIds.length).toBeGreaterThan(0);
            expect(shipment.lineCount).toBe(poIds.length);
        }
        // Every movement carrying a line of hers is present.
        const carrying = new Set(
            SHIPMENTS.filter((shipment) =>
                [...PO_IDS_BY_SHIPMENT.get(shipment.shipmentId)!].some((poId) => mine.has(poId))
            ).map((shipment) => shipment.shipmentId)
        );
        expect(new Set(MY_SHIPMENTS.map((shipment) => shipment.shipmentId))).toEqual(carrying);
    });

    /**
     * Assignment is per supplier, but accountability is per commodity: the catalogue can approve
     * one supplier under two of them, and lines outside hers have no budget of hers to sit against.
     */
    it('scopes her book to her commodity, not just to her suppliers', () => {
        const foreign = ALL_ORDERS.filter(
            (order) => MANAGER.supplierIds.includes(order.supplierId) && order.commodity !== MANAGER.commodity
        );
        const mine = new Set(MY_ORDERS.map((order) => order.poId));
        expect(foreign.some((order) => mine.has(order.poId))).toBe(false);
        // Nor through a shipment: each reports her lines on it, so its value is her spend and no more.
        for (const shipment of MY_SHIPMENTS) {
            expect(shipment.value).toBeCloseTo(sumSpend(ordersOnShipment(MY_ORDERS, shipment.shipmentId)), 4);
        }
        // And a line outside her book names no shipment of hers to resolve against.
        for (const order of foreign) expect(shipmentCarryingOrder(order.poId)).toBeUndefined();
    });

    /**
     * The scope is not a filter that could be cleared or widened: no selection state, however
     * constructed, reaches another manager's records.
     */
    it('cannot be widened by any selection, including one naming another manager’s supplier', () => {
        // A shipment belonging to someone else resolves to nothing, not to their lines.
        const foreign = SHIPMENTS.find((shipment) => otherSupplierIds.includes(shipment.supplierId))!;
        expect(ordersOnShipment(MY_ORDERS, foreign.shipmentId)).toEqual([]);
        // Nor does the unselected book, which is the widest thing the UI can express.
        expect(MY_ORDERS.every((order) => order.commodity === MANAGER.commodity)).toBe(true);
    });

    it('keeps every other manager’s book intact and disjoint from hers', () => {
        const mine = new Set(MY_ORDERS.map((order) => order.poId));
        for (const other of COMMODITY_MANAGERS.filter((m) => m.managerId !== MANAGER.managerId)) {
            const theirs = ALL_ORDERS.filter((order) => other.supplierIds.includes(order.supplierId));
            expect(theirs.length).toBeGreaterThan(0);
            expect(theirs.some((order) => mine.has(order.poId))).toBe(false);
        }
    });
});

describe('selection', () => {
    it('resolves a shipment selection to that shipment’s PO lines', () => {
        const shipment = MY_SHIPMENTS[0];
        const mine = new Set(MY_ORDERS.map((order) => order.poId));
        expect(
            ordersOnShipment(MY_ORDERS, shipment.shipmentId)
                .map((order) => order.poId)
                .sort()
        ).toEqual([...PO_IDS_BY_SHIPMENT.get(shipment.shipmentId)!].filter((poId) => mine.has(poId)).sort());
    });

    it('resolves an unknown shipment to nothing rather than to everything', () => {
        expect(ordersOnShipment(MY_ORDERS, 'SHP-NOPE')).toEqual([]);
    });
});

describe('her KPI figures', () => {
    it('agree with her order book', () => {
        const orders = myOrdersInRange(RANGE_PRESETS.currentQuarter());
        const kpis = mySummary(orders);
        expect(kpis.rangeOrderCount).toBe(orders.length);
        expect(kpis.spendInRange).toBeCloseTo(
            orders.reduce((sum, order) => sum + order.totalCost, 0),
            4
        );
        expect(kpis.openOrders).toBe(MY_ORDERS.filter((order) => order.actualDate == null).length);
        expect(kpis.atRiskShipments).toBe(MY_SHIPMENTS.filter((shipment) => shipment.status !== 'On time').length);
        // The on-time rate is a rolling twelve months, not the selected period — see `mySummary`.
        expect(kpis.onTimeRate).toBeGreaterThan(0);
        expect(kpis.onTimeRate).toBeLessThanOrEqual(1);
    });

    /**
     * The headline sits above the cards it summarises, so it has to be drawn from the same
     * deliveries. Scoping it by order date instead silently measures a smaller set.
     */
    it('measure on-time over the same deliveries the supplier cards do', () => {
        const kpis = mySummary(myOrdersInRange(RANGE_PRESETS.currentQuarter()));
        const rows = myScorecard(myOrdersInRange(myPeriod(DEFAULT_PERIOD)), MY_TRACKED_SHIPMENTS, DEFAULT_PERIOD);

        expect(kpis.deliveredCount).toBe(rows.reduce((sum, row) => sum + row.deliveredCount, 0));
        // Every card is measured rather than falling back to a contracted rate, so the headline is
        // exactly their delivery-weighted average.
        expect(rows.every((row) => !row.rateIsContracted)).toBe(true);
        const onTime = rows.reduce((sum, row) => sum + row.onTimeRate * row.deliveredCount, 0);
        expect(kpis.onTimeRate).toBeCloseTo(onTime / kpis.deliveredCount, 10);
    });

    /** Her tiles are her commodity's, so they must be strictly smaller than the whole book. */
    it('are scoped to her commodity, not the portfolio', () => {
        const kpis = mySummary(myOrdersInRange(RANGE_PRESETS.yearToDate()));
        const wholeBookOpen = ALL_ORDERS.filter((order) => order.actualDate == null).length;
        expect(kpis.openOrders).toBeLessThan(wholeBookOpen);
        expect(kpis.atRiskShipments).toBeLessThan(SHIPMENTS.filter((s) => s.status !== 'On time').length);
    });
});

describe('needs my attention', () => {
    const items = myAttentionItems();

    /**
     * A worklist, not a monitor: only a shipment already projected to miss its required date raises
     * an item. An at-risk one is still on the board and in every other view — it just is not
     * something she has to decide on today.
     */
    it('raises an item for every late shipment of hers, and nothing else', () => {
        const late = MY_SHIPMENTS.filter((shipment) => shipment.status === 'Late');
        expect(late.length).toBeGreaterThan(0);

        expect(items.map((item) => item.itemId).sort()).toEqual(
            late.map((shipment) => `shipment-${shipment.shipmentId}`).sort()
        );
        // At-risk shipments exist, so the list is genuinely narrower than the board it sits over.
        expect(MY_SHIPMENTS.some((shipment) => shipment.status === 'At risk')).toBe(true);
    });

    /** The spec's illustrative worklist is a handful of items, not a feed. */
    it('stays short enough to be a worklist', () => {
        expect(items.length).toBeGreaterThan(0);
        expect(items.length).toBeLessThanOrEqual(8);
    });

    it('leads with the shipment production needs soonest', () => {
        const required = items.map((item) => {
            const id = item.itemId.replace('shipment-', '');
            return MY_SHIPMENTS.find((shipment) => shipment.shipmentId === id)!.requiredDate;
        });
        expect(required).toEqual([...required].sort((a, b) => a - b));
    });

    /** An item that selects a shipment with no lines behind it is a dead end. */
    it('every item names a shipment that resolves to order lines', () => {
        for (const item of items) {
            expect(ordersOnShipment(MY_ORDERS, item.shipmentId).length).toBeGreaterThan(0);
            expect(item.actions.length).toBeGreaterThan(0);
        }
    });

    it('is derived from the same records as the scorecard, so the two agree', () => {
        const rows = myScorecard(myOrdersInRange(RANGE_PRESETS.currentQuarter()), MY_SHIPMENTS, 12);
        const flaggedLate = new Set(rows.filter((row) => row.flag === 'Late shipment open').map((r) => r.supplierId));
        // Every supplier the scorecard flags for a late shipment has an item on the worklist.
        const shipmentById = new Map(MY_SHIPMENTS.map((shipment) => [shipment.shipmentId, shipment]));
        const suppliersWithShipmentItems = new Set(items.map((item) => shipmentById.get(item.shipmentId)!.supplierId));
        for (const supplierId of flaggedLate) {
            expect(suppliersWithShipmentItems.has(supplierId)).toBe(true);
        }
    });
});

describe('her spend tree', () => {
    it('is rooted at her commodity and contains only her suppliers', () => {
        const tree = mySpendTree(myOrdersInRange(RANGE_PRESETS.currentQuarter()));
        expect(tree.name).toBe(MANAGER.commodity);
        // Suppliers are the outer ring, two levels below the subcategories.
        const leaves = tree.children!.flatMap((sub) => sub.children!.flatMap((material) => material.children!));
        for (const leaf of leaves) {
            expect(MANAGER.supplierIds).toContain(leaf.supplierId);
        }
    });
});

/**
 * The trend is the one spend chart whose *grain* moves with the period, so these assert the pair
 * of readings it has to support rather than just that it returns rows.
 */
describe('her spend trend', () => {
    it('reads a year in months, stopping before the month still in progress', () => {
        const { rows, grain, end } = mySpendTrend('ytd');
        expect(grain).toBe('month');
        expect(rows.length).toBe(DEMO_NOW.getMonth());
        expect(rows[0].label).toMatch(/Jan/);
        // The last bar ends where the current month began, so nothing partial is drawn.
        expect(end.getTime()).toBeLessThan(new Date(DEMO_NOW.getFullYear(), DEMO_NOW.getMonth(), 1).getTime());
    });

    it('reads a quarter in weeks, since monthly would be two bars', () => {
        const { rows, grain, end } = mySpendTrend('quarter');
        expect(grain).toBe('week');
        expect(rows.length).toBeGreaterThan(2);
        expect(rows[0].start).toBe(RANGE_PRESETS.currentQuarter().start.getTime());
        expect(end.getTime()).toBeLessThan(DEMO_NOW.getTime());
    });

    it('gives every bucket every subcategory, so a band never goes missing', () => {
        for (const period of ['ytd', 'quarter'] as const) {
            const { rows } = mySpendTrend(period);
            for (const row of rows) {
                for (const subcategory of SUBCATEGORIES[MANAGER.commodity]) {
                    expect(typeof row[subcategory]).toBe('number');
                }
            }
        }
    });
});
