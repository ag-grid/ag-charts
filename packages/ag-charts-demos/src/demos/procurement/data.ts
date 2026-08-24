// Procurement data engine.
//
// Nothing here is generated at run time: the order book is a fixed set of line items read
// from `./data/`, and pure functions derive the spend hierarchy, supplier scorecards,
// shipments and KPIs from it. Deriving every view from one order book keeps the numbers
// internally consistent (the sunburst rings sum, the scorecard reconciles with the grid,
// the KPIs agree with both) the way a real dataset would.
//
// This module knows nothing about who is looking. It aggregates the whole book across every
// commodity; `workspace.ts` is the access layer that resolves one
// commodity manager and exposes only their records. Keeping the split here is what makes
// the personal view a genuine scope rather than a default filter — and it leaves the
// org-wide roll-up as a second access layer over the same data.
//
// Field names follow the public procurement/supply-chain datasets the figures are modelled
// on; the commodity and subcategory tags are mapped on synthetically, since open data is
// not categorised at that granularity.
//
// No data is written here either: the order book, its shipments, the supplier master,
// plants, manager assignments, material catalogue, budgets and policy thresholds are all
// JSON files under `./data/`, loaded through the single boundary in `./data/source.ts`.
// This module only derives — so pointing the demo at a live procurement system replaces
// that source, and nothing below changes.
import type { CommodityBudget } from './data/source';
import { loadProcurementDataset } from './data/source';
import { interpolateRoute } from './geo';
import type {
    BurnUpPoint,
    Commodity,
    CommodityManager,
    DateRange,
    Material,
    MonthBucket,
    OnTimePoint,
    Plant,
    PricePoint,
    PurchaseOrder,
    QualityCost,
    Shipment,
    ShipmentStatus,
    SlipDistribution,
    SpendNode,
    SpendTrendRow,
    Supplier,
    SupplierScorecard,
    SupplierShareRow,
    SupplierTrendPoint,
    TimeBucket,
    TrackedShipment,
} from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days between two instants, rounded towards zero. */
export const daysBetween = (from: number, to: number) => Math.trunc((to - from) / DAY_MS);

const localMidnight = (at: number | Date) => {
    const date = new Date(at);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};

/**
 * Whole calendar days from the local day `from` falls in to the local day `to` falls in.
 *
 * The counterpart to `daysBetween` for indexing a day *position* rather than measuring elapsed
 * time. A calendar day either side of a DST transition is 23 or 25 hours, so a truncated division
 * puts an instant in the previous day's slot from the transition onwards — off by one for the rest
 * of the range. Rounding across midnight-anchored ends absorbs the hour.
 */
export const calendarDaysBetween = (from: number | Date, to: number | Date) =>
    Math.round((localMidnight(to) - localMidnight(from)) / DAY_MS);

// --- dataset ------------------------------------------------------------------

/**
 * The reference data every figure below is derived from, loaded and integrity-checked at
 * the dataset boundary in `./data/`.
 *
 * The tables themselves — suppliers, plants, manager assignments, the material catalogue,
 * budgets, policy thresholds and the generation profile — are JSON files in that folder, so
 * repointing the demo at a real procurement system is a change of source, not a change of
 * engine.
 */
const DATASET = loadProcurementDataset();

// --- time window --------------------------------------------------------------

/**
 * A fixed "now", so the generated orders, the date-range presets and every derived figure
 * line up run-to-run. Everything downstream is relative to this instant, so moving it
 * slides the whole dataset rather than reshaping it.
 */
export const DEMO_NOW = DATASET.now;

// --- reference data -----------------------------------------------------------

export const PLANTS: Plant[] = DATASET.plants;

const PLANT_BY_ID = new Map(PLANTS.map((plant) => [plant.plantId, plant]));

/**
 * The supplier master.
 *
 * `reliability` and `priceIndex` are deliberately uncorrelated: a cost-versus-delivery
 * scorecard is only worth reading if cheap-and-unreliable and dear-and-dependable both
 * exist, alongside the genuinely good and genuinely bad. The steel suppliers are tuned so
 * the workspace opens on a real decision — the premium supplier is the late one, and the
 * best performer is the one whose contract is about to lapse.
 */
export const SUPPLIERS: Supplier[] = DATASET.suppliers;

export const SUPPLIER_BY_ID = new Map(SUPPLIERS.map((supplier) => [supplier.supplierId, supplier]));

/**
 * Commodity-manager assignments — the access model.
 *
 * Each manager owns one commodity and a fixed set of suppliers. `workspace.ts` resolves a
 * manager and scopes every query to their `supplierIds`, so there is no state in which one
 * manager's view returns another's records.
 */
export const COMMODITY_MANAGERS: CommodityManager[] = DATASET.managers;

/** Subcategories per commodity, in catalogue order — the sunburst's inner ring. */
export const SUBCATEGORIES: Record<Commodity, string[]> = DATASET.subcategories;

/** The material catalogue, flattened, in the fixed commodity order the sunburst relies on. */
export const MATERIALS: Material[] = DATASET.materials;

