import { describe, expect, it } from 'vitest';

import {
    ALL_ORDERS,
    COMMODITY_MANAGERS,
    CURRENT_QUARTER,
    CURRENT_QUARTER_FULL,
    DEMO_NOW,
    MATERIALS,
    PO_IDS_BY_SHIPMENT,
    RANGE_PRESETS,
    SHIPMENTS,
    SUBCATEGORIES,
    SUPPLIERS,
    SUPPLIER_BY_ID,
    buildSpendTree,
    deliveredInRange,
    inRange,
    monthBuckets,
    onTimeByMonth,
    priceByMonth,
    qualityCost,
    scorecard,
    shipmentsCarrying,
    slipDistributions,
    spendBurnUp,
    spendByBucketAndSubcategory,
    sumSpend,
    supplierShareBySubcategory,
    supplierTrendByMonth,
    weekBuckets,
} from './data';
import type { SpendNode } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('order pool', () => {
    it('holds a demo-sized, internally consistent book of orders', () => {
        expect(ALL_ORDERS.length).toBeGreaterThan(800);

        for (const order of ALL_ORDERS.slice(0, 500)) {
            expect(order.totalCost).toBeCloseTo(order.quantity * order.unitCost, 6);
            expect(order.expectedDate).toBeGreaterThan(order.orderDate);
            expect(SUPPLIER_BY_ID.has(order.supplierId)).toBe(true);
            // The material must exist at exactly the point in the hierarchy claimed.
            expect(
                MATERIALS.some(
                    (material) =>
                        material.name === order.material &&
                        material.commodity === order.commodity &&
                        material.subcategory === order.subcategory
                )
            ).toBe(true);
        }
    });

    it('marks an order delivered exactly when it has an actual delivery date', () => {
        for (const order of ALL_ORDERS) {
            expect(order.status === 'Delivered').toBe(order.actualDate != null);
        }
    });

    it('records an inspection result exactly on delivery, never above the ordered quantity', () => {
        for (const order of ALL_ORDERS) {
            expect(order.acceptedQuantity != null).toBe(order.actualDate != null);
            if (order.acceptedQuantity == null) continue;
            expect(order.acceptedQuantity).toBeGreaterThan(0);
            expect(order.acceptedQuantity).toBeLessThanOrEqual(order.quantity);
        }
    });

    it('covers every catalogue material, so no sunburst leaf is permanently empty', () => {
        const ordered = new Set(ALL_ORDERS.map((order) => `${order.commodity}/${order.subcategory}/${order.material}`));
        expect(MATERIALS.filter((material) => !ordered.has(material.materialId))).toEqual([]);
    });

    it('only ever buys a material from a supplier approved for it', () => {
        const approved = new Map(MATERIALS.map((material) => [material.materialId, new Set(material.supplierIds)]));
        for (const order of ALL_ORDERS) {
            const key = `${order.commodity}/${order.subcategory}/${order.material}`;
            expect(approved.get(key)!.has(order.supplierId)).toBe(true);
        }
    });
});

describe('commodity-manager assignments', () => {
    it('assigns every supplier to exactly one manager', () => {
        const seen = new Map<string, string>();
        for (const manager of COMMODITY_MANAGERS) {
            for (const supplierId of manager.supplierIds) {
                expect(SUPPLIER_BY_ID.has(supplierId)).toBe(true);
                expect(seen.has(supplierId)).toBe(false);
                seen.set(supplierId, manager.managerId);
            }
        }
        expect(seen.size).toBe(SUPPLIERS.length);
    });

    it('covers every commodity, so no commodity is unowned', () => {
        expect(COMMODITY_MANAGERS.map((manager) => manager.commodity).sort()).toEqual(
            Object.keys(SUBCATEGORIES).sort()
        );
    });

    /**
     * The assignment is only an access boundary if it lines up with the catalogue: a manager
     * must be able to buy everything in their commodity, and nothing outside it.
     */
    it('gives each manager exactly the suppliers their own commodity is bought from', () => {
        for (const manager of COMMODITY_MANAGERS) {
            const inCommodity = new Set(
                MATERIALS.filter((material) => material.commodity === manager.commodity).flatMap(
                    (material) => material.supplierIds
                )
            );
            expect([...inCommodity].sort()).toEqual([...manager.supplierIds].sort());
        }
    });
});