/** Materials within a subcategory, in catalogue order. */
export const MATERIALS_BY_SUBCATEGORY = new Map<string, Material[]>();
for (const material of MATERIALS) {
    const key = `${material.commodity}/${material.subcategory}`;
    const list = MATERIALS_BY_SUBCATEGORY.get(key);
    if (list) list.push(material);
    else MATERIALS_BY_SUBCATEGORY.set(key, [material]);
}

/**
 * Spend budgets per commodity. A commodity manager is accountable against these the way a
 * general manager is against a business-unit plan, so both the KPI strip and the worklist
 * read them.
 *
 * `quarterly` is the allocation for the *current* quarter, not a quarter of the annual plan:
 * build volumes are not flat across a year, and here the summer quarter is deliberately
 * tighter than a straight split. That is why a commodity can sit comfortably against its
 * annual budget while pressing against this quarter's — which is exactly the position worth
 * surfacing early, and the one Priya's workspace opens on.
 *
 * Calibrated against what the generator actually spends, so the workspace opens on a coherent
 * position rather than flagging everything or nothing.
 */
export const COMMODITY_BUDGETS: Record<Commodity, CommodityBudget> = DATASET.budgets;

/** A contract renewing within this many days needs reviewing. */
export const RENEWAL_WARN_DAYS = DATASET.policy.renewalWarnDays;
/** On-time delivery below this rate is flagged. */
export const ON_TIME_TARGET = DATASET.policy.onTimeTarget;
/** Incoming quality below this rate puts a supplier on watch. */
export const QUALITY_TARGET = DATASET.policy.qualityTarget;

// --- order book ---------------------------------------------------------------

const MATERIAL_BY_ID = new Map(MATERIALS.map((material) => [material.materialId, material]));

/**
 * A shipment is at risk once its remaining buffer is this thin, even without a logged delay:
 * a lane arriving the day before it is needed has no room left for a customs hold.
 */
const AT_RISK_BUFFER_DAYS = 2;

/**
 * Resolves a stored order line into the record the views read.
 *
 * The source holds references and figures, not their consequences, so the commodity, the
 * unit of measure and the line total are joined and computed here rather than stored — a
 * line cannot contradict the catalogue it points at. Status is the one exception: it starts
 * as the receipt's own history and is completed below from the shipment carrying the line.
 */
function assembleOrders(): PurchaseOrder[] {
    return DATASET.purchaseOrders.map((record) => {
        const supplier = SUPPLIER_BY_ID.get(record.supplierId)!;
        const material = MATERIAL_BY_ID.get(record.materialId)!;
        return {
            poId: record.poId,
            supplierId: record.supplierId,
            supplierName: supplier.name,
            commodity: material.commodity,
            subcategory: material.subcategory,
            material: material.name,
            plantId: record.plantId,
            quantity: record.quantity,
            unit: material.unit,
            unitCost: record.unitCost,
            totalCost: record.quantity * record.unitCost,
            orderDate: record.orderDate,
            expectedDate: record.expectedDate,
            actualDate: record.actualDate,
            acceptedQuantity: record.acceptedQuantity,
            status: record.actualDate == null ? 'On time' : 'Delivered',
        };
    });
}

const ORDERS = assembleOrders();

// --- shipments ----------------------------------------------------------------

interface ShipmentBuild {
    shipments: Shipment[];
    /** PO ids covered by each shipment, so a tile or marker click can filter the grid. */
    poIdsByShipment: Map<string, Set<string>>;
}

/** Which shipment carries each line, as the source states it. */
const SHIPMENT_ID_BY_PO = new Map(DATASET.purchaseOrders.map((record) => [record.poId, record.shipmentId]));

/** Groups order lines by the shipment carrying them; lines not yet despatched drop out. */
function groupLinesByShipment(orders: PurchaseOrder[]): Map<string, PurchaseOrder[]> {
    const linesByShipment = new Map<string, PurchaseOrder[]>();
    for (const order of orders) {
        const shipmentId = SHIPMENT_ID_BY_PO.get(order.poId);
        if (shipmentId == null) continue;
        const lines = linesByShipment.get(shipmentId);
        if (lines) lines.push(order);
        else linesByShipment.set(shipmentId, [order]);
    }
    return linesByShipment;
}

/** What a set of lines makes of the movement carrying them: what is on it, and what it is worth. */
function describeCargo(lines: PurchaseOrder[]): Pick<Shipment, 'material' | 'lineCount' | 'value'> {
    const materials = [...new Set(lines.map((order) => order.material))];
    return {
        material: materials.length === 1 ? materials[0] : `${materials.length} materials`,
        lineCount: lines.length,
        value: lines.reduce((sum, order) => sum + order.totalCost, 0),
    };
}

/**
 * Resolves the stored shipments against the order lines that reference them.
 *
 * A shipment is a carrier movement over a set of lines, so its contents — how many lines,
 * what is on them, what they are worth — are the lines' to answer, not the feed's. Status
 * follows the spec's definition: late once the projected arrival passes the required date,
 * at risk when the remaining buffer is thin or the carrier has logged a delay, on time
 * otherwise.
 */
function assembleShipments(orders: PurchaseOrder[]): ShipmentBuild {
    const linesByShipment = groupLinesByShipment(orders);

    const shipments = DATASET.shipments.map<Shipment>((record) => {
        const supplier = SUPPLIER_BY_ID.get(record.supplierId)!;
        const plant = PLANT_BY_ID.get(record.plantId)!;
        const lines = linesByShipment.get(record.shipmentId) ?? [];
        const daysToRequired = daysBetween(record.projectedDate, record.requiredDate);

        let status: ShipmentStatus;
        if (record.projectedDate > record.requiredDate) status = 'Late';
        else if (record.carrierDelay || daysToRequired <= AT_RISK_BUFFER_DAYS) status = 'At risk';
        else status = 'On time';

        return {
            shipmentId: record.shipmentId,
            supplierId: record.supplierId,
            supplierName: supplier.name,
            ...describeCargo(lines),
            plantId: record.plantId,
            plantName: plant.name,
            origin: supplier.origin,
            originName: `${supplier.city}, ${supplier.country}`,
            destination: plant.destination,
            destinationName: plant.name,
            departDate: record.departDate,
            projectedDate: record.projectedDate,
            requiredDate: record.requiredDate,
            carrierDelay: record.carrierDelay,
            status,
        };
    });

    const poIdsByShipment = new Map(
        shipments.map((shipment) => [
            shipment.shipmentId,
            new Set((linesByShipment.get(shipment.shipmentId) ?? []).map((order) => order.poId)),
        ])
    );

    shipments.sort((a, b) => a.projectedDate - b.projectedDate);
    return { shipments, poIdsByShipment };
}

const { shipments: SHIPMENT_LIST, poIdsByShipment: PO_IDS_BY_SHIPMENT_MAP } = assembleShipments(ORDERS);

export const SHIPMENTS = SHIPMENT_LIST;
export const PO_IDS_BY_SHIPMENT = PO_IDS_BY_SHIPMENT_MAP;

/** Live delivery status back-filled onto the in-flight orders each shipment carries. */
const STATUS_BY_PO = new Map<string, ShipmentStatus>();
for (const shipment of SHIPMENTS) {
    for (const poId of PO_IDS_BY_SHIPMENT.get(shipment.shipmentId)!) {
        STATUS_BY_PO.set(poId, shipment.status);
    }
}

/**
 * The whole order book, across every commodity. Delivered orders keep their historical
 * status; in-flight orders inherit the live status of the shipment carrying them, so the
 * grid, the status board and the map can never disagree.
 *
 * Not for direct use by the UI — go through `workspace.ts`, which scopes to one manager.
 */
export const ALL_ORDERS: PurchaseOrder[] = ORDERS.map((order) =>
    order.actualDate == null && STATUS_BY_PO.has(order.poId)
        ? { ...order, status: STATUS_BY_PO.get(order.poId)! }
        : order
);

/**
 * Restates the shipment feed over a subset of the order book, dropping every movement none of
 * those lines is on.
 *
 * The counterpart of `assembleShipments` for an access layer that can only see part of the book.
 * A shipment's contents are its lines', so a caller holding only some of them has to be handed a
 * shipment reporting only those: a consolidated movement that also carried another commodity's
 * material would otherwise quote that commodity's value and line count in this manager's views.
 * The carrier's own facts — the lane, the dates, the status — are unaffected by who is looking.
 */
export function shipmentsCarrying(orders: PurchaseOrder[]): ShipmentBuild {
    const linesByShipment = groupLinesByShipment(orders);
    const shipments = SHIPMENTS.filter((shipment) => linesByShipment.has(shipment.shipmentId)).map<Shipment>(
        (shipment) => ({ ...shipment, ...describeCargo(linesByShipment.get(shipment.shipmentId)!) })
    );
    const poIdsByShipment = new Map(
        shipments.map((shipment) => [
            shipment.shipmentId,
            new Set(linesByShipment.get(shipment.shipmentId)!.map((order) => order.poId)),
        ])
    );
    return { shipments, poIdsByShipment };
}

// --- date ranges --------------------------------------------------------------

const quarterStart = (date: Date) => new Date(date.getFullYear(), Math.floor(date.getMonth() / 3) * 3, 1);

/** The date-range presets offered in the header; `currentQuarter` is the default. */
export const RANGE_PRESETS = {
    currentQuarter: () => ({ start: quarterStart(DEMO_NOW), end: DEMO_NOW }),
    lastQuarter: () => {
        const start = quarterStart(DEMO_NOW);
        const previous = new Date(start.getFullYear(), start.getMonth() - 3, 1);
        return { start: previous, end: new Date(start.getTime() - 1) };
    },
    yearToDate: () => ({ start: new Date(DEMO_NOW.getFullYear(), 0, 1), end: DEMO_NOW }),
    trailingYear: () => ({
        start: new Date(DEMO_NOW.getFullYear() - 1, DEMO_NOW.getMonth(), DEMO_NOW.getDate()),
        end: DEMO_NOW,
    }),
} satisfies Record<string, () => DateRange>;

/**
 * A trailing window of whole calendar months, ending at the demo's fixed now.
 *
 * Anchored to the first of the month rather than the same day N months ago, so the window is
 * exactly N calendar buckets — a same-day anchor spans N+1 partial months, and the stub bucket
 * reads as a real month that almost nothing happened in.
 */