describe('shipments', () => {
    it('tracks a boardful of active shipments, all still in flight', () => {
        expect(SHIPMENTS.length).toBeGreaterThan(10);
        expect(SHIPMENTS.length).toBeLessThan(200);

        for (const shipment of SHIPMENTS) {
            expect(shipment.projectedDate).toBeGreaterThan(shipment.departDate);
            expect(shipment.lineCount).toBeGreaterThan(0);
        }
    });

    it('derives status from the projected arrival against the required date', () => {
        // Every branch below has to be exercised, or the board, legend and map shapes go untested.
        expect(new Set(SHIPMENTS.map((shipment) => shipment.status))).toEqual(new Set(['On time', 'At risk', 'Late']));

        for (const shipment of SHIPMENTS) {
            const buffer = Math.trunc((shipment.requiredDate - shipment.projectedDate) / DAY_MS);
            if (shipment.projectedDate > shipment.requiredDate) expect(shipment.status).toBe('Late');
            else if (shipment.carrierDelay || buffer <= 2) expect(shipment.status).toBe('At risk');
            else expect(shipment.status).toBe('On time');
        }
    });

    it('carries only in-flight orders, and each order on at most one shipment', () => {
        const byPo = new Map(ALL_ORDERS.map((order) => [order.poId, order]));
        const seen = new Set<string>();
        for (const [shipmentId, poIds] of PO_IDS_BY_SHIPMENT) {
            expect(poIds.size).toBe(SHIPMENTS.find((s) => s.shipmentId === shipmentId)!.lineCount);
            for (const poId of poIds) {
                expect(byPo.get(poId)!.actualDate).toBeNull();
                expect(seen.has(poId)).toBe(false);
                seen.add(poId);
            }
        }
    });

    it('gives every in-flight order the status of the shipment carrying it', () => {
        for (const shipment of SHIPMENTS) {
            for (const poId of PO_IDS_BY_SHIPMENT.get(shipment.shipmentId)!) {
                expect(ALL_ORDERS.find((order) => order.poId === poId)!.status).toBe(shipment.status);
            }
        }
    });

    /**
     * The restatement an access layer relies on: a caller holding part of the order book gets
     * shipments reporting only its lines, and nothing about lines it cannot see.
     */
    it('restates a shipment over only the lines a caller can see', () => {
        const full = SHIPMENTS.find((shipment) => shipment.lineCount > 1)!;
        const poIds = [...PO_IDS_BY_SHIPMENT.get(full.shipmentId)!];
        const visible = ALL_ORDERS.filter((order) => order.poId === poIds[0]);

        const { shipments, poIdsByShipment } = shipmentsCarrying(visible);
        expect(shipments.map((shipment) => shipment.shipmentId)).toEqual([full.shipmentId]);

        const [restated] = shipments;
        expect(restated.lineCount).toBe(1);
        expect(restated.value).toBeCloseTo(visible[0].totalCost, 4);
        expect(restated.material).toBe(visible[0].material);
        expect([...poIdsByShipment.get(full.shipmentId)!]).toEqual([poIds[0]]);
        // The carrier's own facts are the same whoever is looking.
        expect(restated.status).toBe(full.status);
        expect(restated.projectedDate).toBe(full.projectedDate);
    });

    /** A movement none of the visible lines is on is not a movement that caller can see. */
    it('drops shipments carrying none of the visible lines', () => {
        expect(shipmentsCarrying([]).shipments).toEqual([]);
    });

    /** A shipment consolidates one lane, so it cannot mix suppliers or destinations. */
    it('keeps each shipment on a single supplier-to-plant lane', () => {
        const byPo = new Map(ALL_ORDERS.map((order) => [order.poId, order]));
        for (const shipment of SHIPMENTS) {
            for (const poId of PO_IDS_BY_SHIPMENT.get(shipment.shipmentId)!) {
                const order = byPo.get(poId)!;
                expect(order.supplierId).toBe(shipment.supplierId);
                expect(order.plantId).toBe(shipment.plantId);
            }
        }
    });
});