export const trailingMonths = (months: number): DateRange => ({
    start: new Date(DEMO_NOW.getFullYear(), DEMO_NOW.getMonth() - (months - 1), 1),
    end: DEMO_NOW,
});

/** The quarter `DEMO_NOW` falls in, to date — what has actually been committed so far. */
export const CURRENT_QUARTER: DateRange = RANGE_PRESETS.currentQuarter();

/**
 * The whole calendar quarter, including the part still to come.
 *
 * The range presets all end today, which is right for "what have I spent" but wrong for pacing:
 * a burn-up against an allocation needs the remaining runway on the chart, or there is nothing to
 * read a trajectory against.
 */
export const CURRENT_QUARTER_FULL: DateRange = {
    start: CURRENT_QUARTER.start,
    end: new Date(CURRENT_QUARTER.start.getFullYear(), CURRENT_QUARTER.start.getMonth() + 3, 0),
};

export const YEAR_START = new Date(DEMO_NOW.getFullYear(), 0, 1).getTime();

// --- aggregation --------------------------------------------------------------

/** Orders raised within `range`, by order date. */
export function inRange(orders: PurchaseOrder[], range: DateRange): PurchaseOrder[] {
    const start = range.start.getTime();
    const end = range.end.getTime();
    return orders.filter((order) => order.orderDate >= start && order.orderDate <= end);
}

/**
 * Orders *delivered* within `range`, whenever they were raised.
 *
 * The counterpart to `inRange` for every measure taken on receipt — on-time, quality, delivery
 * slip. Filtering those by order date instead empties the first month of any window: what arrived
 * in it was raised before it, and what was raised in it arrives a lead time later.
 */
export function deliveredInRange(orders: PurchaseOrder[], range: DateRange): PurchaseOrder[] {
    const start = range.start.getTime();
    const end = range.end.getTime();
    return orders.filter((order) => order.actualDate != null && order.actualDate >= start && order.actualDate <= end);
}

export const sumSpend = (orders: PurchaseOrder[]) => orders.reduce((sum, order) => sum + order.totalCost, 0);

/**
 * A leaf with no spend in the selected period still gets this sliver of a sector, so it
 * keeps its place in the ring instead of the layout reshuffling every time the period
 * changes. Small enough to be visually negligible next to real spend, and the sector is
 * greyed and labelled as empty so it cannot be read as a value.
 */
const EMPTY_NODE_SLIVER_SHARE = 0.0015;

/**
 * Builds the spend sunburst for one commodity: the commodity at the centre, then its
 * subcategories, the materials within each, and the suppliers each material is bought from as
 * the outer ring.
 *
 * Supplier-as-leaf rather than supplier-as-ring is what makes this a commodity manager's chart:
 * her question is which of her suppliers her spend is concentrated in, and the supplier is the
 * entity every other view keys off. Putting materials above them answers the sourcing question
 * too — a material whose outer arc is one unbroken sector has a single source.
 *
 * The full catalogue is always walked, not just the parts present in `orders`, so an empty
 * branch survives a period change (see `EMPTY_NODE_SLIVER_SHARE`).
 */
export function buildSpendTree(commodity: Commodity, orders: PurchaseOrder[], supplierIds: string[]): SpendNode {
    const spendByPath = new Map<string, number>();
    const accumulate = (path: string, order: PurchaseOrder) =>
        spendByPath.set(path, (spendByPath.get(path) ?? 0) + order.totalCost);

    for (const order of orders) {
        accumulate(order.subcategory, order);
        accumulate(`${order.subcategory}/${order.material}`, order);
        accumulate(`${order.subcategory}/${order.material}/${order.supplierId}`, order);
    }

    const total = sumSpend(orders);
    const sliver = Math.max(total * EMPTY_NODE_SLIVER_SHARE, 1);
    const owned = new Set(supplierIds);

    const subcategoryNodes = SUBCATEGORIES[commodity].map<SpendNode>((subcategory) => {
        // One approved supplier of hers keeps the material in the ring; none at all and it is another commodity.
        const materialNodes = (MATERIALS_BY_SUBCATEGORY.get(`${commodity}/${subcategory}`) ?? [])
            .map((material) => ({
                material,
                approved: material.supplierIds.filter((supplierId) => owned.has(supplierId)),
            }))
            .filter(({ approved }) => approved.length > 0)
            .map<SpendNode>(({ material, approved }) => {
                const supplierNodes = approved.map<SpendNode>((supplierId) => {
                    const spend = spendByPath.get(`${subcategory}/${material.name}/${supplierId}`) ?? 0;
                    return {
                        name: SUPPLIER_BY_ID.get(supplierId)!.name,
                        path: [subcategory, material.name, supplierId],
                        spend,
                        // Leaves only: an internal node's size compounds with its children's, doubling its arc.
                        size: Math.max(spend, sliver),
                        shareOfParent: 0,
                        shareOfTotal: total > 0 ? spend / total : 0,
                        supplierId,
                    };
                });

                const spend = spendByPath.get(`${subcategory}/${material.name}`) ?? 0;
                return {
                    name: material.name,
                    path: [subcategory, material.name],
                    spend,
                    shareOfParent: 0,
                    shareOfTotal: total > 0 ? spend / total : 0,
                    children: supplierNodes,
                };
            });

        const spend = spendByPath.get(subcategory) ?? 0;
        return {
            name: subcategory,
            path: [subcategory],
            spend,
            shareOfParent: 0,
            shareOfTotal: total > 0 ? spend / total : 0,
            children: materialNodes,
        };
    });

    const root: SpendNode = {
        name: commodity,
        path: [],
        spend: total,
        shareOfParent: 1,
        shareOfTotal: 1,
        children: subcategoryNodes,
    };

    // Parent shares are only meaningful once the whole tree exists.
    const setShares = (node: SpendNode) => {
        for (const child of node.children ?? []) {
            child.shareOfParent = node.spend > 0 ? child.spend / node.spend : 0;
            setShares(child);
        }
    };
    setShares(root);

    return root;
}