describe('spend hierarchy', () => {
    const manager = COMMODITY_MANAGERS[0];
    const range = RANGE_PRESETS.currentQuarter();
    const orders = inRange(
        ALL_ORDERS.filter((order) => manager.supplierIds.includes(order.supplierId)),
        range
    );
    const tree = buildSpendTree(manager.commodity, orders, manager.supplierIds);

    /** Every supplier sector, which now sits two rings out from the subcategories. */
    const leavesOf = (node: SpendNode): SpendNode[] =>
        node.children == null ? [node] : node.children.flatMap(leavesOf);

    it('rings the commodity, its subcategories, their materials, then suppliers', () => {
        expect(tree.name).toBe(manager.commodity);
        expect(tree.path).toEqual([]);
        expect(tree.children!.map((child) => child.name)).toEqual(SUBCATEGORIES[manager.commodity]);
        for (const subcategory of tree.children!) {
            expect(subcategory.children!.length).toBeGreaterThan(0);
            for (const material of subcategory.children!) {
                expect(material.path).toEqual([subcategory.name, material.name]);
                expect(material.supplierId).toBeUndefined();
                expect(material.children!.length).toBeGreaterThan(0);
                for (const supplier of material.children!) {
                    expect(supplier.supplierId).toBeDefined();
                    expect(manager.supplierIds).toContain(supplier.supplierId);
                    expect(supplier.children).toBeUndefined();
                }
            }
        }
    });

    it('sums each level to its parent', () => {
        expect(tree.spend).toBeCloseTo(sumSpend(orders), 4);
        const walk = (node: typeof tree) => {
            if (!node.children) return;
            const childSum = node.children.reduce((sum, child) => sum + child.spend, 0);
            expect(childSum).toBeCloseTo(node.spend, 4);
            node.children.forEach(walk);
        };
        walk(tree);
    });

    it('sizes leaves only, so a branch spans exactly its children', () => {
        // The sunburst adds an internal node's own size to its children's, so a size on a
        // parent widens its arc past its children and opens a gap in the ring.
        const walk = (node: typeof tree) => {
            expect(node.size == null).toBe(node.children != null);
            node.children?.forEach(walk);
        };
        walk(tree);
    });

    it('keeps the full roster in the tree so the rings stay stable across periods', () => {
        // A one-day range leaves most of the tree empty, and it must still be present.
        const sparse = buildSpendTree(
            manager.commodity,
            inRange(ALL_ORDERS, { start: range.end, end: range.end }),
            manager.supplierIds
        );
        expect(sparse.children!.map((child) => child.name)).toEqual(SUBCATEGORIES[manager.commodity]);
        const leaves = leavesOf(sparse);
        expect(leaves.filter((leaf) => !(leaf.size! > 0))).toEqual([]);
    });

    it('excludes suppliers the manager does not own', () => {
        const partial = buildSpendTree(manager.commodity, orders, [manager.supplierIds[0]]);
        const leaves = leavesOf(partial);
        expect([...new Set(leaves.map((leaf) => leaf.supplierId))]).toEqual([manager.supplierIds[0]]);
    });
});