/** Material name → catalogue list price, for the price-index measure below. */
const LIST_PRICE_BY_MATERIAL = new Map(MATERIALS.map((material) => [material.name, material.listPrice]));

/** Deliveries needed before a measured on-time rate is preferred to the contracted one. */
const MIN_DELIVERIES_FOR_RATE = 4;

/**
 * Builds one scorecard row per supplier in `supplierIds`, whether or not they have orders
 * in scope — a supplier she owns is on her roster even in a quiet quarter, which is the
 * difference between a roster and a filtered table.
 *
 * Price is reported as an index against catalogue list rather than as an amount per unit. The
 * roster spans a whole commodity, so its orders mix units of measure — tonnes of plate against
 * kilos of alloy — and an average price across those compares nothing; a share of list is
 * comparable whatever the mix.
 *
 * On-time rate is measured over delivered orders only — an in-flight order has no outcome
 * yet — and only once there are enough of them to mean anything. Below
 * `MIN_DELIVERIES_FOR_RATE` the supplier shows its contracted reliability, flagged
 * `rateIsContracted`: one late delivery out of one is not a 0% on-time supplier, and
 * plotting it as one both libels the vendor and stretches the chart's axis.
 */
export function scorecard(
    periodOrders: PurchaseOrder[],
    performanceOrders: PurchaseOrder[],
    supplierIds: string[],
    shipments: Shipment[]
): SupplierScorecard[] {
    interface Accumulator {
        spend: number;
        listValue: number;
        delivered: number;
        onTime: number;
        orderCount: number;
    }
    const empty = (): Accumulator => ({ spend: 0, listValue: 0, delivered: 0, onTime: 0, orderCount: 0 });
    const bySupplier = new Map(supplierIds.map((id) => [id, empty()]));

    // Same delivered window and derivation as the quality-cost chart, so column and chart cannot disagree.
    const rejectedBySupplier = new Map(
        qualityCost(performanceOrders, supplierIds).map((row) => [row.supplierId, row.rejectedValue])
    );

    // Commercial figures follow the selected period: this is what she is buying now.
    for (const order of periodOrders) {
        const acc = bySupplier.get(order.supplierId);
        if (!acc) continue;
        acc.spend += order.totalCost;
        acc.listValue += order.quantity * (LIST_PRICE_BY_MATERIAL.get(order.material) ?? order.unitCost);
        acc.orderCount += 1;
    }

    // Delivery performance uses the rolling window: lead times run to six weeks, so a single period holds barely any deliveries.
    for (const order of performanceOrders) {
        const acc = bySupplier.get(order.supplierId);
        if (!acc || order.actualDate == null) continue;
        acc.delivered += 1;
        if (order.actualDate <= order.expectedDate) acc.onTime += 1;
    }

    // Genuinely late shipments only: a flag every supplier carries says nothing about which relationship needs work.
    const lateBySupplier = new Map<string, number>();
    for (const shipment of shipments) {
        if (shipment.status !== 'Late') continue;
        lateBySupplier.set(shipment.supplierId, (lateBySupplier.get(shipment.supplierId) ?? 0) + 1);
    }

    const nowMs = DEMO_NOW.getTime();

    return supplierIds
        .map<SupplierScorecard>((supplierId) => {
            const supplier = SUPPLIER_BY_ID.get(supplierId)!;
            const acc = bySupplier.get(supplierId)!;
            const measured = acc.delivered >= MIN_DELIVERIES_FOR_RATE;
            const onTimeRate = measured ? acc.onTime / acc.delivered : supplier.reliability;
            const daysToRenewal = daysBetween(nowMs, supplier.contractRenewal);
            const lateShipments = lateBySupplier.get(supplierId) ?? 0;

            // Worst-first, so the flag names the single thing most worth acting on.
            let flag: SupplierScorecard['flag'] = 'On track';
            if (lateShipments > 0) flag = 'Late shipment open';
            else if (daysToRenewal <= RENEWAL_WARN_DAYS) flag = 'Renewal due';
            else if (onTimeRate < ON_TIME_TARGET) flag = 'Delivery risk';
            else if (supplier.qualityScore < QUALITY_TARGET) flag = 'Quality watch';

            return {
                supplierId,
                supplier: supplier.name,
                country: supplier.country,
                priceIndex: acc.listValue > 0 ? acc.spend / acc.listValue : supplier.priceIndex,
                onTimeRate,
                rateIsContracted: !measured,
                deliveredCount: acc.delivered,
                spend: acc.spend,
                orderCount: acc.orderCount,
                qualityScore: supplier.qualityScore,
                // Zero, not undefined: no receipts means nothing was rejected, which is a real figure.
                rejectedValue: rejectedBySupplier.get(supplierId) ?? 0,
                priceVariance: supplier.priceVariance,
                contractRenewal: supplier.contractRenewal,
                daysToRenewal,
                lateShipments,
                flag,
            };
        })
        .sort((a, b) => b.spend - a.spend);
}

// --- trend series -------------------------------------------------------------

/**
 * Calendar months spanning `range`, oldest first.
 *
 * Built by advancing the month field rather than by adding a fixed number of days: a
 * 30-day step drifts off the first of the month, and across a DST boundary would put two
 * buckets in the same month.
 */
export function monthBuckets(range: DateRange): MonthBucket[] {
    const buckets: MonthBucket[] = [];
    const cursor = new Date(range.start.getFullYear(), range.start.getMonth(), 1);
    const last = new Date(range.end.getFullYear(), range.end.getMonth(), 1);
    while (cursor <= last) {
        const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
        buckets.push({
            start: cursor.getTime(),
            end: next.getTime(),
            label: cursor.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        });
        cursor.setMonth(cursor.getMonth() + 1);
    }
    return buckets;
}

/**
 * Whole weeks tiled forward from `range.start`, oldest first.
 *
 * For a window too short to hold a useful number of months — a single quarter is two bars, one of
 * them unfinished — where a month is the natural grain for a year.
 *
 * Tiled from the window's own start rather than snapped to Mondays, so the buckets line up with
 * the period being read: a quarter's first bar starts on the first day of the quarter. The
 * trailing partial week is dropped rather than drawn short, for the same reason the monthly trend
 * drops the current month.
 */
export function weekBuckets(range: DateRange): TimeBucket[] {
    const buckets: TimeBucket[] = [];
    const start = new Date(range.start.getFullYear(), range.start.getMonth(), range.start.getDate());
    for (let index = 0; ; index += 1) {
        const from = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index * 7);
        const to = new Date(start.getFullYear(), start.getMonth(), start.getDate() + (index + 1) * 7);
        if (to.getTime() > range.end.getTime() + 1) break;
        buckets.push({
            start: from.getTime(),
            end: to.getTime(),
            label: from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        });
    }
    return buckets;
}

/**
 * Which bucket an instant falls in, or `-1` outside them all.
 *
 * Buckets are contiguous and ordered, so this is a binary search rather than a scan — and it works
 * for any grain, which is what lets one aggregation serve both the monthly and the weekly trend.
 */
function bucketIndexOf(buckets: TimeBucket[], time: number): number {
    let low = 0;
    let high = buckets.length - 1;
    while (low <= high) {
        const mid = (low + high) >> 1;
        if (time < buckets[mid].start) high = mid - 1;
        else if (time >= buckets[mid].end) low = mid + 1;
        else return mid;
    }
    return -1;
}

/**
 * Committed spend per bucket, split by subcategory.
 *
 * Bucketed by order date: this is what she committed in each bucket, which is the figure a run
 * rate is read off. Every subcategory gets a series in every bucket, zero included — a month she
 * bought no galvanized steel really is a zero, unlike a delivery rate, which would be `null`.
 */
export function spendByBucketAndSubcategory(
    commodity: Commodity,
    orders: PurchaseOrder[],
    buckets: TimeBucket[]
): SpendTrendRow[] {
    const subcategories = SUBCATEGORIES[commodity];
    const rows = buckets.map<SpendTrendRow>((bucket) => {
        const row: SpendTrendRow = { start: bucket.start, label: bucket.label };
        for (const subcategory of subcategories) row[subcategory] = 0;
        return row;
    });

    for (const order of orders) {
        const index = bucketIndexOf(buckets, order.orderDate);
        if (index === -1) continue;
        const row = rows[index];
        // An order from another commodity has no column here, and must not create one.
        if (typeof row[order.subcategory] !== 'number') continue;
        row[order.subcategory] = (row[order.subcategory] as number) + order.totalCost;
    }
    return rows;
}

/**
 * Monthly on-time rate per supplier, bucketed by *delivery* date rather than order date —
 * the question is when performance happened, not when the order was raised.
 *
 * A month with no deliveries is `null` rather than zero: a supplier that shipped nothing in
 * August did not achieve 0% in August, and plotting it as such would invent a collapse.
 */
export function onTimeByMonth(
    orders: PurchaseOrder[],
    supplierIds: string[],
    months: MonthBucket[]
): Map<string, OnTimePoint[]> {
    const result = new Map<string, OnTimePoint[]>(
        supplierIds.map((id) => [
            id,
            months.map((month) => ({ month: month.start, label: month.label, rate: null, delivered: 0 })),
        ])
    );
    const indexOfMonth = new Map(months.map((month, index) => [month.start, index]));
    const onTimeCounts = new Map<string, number[]>(supplierIds.map((id) => [id, months.map(() => 0)]));

    for (const order of orders) {
        if (order.actualDate == null) continue;
        const points = result.get(order.supplierId);
        if (!points) continue;
        const delivered = new Date(order.actualDate);
        const index = indexOfMonth.get(new Date(delivered.getFullYear(), delivered.getMonth(), 1).getTime());
        if (index == null) continue;
        points[index].delivered += 1;
        if (order.actualDate <= order.expectedDate) onTimeCounts.get(order.supplierId)![index] += 1;
    }

    for (const [supplierId, points] of result) {
        const onTime = onTimeCounts.get(supplierId)!;
        points.forEach((point, index) => {
            point.rate = point.delivered > 0 ? onTime[index] / point.delivered : null;
        });
    }
    return result;
}