describe('supplier scorecard', () => {
    const manager = COMMODITY_MANAGERS[0];
    const orders = inRange(
        ALL_ORDERS.filter((order) => manager.supplierIds.includes(order.supplierId)),
        RANGE_PRESETS.yearToDate()
    );
    const rows = scorecard(orders, orders, manager.supplierIds, SHIPMENTS);

    /** A roster, not a filtered table: a quiet supplier still has a row. */
    it('returns one row per assigned supplier, present or quiet', () => {
        expect(rows.map((row) => row.supplierId).sort()).toEqual([...manager.supplierIds].sort());
    });

    it('reconciles with the orders in scope', () => {
        expect(rows.reduce((sum, row) => sum + row.spend, 0)).toBeCloseTo(sumSpend(orders), 4);
        for (const row of rows) {
            expect(row.onTimeRate).toBeGreaterThanOrEqual(0);
            expect(row.onTimeRate).toBeLessThanOrEqual(1);
            expect(row.qualityScore).toBeGreaterThan(0);
        }
    });

    /**
     * The roster column and the quality-cost chart must show the same figure — they are read side by
     * side on the same tab, and a reader comparing them has no way to know which to believe.
     */
    it('carries the same rejected value the quality-cost derivation reports', () => {
        const quality = new Map(qualityCost(orders, manager.supplierIds).map((row) => [row.supplierId, row]));
        for (const row of rows) {
            expect(row.rejectedValue).toBeCloseTo(quality.get(row.supplierId)?.rejectedValue ?? 0, 6);
        }
        // And it is a real figure, not zero everywhere, or the column says nothing.
        expect(rows.some((row) => row.rejectedValue > 0)).toBe(true);
    });

    it('reports no rejected value for a supplier with nothing delivered in the window', () => {
        const undelivered = orders.filter((order) => order.actualDate == null);
        for (const row of scorecard(orders, undelivered, manager.supplierIds, SHIPMENTS)) {
            expect(row.rejectedValue).toBe(0);
        }
    });

    it('falls back to the contracted rate until there are enough deliveries to measure', () => {
        const quarter = inRange(
            ALL_ORDERS.filter((order) => manager.supplierIds.includes(order.supplierId)),
            RANGE_PRESETS.currentQuarter()
        );
        const thin = scorecard(quarter, quarter, manager.supplierIds, SHIPMENTS);
        expect(thin.some((row) => row.rateIsContracted)).toBe(true);

        for (const row of thin) {
            if (row.rateIsContracted) {
                expect(row.onTimeRate).toBe(SUPPLIER_BY_ID.get(row.supplierId)!.reliability);
                // A contracted rate is a real commitment, never a degenerate 0 or 1.
                expect(row.onTimeRate).toBeGreaterThan(0.5);
            } else {
                expect(row.deliveredCount).toBeGreaterThanOrEqual(4);
            }
        }
    });

    it('flags the single most urgent thing about each relationship', () => {
        for (const row of rows) {
            if (row.lateShipments > 0) expect(row.flag).toBe('Late shipment open');
            else if (row.daysToRenewal <= 30) expect(row.flag).toBe('Renewal due');
            else if (row.onTimeRate < 0.9) expect(row.flag).toBe('Delivery risk');
            else if (row.qualityScore < 0.9) expect(row.flag).toBe('Quality watch');
            else expect(row.flag).toBe('On track');
        }
    });

    /**
     * A flag every supplier carries says nothing about which relationship needs work, which is
     * the whole job of the column.
     */
    it('does not give every supplier the same flag', () => {
        expect(new Set(rows.map((row) => row.flag)).size).toBeGreaterThan(1);
    });

    it('counts only that supplier’s late shipments against it', () => {
        for (const row of rows) {
            const expected = SHIPMENTS.filter(
                (shipment) => shipment.supplierId === row.supplierId && shipment.status === 'Late'
            ).length;
            expect(row.lateShipments).toBe(expected);
        }
    });

    /** Spend follows the selected period; delivery performance follows a rolling window. */
    it('measures performance over the window it is given, not the spend period', () => {
        const quarter = inRange(
            ALL_ORDERS.filter((order) => manager.supplierIds.includes(order.supplierId)),
            RANGE_PRESETS.currentQuarter()
        );
        const rolling = scorecard(quarter, orders, manager.supplierIds, SHIPMENTS);
        const quarterOnly = scorecard(quarter, quarter, manager.supplierIds, SHIPMENTS);
        // Same spend either way, but the rolling window has far more deliveries behind it.
        for (const row of rolling) {
            const same = quarterOnly.find((r) => r.supplierId === row.supplierId)!;
            expect(row.spend).toBeCloseTo(same.spend, 6);
            expect(row.deliveredCount).toBeGreaterThanOrEqual(same.deliveredCount);
        }
        expect(rolling.every((row) => !row.rateIsContracted)).toBe(true);
    });
});