/**
 * Every delivery-slip observation per supplier — how many days late each delivery actually was.
 *
 * This is the question an on-time percentage hides. Two suppliers can both hit 90% while one misses
 * by a day and the other by three weeks, and only the second will stop a production line. Suppliers
 * with too few deliveries to describe a distribution are omitted rather than drawn from a handful.
 */
export function slipDistributions(orders: PurchaseOrder[], supplierIds: string[], minSample = 5): SlipDistribution[] {
    const bySupplier = new Map<string, number[]>(supplierIds.map((id) => [id, []]));
    for (const order of orders) {
        if (order.actualDate == null) continue;
        bySupplier.get(order.supplierId)?.push(daysBetween(order.expectedDate, order.actualDate));
    }

    return supplierIds
        .map((supplierId) => ({
            supplierId,
            supplier: SUPPLIER_BY_ID.get(supplierId)!.name,
            slips: bySupplier.get(supplierId)!.sort((a, b) => a - b),
        }))
        .filter(({ slips }) => slips.length >= minSample);
}

/**
 * What each supplier's rejected material cost, over the delivered orders in scope.
 *
 * Values the shortfall at the price she paid rather than at list: the money already left the
 * business at her negotiated price, and that is the figure a supplier conversation is about.
 * Suppliers with no delivery record in scope are dropped rather than shown as a costless zero.
 */
export function qualityCost(orders: PurchaseOrder[], supplierIds: string[]): QualityCost[] {
    const totals = new Map(
        supplierIds.map((id) => [id, { rejectedValue: 0, delivered: 0, accepted: 0, deliveredCount: 0 }])
    );

    for (const order of orders) {
        if (order.acceptedQuantity == null) continue;
        const acc = totals.get(order.supplierId);
        if (!acc) continue;
        acc.rejectedValue += (order.quantity - order.acceptedQuantity) * order.unitCost;
        acc.delivered += order.quantity;
        acc.accepted += order.acceptedQuantity;
        acc.deliveredCount += 1;
    }

    return supplierIds
        .filter((id) => totals.get(id)!.deliveredCount > 0)
        .map((supplierId) => {
            const acc = totals.get(supplierId)!;
            return {
                supplierId,
                supplier: SUPPLIER_BY_ID.get(supplierId)!.name,
                rejectedValue: acc.rejectedValue,
                acceptedRate: acc.delivered > 0 ? acc.accepted / acc.delivered : 1,
                deliveredCount: acc.deliveredCount,
            };
        });
}

/**
 * Cumulative committed spend against a straight-line budget pace, across a whole period.
 *
 * Deliberately runs to the end of the period rather than stopping at today: the useful reading
 * is not just how much is spent but where the current trajectory lands, and that needs the
 * remaining runway on the chart. `committed` stops at today so the actual line does not appear
 * to flatten into the future.
 */
export function spendBurnUp(orders: PurchaseOrder[], range: DateRange, budget: number, asOf: Date): BurnUpPoint[] {
    const start = new Date(range.start.getFullYear(), range.start.getMonth(), range.start.getDate());
    const dayCount = Math.max(1, calendarDaysBetween(start, range.end) + 1);
    const perDay = [...orders]
        .sort((a, b) => a.orderDate - b.orderDate)
        .reduce((acc, order) => {
            const day = calendarDaysBetween(start, order.orderDate);
            acc[day] = (acc[day] ?? 0) + order.totalCost;
            return acc;
        }, [] as number[]);

    const asOfDay = calendarDaysBetween(start, asOf);
    let running = 0;
    return Array.from({ length: dayCount }, (_, day) => {
        running += perDay[day] ?? 0;
        return {
            date: new Date(start.getFullYear(), start.getMonth(), start.getDate() + day),
            committed: day <= asOfDay ? running : null,
            pace: (budget * (day + 1)) / dayCount,
        };
    });
}

/**
 * Monthly realised price per supplier, by order date.
 *
 * Returns both an absolute price per unit and a share of catalogue list, because only one is
 * meaningful at a time — the same distinction the scorecard draws. Within a single steel
 * subcategory every material shares a unit, so the absolute price is comparable; across her
 * whole commodity it mixes tonnes and kilos and only the index is.
 */