describe('trend series', () => {
    const manager = COMMODITY_MANAGERS[0];
    const range = RANGE_PRESETS.trailingYear();
    const mine = ALL_ORDERS.filter((order) => manager.supplierIds.includes(order.supplierId));
    const orders = inRange(mine, range);
    /** Receipts are scoped by delivery date, which is the date the delivery series bucket on. */
    const delivered = deliveredInRange(mine, range);
    const months = monthBuckets(range);

    it('buckets the window into consecutive calendar months', () => {
        expect(months.length).toBeGreaterThanOrEqual(12);
        for (const [index, month] of months.entries()) {
            const start = new Date(month.start);
            expect(start.getDate()).toBe(1);
            // Each bucket ends exactly where the next begins, with no gap or overlap.
            expect(month.end).toBe(months[index + 1]?.start ?? month.end);
            if (index > 0) expect(month.start).toBeGreaterThan(months[index - 1].start);
        }
    });

    it('reports a month with no deliveries as null rather than zero', () => {
        const trend = onTimeByMonth(orders, manager.supplierIds, months);
        expect([...trend.keys()].sort()).toEqual([...manager.supplierIds].sort());
        for (const points of trend.values()) {
            expect(points.length).toBe(months.length);
            for (const point of points) {
                if (point.delivered === 0) expect(point.rate).toBeNull();
                else {
                    expect(point.rate).toBeGreaterThanOrEqual(0);
                    expect(point.rate).toBeLessThanOrEqual(1);
                }
            }
        }
    });

    it('buckets on-time by delivery date, not order date', () => {
        // One supplier, one month: count by hand and compare.
        const [supplierId] = manager.supplierIds;
        const month = months[3];
        const deliveredThatMonth = orders.filter(
            (order) =>
                order.supplierId === supplierId &&
                order.actualDate != null &&
                order.actualDate >= month.start &&
                order.actualDate < month.end
        );
        const point = onTimeByMonth(orders, manager.supplierIds, months).get(supplierId)![3];
        expect(point.delivered).toBe(deliveredThatMonth.length);
    });

    it('exposes every slip observation, ascending, above the sample floor', () => {
        const distributions = slipDistributions(orders, manager.supplierIds);
        expect(distributions.length).toBeGreaterThan(0);

        for (const row of distributions) {
            const measured = orders.filter((order) => order.supplierId === row.supplierId && order.actualDate != null);
            expect(row.slips.length).toBe(measured.length);
            expect(row.slips.length).toBeGreaterThanOrEqual(5);
            // Ascending, which is what lets the histogram read its range off the ends.
            expect([...row.slips].sort((a, b) => a - b)).toEqual(row.slips);
        }
    });

    it('omits a supplier with too few deliveries to describe a distribution', () => {
        // A one-day window leaves nobody with a usable sample.
        const sparse = inRange(orders, { start: range.end, end: range.end });
        expect(slipDistributions(sparse, manager.supplierIds)).toEqual([]);
    });

    it('runs the burn-up to the end of the period, with committed stopping at today', () => {
        // The full calendar quarter, not the quarter to date: a pacing chart needs the remaining
        // runway on it, and every range preset ends today.
        const quarterOrders = inRange(orders, CURRENT_QUARTER);
        const budget = 8_200_000;
        const points = spendBurnUp(quarterOrders, CURRENT_QUARTER_FULL, budget, DEMO_NOW);

        expect(points.length).toBeGreaterThan(30);
        // Pace runs the full period and lands on the allocation.
        expect(points[points.length - 1].pace).toBeCloseTo(budget, 4);
        // Committed is monotonic where present, and absent after today.
        const present = points.filter((point) => point.committed != null);
        expect(present.length).toBeLessThan(points.length);
        for (const [index, point] of present.entries()) {
            if (index > 0) expect(point.committed!).toBeGreaterThanOrEqual(present[index - 1].committed!);
        }
        expect(present[present.length - 1].committed).toBeCloseTo(sumSpend(quarterOrders), 4);
    });

    it('reports both a price and a price index per month, or neither', () => {
        const trend = priceByMonth(orders, manager.supplierIds, months);
        for (const points of trend.values()) {
            for (const point of points) {
                expect(point.price == null).toBe(point.index == null);
                if (point.price != null) {
                    expect(point.price).toBeGreaterThan(0);
                    expect(point.index!).toBeGreaterThan(0);
                }
            }
        }
    });

    it('carries every trend metric on one shared month axis', () => {
        const trend = supplierTrendByMonth(orders, delivered, manager.supplierIds, months);
        const prices = priceByMonth(orders, manager.supplierIds, months);
        const onTime = onTimeByMonth(delivered, manager.supplierIds, months);

        expect([...trend.keys()]).toEqual(manager.supplierIds);
        for (const [supplierId, points] of trend) {
            expect(points.map((point) => point.label)).toEqual(months.map((month) => month.label));
            // Composed, not recomputed: the trend must agree with the views built on the same months.
            expect(points.map((point) => point.price)).toEqual(prices.get(supplierId)!.map((point) => point.price));
            expect(points.map((point) => point.onTimeRate)).toEqual(onTime.get(supplierId)!.map((point) => point.rate));
        }
    });

    it('reports quality as an acceptance share of delivered quantity', () => {
        const trend = supplierTrendByMonth(orders, delivered, manager.supplierIds, months);
        const [supplierId] = manager.supplierIds;
        const points = trend.get(supplierId)!;

        for (const point of points) {
            if (point.qualityRate == null) continue;
            expect(point.qualityRate).toBeGreaterThan(0);
            expect(point.qualityRate).toBeLessThanOrEqual(1);
        }

        // A month with no deliveries has no quality figure; a month with no orders is a real zero.
        const month = months[3];
        const receiptsInMonth = delivered.filter(
            (order) =>
                order.supplierId === supplierId && order.actualDate! >= month.start && order.actualDate! < month.end
        );
        expect(points[3].qualityRate == null).toBe(receiptsInMonth.length === 0);
    });

    it('splits each subcategory across only the suppliers the manager owns', () => {
        const rows = supplierShareBySubcategory(manager.commodity, orders, manager.supplierIds);
        const names = manager.supplierIds.map((id) => SUPPLIER_BY_ID.get(id)!.name);
        expect(rows.map((row) => row.subcategory)).toEqual(SUBCATEGORIES[manager.commodity]);

        let total = 0;
        for (const row of rows) {
            expect(Object.keys(row).sort()).toEqual(['subcategory', ...names].sort());
            for (const name of names) total += Number(row[name]);
        }
        // Every order in scope lands in exactly one subcategory/supplier cell.
        expect(total).toBeCloseTo(sumSpend(orders), 4);
    });
});

describe('spend over time', () => {
    const manager = COMMODITY_MANAGERS[0];
    const range = RANGE_PRESETS.trailingYear();
    const mine = ALL_ORDERS.filter((order) => manager.supplierIds.includes(order.supplierId));
    const orders = inRange(mine, range);
    const months = monthBuckets(range);
    const rows = spendByBucketAndSubcategory(manager.commodity, orders, months);

    it('gives every month a row and every subcategory a column', () => {
        expect(rows.map((row) => row.label)).toEqual(months.map((month) => month.label));
        for (const row of rows) {
            expect(Object.keys(row).sort()).toEqual(['label', 'start', ...SUBCATEGORIES[manager.commodity]].sort());
        }
    });

    it('lands every order in exactly one month and subcategory', () => {
        let total = 0;
        for (const row of rows) {
            for (const subcategory of SUBCATEGORIES[manager.commodity]) total += Number(row[subcategory]);
        }
        expect(total).toBeCloseTo(sumSpend(orders), 4);
    });

    it('buckets an order by the month it was raised in', () => {
        const [month] = months;
        const raisedThen = orders.filter((order) => order.orderDate >= month.start && order.orderDate < month.end);
        const row = rows[0];
        const banded = SUBCATEGORIES[manager.commodity].reduce((sum, subcategory) => sum + Number(row[subcategory]), 0);
        expect(banded).toBeCloseTo(sumSpend(raisedThen), 4);
    });

    describe('at a weekly grain', () => {
        // A window too short to hold months: a quarter to date, which is what the spend tab's
        // shorter period resolves to.
        const quarter = { start: new Date(2026, 6, 1), end: DEMO_NOW };
        const weeks = weekBuckets(quarter);

        it('tiles whole weeks from the start of the window', () => {
            expect(weeks.length).toBeGreaterThan(0);
            expect(weeks[0].start).toBe(quarter.start.getTime());
            for (const [index, week] of weeks.entries()) {
                expect(week.end - week.start).toBe(7 * DAY_MS);
                if (index > 0) expect(week.start).toBe(weeks[index - 1].end);
            }
        });

        it('drops the week still in progress rather than drawing it short', () => {
            const last = weeks.at(-1)!;
            expect(last.end).toBeLessThanOrEqual(quarter.end.getTime() + 1);
            // The next week would run past today, which is exactly why it is not there.
            expect(last.end + 7 * DAY_MS).toBeGreaterThan(quarter.end.getTime() + 1);
        });

        it('lands every order inside the covered weeks in exactly one of them', () => {
            const covered = orders.filter(
                (order) => order.orderDate >= weeks[0].start && order.orderDate < weeks.at(-1)!.end
            );
            const weekRows = spendByBucketAndSubcategory(manager.commodity, covered, weeks);
            let total = 0;
            for (const row of weekRows) {
                for (const subcategory of SUBCATEGORIES[manager.commodity]) total += Number(row[subcategory]);
            }
            expect(total).toBeCloseTo(sumSpend(covered), 4);
        });
    });
});