export function priceByMonth(
    orders: PurchaseOrder[],
    supplierIds: string[],
    months: MonthBucket[]
): Map<string, PricePoint[]> {
    const blank = () => months.map((month) => ({ month: month.start, label: month.label, price: null, index: null }));
    const result = new Map<string, PricePoint[]>(supplierIds.map((id) => [id, blank()]));
    const indexOfMonth = new Map(months.map((month, index) => [month.start, index]));
    const totals = new Map<string, { spend: number; volume: number; listValue: number }[]>(
        supplierIds.map((id) => [id, months.map(() => ({ spend: 0, volume: 0, listValue: 0 }))])
    );

    for (const order of orders) {
        const rows = totals.get(order.supplierId);
        if (!rows) continue;
        const ordered = new Date(order.orderDate);
        const index = indexOfMonth.get(new Date(ordered.getFullYear(), ordered.getMonth(), 1).getTime());
        if (index == null) continue;
        rows[index].spend += order.totalCost;
        rows[index].volume += order.quantity;
        rows[index].listValue += order.quantity * (LIST_PRICE_BY_MATERIAL.get(order.material) ?? order.unitCost);
    }

    for (const [supplierId, points] of result) {
        const rows = totals.get(supplierId)!;
        points.forEach((point, index) => {
            const row = rows[index];
            point.price = row.volume > 0 ? row.spend / row.volume : null;
            point.index = row.listValue > 0 ? row.spend / row.listValue : null;
        });
    }
    return result;
}

/**
 * Every monthly metric the supplier trend chart plots, per supplier.
 *
 * Composed from `priceByMonth` and `onTimeByMonth` rather than recomputing them, so the trend chart
 * and the heatmap, sparklines and scorecard can never disagree about the same month.
 *
 * Note the two bases, which is why the two sets are passed separately: price is bucketed by order
 * date, on-time and quality by delivery date. That is deliberate — a price is agreed when
 * the order is raised, whereas performance is only known on receipt — so each set has to be scoped
 * by the date it is bucketed on, and a month can hold a price with no delivery record, or the
 * reverse.
 */
export function supplierTrendByMonth(
    ordered: PurchaseOrder[],
    delivered: PurchaseOrder[],
    supplierIds: string[],
    months: MonthBucket[]
): Map<string, SupplierTrendPoint[]> {
    const prices = priceByMonth(ordered, supplierIds, months);
    const onTime = onTimeByMonth(delivered, supplierIds, months);
    const indexOfMonth = new Map(months.map((month, index) => [month.start, index]));
    const received = new Map<string, { delivered: number; accepted: number }[]>(
        supplierIds.map((id) => [id, months.map(() => ({ delivered: 0, accepted: 0 }))])
    );

    const monthIndexOf = (timestamp: number) => {
        const date = new Date(timestamp);
        return indexOfMonth.get(new Date(date.getFullYear(), date.getMonth(), 1).getTime());
    };

    for (const order of delivered) {
        if (order.actualDate == null || order.acceptedQuantity == null) continue;
        const row = received.get(order.supplierId);
        if (!row) continue;
        const deliveredIn = monthIndexOf(order.actualDate);
        if (deliveredIn == null) continue;
        row[deliveredIn].delivered += order.quantity;
        row[deliveredIn].accepted += order.acceptedQuantity;
    }

    return new Map(
        supplierIds.map((supplierId) => [
            supplierId,
            months.map((month, index) => {
                const price = prices.get(supplierId)![index];
                const quality = received.get(supplierId)![index];
                return {
                    month: month.start,
                    label: month.label,
                    price: price.price,
                    index: price.index,
                    onTimeRate: onTime.get(supplierId)![index].rate,
                    qualityRate: quality.delivered > 0 ? quality.accepted / quality.delivered : null,
                };
            }),
        ])
    );
}

/**
 * Spend per supplier within each subcategory, for a normalised stacked bar.
 *
 * Answers the single-sourcing question directly: a subcategory that is one full-width band is a
 * subcategory with no second source. The sunburst carries the same data but as angles inside
 * separate parents, which is much harder to compare across subcategories.
 */
export function supplierShareBySubcategory(
    commodity: Commodity,
    orders: PurchaseOrder[],
    supplierIds: string[]
): SupplierShareRow[] {
    const names = supplierIds.map((id) => SUPPLIER_BY_ID.get(id)!.name);
    const owned = new Set(supplierIds);

    return SUBCATEGORIES[commodity].map((subcategory) => {
        const row: SupplierShareRow = { subcategory };
        for (const name of names) row[name] = 0;
        for (const order of orders) {
            if (order.subcategory !== subcategory || !owned.has(order.supplierId)) continue;
            row[order.supplierName] = (row[order.supplierName] as number) + order.totalCost;
        }
        return row;
    });
}

// --- shipment tracking --------------------------------------------------------

/**
 * Places a shipment on its route at instant `now`.
 *
 * Live carrier positions are proprietary, so the marker's position is interpolated along the same
 * arc `routeSegments` draws — which is what keeps a marker on its own line. The dataset is static,
 * so this is evaluated once at `DEMO_NOW` rather than driven by a clock.
 */
export function trackShipment(shipment: Shipment, now: number): TrackedShipment {
    const span = shipment.projectedDate - shipment.departDate;
    // A shipment past its projection sits at the destination waiting to be received.
    const progress = span > 0 ? Math.min(1, Math.max(0, (now - shipment.departDate) / span)) : 1;
    return {
        ...shipment,
        progress,
        position: interpolateRoute(shipment.origin, shipment.destination, progress),
        daysToRequired: daysBetween(now, shipment.requiredDate),
        slackDays: daysBetween(shipment.projectedDate, shipment.requiredDate),
    };
}