describe('cost of poor quality', () => {
    const manager = COMMODITY_MANAGERS[0];
    const mine = ALL_ORDERS.filter((order) => manager.supplierIds.includes(order.supplierId));
    const rows = qualityCost(mine, manager.supplierIds);

    it('values the rejected quantity at the price she paid for it', () => {
        expect(rows.length).toBeGreaterThan(0);
        for (const row of rows) {
            const delivered = mine.filter(
                (order) => order.supplierId === row.supplierId && order.acceptedQuantity != null
            );
            const expected = delivered.reduce(
                (total, order) => total + (order.quantity - order.acceptedQuantity!) * order.unitCost,
                0
            );
            expect(row.rejectedValue).toBeCloseTo(expected, 4);
            expect(row.deliveredCount).toBe(delivered.length);
        }
    });

    it('reports an acceptance rate the rejected value agrees with', () => {
        for (const row of rows) {
            expect(row.acceptedRate).toBeGreaterThan(0);
            expect(row.acceptedRate).toBeLessThanOrEqual(1);
            // Nothing rejected is the only way to owe nothing.
            expect(row.rejectedValue === 0).toBe(row.acceptedRate === 1);
        }
    });

    it('omits a supplier with no delivery record rather than showing a costless zero', () => {
        const undelivered = mine.filter((order) => order.acceptedQuantity == null);
        expect(qualityCost(undelivered, manager.supplierIds)).toEqual([]);
    });
});
