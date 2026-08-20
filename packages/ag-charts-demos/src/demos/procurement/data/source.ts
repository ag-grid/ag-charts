// The dataset boundary.
//
// Everything the workspace treats as *given* — the supplier master, the plants, the
// commodity-manager assignments, the material catalogue, the budgets, the policy
// thresholds, the order book and its shipments — lives in the JSON files beside this
// module. This module is the only place that reads them: it parses the raw records,
// resolves the relative dates, checks referential integrity and hands `data.ts` a typed
// dataset. Nothing downstream knows where the numbers came from.
//
// Replacing the static files with a live procurement system therefore means writing one
// more `loadProcurementDataset` — the raw record types below are the contract that
// endpoint has to satisfy. See `README.md` in this folder for the async recipe.
import type { Commodity, CommodityManager, Material, Plant, Supplier, Unit } from '../types';
import budgetsJson from './commodity-budgets.json';
import managersJson from './commodity-managers.json';
import datasetJson from './dataset.json';
import materialCatalogueJson from './material-catalogue.json';
import plantsJson from './plants.json';
import policyJson from './policy.json';
import purchaseOrdersJson from './purchase-orders.json';
import shipmentsJson from './shipments.json';
import suppliersJson from './suppliers.json';

// --- raw records: the shape an external source has to return ------------------

/**
 * When a contract comes up for renewal.
 *
 * A real feed returns an absolute date, and an ISO string is accepted for exactly that
 * case. The static dataset states its renewals *relative to the demo's fixed now*
 * instead, so the whole book slides with `now` rather than expiring: the workspace opens
 * on a supplier whose contract lapses in eighteen days, and that has to stay true.
 */
export type RenewalDate = string | { daysFromNow: number } | { monthsFromNow: number; dayOfMonth?: number };

export interface RawSupplier extends Omit<Supplier, 'contractRenewal'> {
    contractRenewal: RenewalDate;
}

/** A manager assignment; `commodity` is validated against the catalogue rather than typed. */
export interface RawCommodityManager extends Omit<CommodityManager, 'commodity'> {
    commodity: string;
}

/** A material as the catalogue states it — its commodity and subcategory come from its position. */
export type RawMaterial = Pick<Material, 'name' | 'listPrice' | 'supplierIds'> & { unit: string };

export interface RawCatalogueEntry {
    commodity: string;
    subcategories: { subcategory: string; materials: RawMaterial[] }[];
}

export interface RawBudget {
    commodity: string;
    annual: number;
    quarterly: number;
}

export interface RawPolicy {
    renewalWarnDays: number;
    onTimeTarget: number;
    qualityTarget: number;
}

/**
 * A purchase-order line as the source states it.
 *
 * Normalised, the way a system of record holds it: the material, supplier and plant are
 * references, and the figures that follow from them — the commodity, the material's unit,
 * the line total, the delivery status — are the engine's to derive, so a record cannot
 * disagree with itself. Dates are absolute ISO instants.
 */
export interface RawPurchaseOrder {
    poId: string;
    supplierId: string;
    /** `commodity/subcategory/name`, matching a material in the catalogue. */
    materialId: string;
    plantId: string;
    quantity: number;
    unitCost: number;
    orderDate: string;
    /** The date promised at the time of order. */
    expectedDate: string;
    /** When the goods were received, or `null` while the line is in flight. */
    actualDate: string | null;
    /** Quantity passed by incoming inspection; `null` until receipt. */
    acceptedQuantity: number | null;
    /** The shipment carrying this line, or `null` if it has not been despatched. */
    shipmentId: string | null;
}

/**
 * A consolidated shipment: one carrier movement covering the order lines that reference it.
 *
 * Carries only what the carrier reports: the lane it runs and the dates it runs on. What is
 * aboard — the value, the line count, the materials, and from those its status — is derived
 * from the lines that reference it, so every one of them has to run the same lane.
 */
export interface RawShipment {
    shipmentId: string;
    supplierId: string;
    plantId: string;
    departDate: string;
    /** Current arrival projection, which a logged delay has already moved. */
    projectedDate: string;
    /** The date production needs the goods by. */
    requiredDate: string;
    carrierDelay: boolean;
}

export interface RawDatasetMeta {
    /** The instant the dataset is a snapshot at, as an absolute ISO instant. */
    now: string;
}

/** Everything a source has to supply. One object, so an API implementation is one function. */
export interface RawDataset {
    plants: Plant[];
    suppliers: RawSupplier[];
    managers: RawCommodityManager[];
    catalogue: RawCatalogueEntry[];
    budgets: RawBudget[];
    policy: RawPolicy;
    meta: RawDatasetMeta;
    purchaseOrders: RawPurchaseOrder[];
    shipments: RawShipment[];
}

// --- resolved dataset: what the engine consumes -------------------------------

export interface CommodityBudget {
    annual: number;
    quarterly: number;
}

/** A purchase-order line with its dates parsed and its references checked. */
export interface PurchaseOrderRecord extends Omit<RawPurchaseOrder, 'orderDate' | 'expectedDate' | 'actualDate'> {
    orderDate: number;
    expectedDate: number;
    actualDate: number | null;
}

/** A shipment with its dates parsed and its references checked. */
export interface ShipmentRecord extends Omit<RawShipment, 'departDate' | 'projectedDate' | 'requiredDate'> {
    departDate: number;
    projectedDate: number;
    requiredDate: number;
}

export interface ProcurementDataset {
    /** The instant the whole dataset is anchored to; every relative date resolves against it. */
    now: Date;
    /** Commodities in catalogue order — the order the sunburst and the KPI strip rely on. */
    commodities: Commodity[];
    subcategories: Record<Commodity, string[]>;
    materials: Material[];
    plants: Plant[];
    suppliers: Supplier[];
    managers: CommodityManager[];
    budgets: Record<Commodity, CommodityBudget>;
    policy: RawPolicy;
    /** The order book, in source order. */
    purchaseOrders: PurchaseOrderRecord[];
    /** Shipments in flight, in source order. */
    shipments: ShipmentRecord[];
}

// --- resolution ---------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;

const UNITS: Unit[] = ['kg', 'tonne', 'm', 'units', 'pallets', 'litre'];

/**
 * The `Commodity` union as a runtime list, so a feed's strings can be checked against it.
 *
 * `Commodity` is closed, and the workspace relies on that: budgets and subcategories are held as
 * `Record<Commodity, …>` and read without a fallback, and the manager assignment that scopes the
 * whole workspace is keyed on it. A feed naming a seventh commodity can be internally consistent —
 * catalogue, budget and manager all agreeing — and would resolve into values outside the union
 * that no downstream map has an entry for, so the catalogue is checked against this list before
 * any of it is treated as a `Commodity`.
 */
const COMMODITIES: Commodity[] = [
    'Steel & Metals',
    'Electronics & Components',
    'Plastics & Polymers',
    'Packaging Materials',
    'Chemicals & Coatings',
    'Fasteners & Hardware',
];

function fail(message: string): never {
    throw new Error(`Procurement dataset: ${message}`);
}

function resolveRenewal(spec: RenewalDate, now: Date, supplierId: string): number {
    if (typeof spec === 'string') {
        const parsed = new Date(spec).getTime();
        if (Number.isNaN(parsed)) fail(`supplier ${supplierId} has an unparseable contractRenewal "${spec}"`);
        return parsed;
    }
    if ('daysFromNow' in spec) return now.getTime() + spec.daysFromNow * DAY_MS;
    // Month arithmetic on the date parts, not a day count: a fixed number of days drifts off
    // the day of the month, which is what a renewal date is stated as.
    return new Date(now.getFullYear(), now.getMonth() + spec.monthsFromNow, spec.dayOfMonth ?? now.getDate()).getTime();
}

/**
 * Turns raw records into the typed, cross-checked dataset the engine runs on.
 *
 * The checks are here rather than trusted upstream because this is the seam an external
 * source plugs into: a renamed commodity or a supplier id that no longer resolves should
 * stop the app with a sentence naming the record, not surface as an empty sunburst ring.
 */
export function resolveDataset(raw: RawDataset): ProcurementDataset {
    const now = new Date(raw.meta.now);
    if (Number.isNaN(now.getTime())) fail(`unparseable meta.now "${raw.meta.now}"`);

    if (raw.catalogue.length === 0) fail('the material catalogue is empty');
    // The one place a feed's string becomes a `Commodity`. Managers and budgets are checked against
    // `knownCommodity` below, so guarding the catalogue here is what makes their casts safe too.
    const commodities = raw.catalogue.map((entry) => {
        if (!COMMODITIES.includes(entry.commodity as Commodity)) {
            fail(`the material catalogue defines "${entry.commodity}", which is not a commodity this build supports`);
        }
        return entry.commodity as Commodity;
    });
    const knownCommodity = new Set<string>(commodities);
    if (knownCommodity.size !== commodities.length) fail('the material catalogue lists a commodity twice');

    const suppliers: Supplier[] = raw.suppliers.map((supplier) => ({
        ...supplier,
        contractRenewal: resolveRenewal(supplier.contractRenewal, now, supplier.supplierId),
    }));
    const knownSupplier = new Set(suppliers.map((supplier) => supplier.supplierId));
    if (knownSupplier.size !== suppliers.length) fail('the supplier master lists a supplierId twice');

    const requireSuppliers = (ids: string[], owner: string) => {
        for (const id of ids) if (!knownSupplier.has(id)) fail(`${owner} references unknown supplier "${id}"`);
    };

    const subcategories = {} as Record<Commodity, string[]>;
    const materials: Material[] = [];
    for (const entry of raw.catalogue) {
        const commodity = entry.commodity as Commodity;
        subcategories[commodity] = entry.subcategories.map(({ subcategory }) => subcategory);
        for (const { subcategory, materials: rawMaterials } of entry.subcategories) {
            for (const material of rawMaterials) {
                const where = `material "${material.name}" (${commodity}/${subcategory})`;
                if (!UNITS.includes(material.unit as Unit)) fail(`${where} has unknown unit "${material.unit}"`);
                requireSuppliers(material.supplierIds, where);
                materials.push({
                    // Commodity and subcategory are part of the id, so a material name can repeat
                    // across commodities the way a real catalogue's does.
                    materialId: `${commodity}/${subcategory}/${material.name}`,
                    name: material.name,
                    commodity,
                    subcategory,
                    unit: material.unit as Unit,
                    listPrice: material.listPrice,
                    supplierIds: material.supplierIds,
                });
            }
        }
    }

    const managers: CommodityManager[] = raw.managers.map((manager) => {
        if (!knownCommodity.has(manager.commodity)) {
            fail(`manager "${manager.managerId}" owns unknown commodity "${manager.commodity}"`);
        }
        requireSuppliers(manager.supplierIds, `manager "${manager.managerId}"`);
        return { ...manager, commodity: manager.commodity as Commodity };
    });

    const budgets = {} as Record<Commodity, CommodityBudget>;
    for (const { commodity, annual, quarterly } of raw.budgets) {
        if (!knownCommodity.has(commodity)) fail(`a budget names unknown commodity "${commodity}"`);
        // Assigned by key, so a second row for a commodity would quietly win on source order and
        // every figure measured against the allocation would follow whichever row happened to be
        // last. Which of the two was meant is the feed's to settle, not this module's.
        if (budgets[commodity as Commodity] != null) fail(`the budget table states "${commodity}" twice`);
        budgets[commodity as Commodity] = { annual, quarterly };
    }

    const knownPlant = new Set(raw.plants.map((plant) => plant.plantId));
    const materialById = new Map(materials.map((material) => [material.materialId, material]));
    const shipmentById = new Map(raw.shipments.map((shipment) => [shipment.shipmentId, shipment]));
    if (shipmentById.size !== raw.shipments.length) fail('the shipment feed lists a shipmentId twice');

    const instant = (value: string, where: string) => {
        const parsed = new Date(value).getTime();
        if (Number.isNaN(parsed)) fail(`${where} has an unparseable date "${value}"`);
        return parsed;
    };

    const shipments = raw.shipments.map<ShipmentRecord>((shipment) => {
        const where = `shipment ${shipment.shipmentId}`;
        if (!knownSupplier.has(shipment.supplierId))
            fail(`${where} references unknown supplier "${shipment.supplierId}"`);
        if (!knownPlant.has(shipment.plantId)) fail(`${where} references unknown plant "${shipment.plantId}"`);
        const departDate = instant(shipment.departDate, where);
        const projectedDate = instant(shipment.projectedDate, where);
        const requiredDate = instant(shipment.requiredDate, where);
        // Arrival follows departure. `trackShipment` interpolates the map marker across that span
        // and treats a non-positive one as "arrived", so a backwards projection does not fail — it
        // parks the marker on the destination and reports a shipment as complete that never ran.
        //
        // Only this pair is ordered. A required date before either is a shipment that is already
        // late, which is a real state the workspace is built to show, not a bad record.
        if (projectedDate < departDate) {
            fail(
                `${where} is projected to arrive on ${shipment.projectedDate}, ` +
                    `before it departs on ${shipment.departDate}`
            );
        }
        return { ...shipment, departDate, projectedDate, requiredDate };
    });

    const seenPo = new Set<string>();
    const purchaseOrders = raw.purchaseOrders.map<PurchaseOrderRecord>((order) => {
        const where = `purchase order ${order.poId}`;
        if (seenPo.has(order.poId)) fail(`the order book lists ${order.poId} twice`);
        seenPo.add(order.poId);
        if (!knownSupplier.has(order.supplierId)) fail(`${where} references unknown supplier "${order.supplierId}"`);
        const material = materialById.get(order.materialId);
        if (material == null) fail(`${where} references unknown material "${order.materialId}"`);
        // The catalogue's approved list is not a description of the order book, it is what the
        // sourcing views are built from: the sunburst lays out one leaf per approved supplier and
        // then looks spend up against it, so a line from a supplier the catalogue does not approve
        // has no leaf to land in and drops out of the chart while still counting in the grid and
        // the tiles. Approval has to hold on the line, not just alongside it.
        if (!material.supplierIds.includes(order.supplierId)) {
            fail(
                `${where} buys "${order.materialId}" from ${order.supplierId}, which the catalogue ` +
                    `does not approve for it (${material.supplierIds.join(', ')})`
            );
        }
        if (!knownPlant.has(order.plantId)) fail(`${where} references unknown plant "${order.plantId}"`);
        if (order.shipmentId != null) {
            const shipment = shipmentById.get(order.shipmentId);
            if (shipment == null) fail(`${where} references unknown shipment "${order.shipmentId}"`);
            // A shipment is one carrier movement down one lane, and its contents are its lines':
            // value, line count and materials are all summed from them, while the lane itself comes
            // from the shipment record. A line on someone else's shipment therefore books its spend
            // against that supplier's lane and into that supplier's manager's scope — so the two
            // have to agree on the lane before anything downstream reads either.
            if (shipment.supplierId !== order.supplierId || shipment.plantId !== order.plantId) {
                fail(
                    `${where} is on shipment ${shipment.shipmentId}, which runs ` +
                        `${shipment.supplierId} → ${shipment.plantId} rather than the line's ` +
                        `${order.supplierId} → ${order.plantId}`
                );
            }
            // Goods cannot leave before they are on order. A consolidation waits for every line it
            // carries, so the departure is after the last of them — and the map would otherwise
            // show a line already in transit on a date its order had not been raised.
            if (instant(shipment.departDate, where) < instant(order.orderDate, where)) {
                fail(
                    `${where} was ordered on ${order.orderDate}, after shipment ` +
                        `${shipment.shipmentId} departed on ${shipment.departDate}`
                );
            }
        }
        // A receipt is the pair: the date it landed and what passed inspection. Half of one
        // would leave a line that is delivered but has no accepted quantity, or the reverse.
        if ((order.actualDate == null) !== (order.acceptedQuantity == null)) {
            fail(`${where} has an actualDate and an acceptedQuantity that disagree about receipt`);
        }
        // A rejected part is scrapped or returned, never replaced on the line. Above the ordered
        // quantity the shortfall goes negative and the scorecard bills rejected material as a credit.
        if (order.acceptedQuantity != null && order.acceptedQuantity > order.quantity) {
            fail(`${where} accepted ${order.acceptedQuantity} of ${order.quantity} ordered`);
        }
        const orderDate = instant(order.orderDate, where);
        const expectedDate = instant(order.expectedDate, where);
        const actualDate = order.actualDate == null ? null : instant(order.actualDate, where);
        // A promise and a receipt both belong to an order that has been raised. Nothing downstream
        // guards against the reverse: the quoted lead time is `expectedDate - orderDate` and the
        // realised one `actualDate - orderDate`, so either would go negative and be averaged into
        // the lead-time and slip charts as a real figure rather than rejected as an impossible one.
        // Same-instant is allowed — an order placed and received the same day is ordinary.
        if (expectedDate < orderDate) {
            fail(`${where} is expected on ${order.expectedDate}, before it was ordered on ${order.orderDate}`);
        }
        if (actualDate != null && actualDate < orderDate) {
            fail(`${where} was received on ${order.actualDate}, before it was ordered on ${order.orderDate}`);
        }
        return { ...order, orderDate, expectedDate, actualDate };
    });

    for (const commodity of commodities) {
        if (subcategories[commodity].length === 0) fail(`commodity "${commodity}" has no subcategories`);
        if (budgets[commodity] == null) fail(`commodity "${commodity}" has no budget`);
    }

    return {
        now,
        commodities,
        subcategories,
        materials,
        plants: raw.plants,
        suppliers,
        managers,
        budgets,
        policy: raw.policy,
        purchaseOrders,
        shipments,
    };
}

/** The bundled dataset: the JSON files in this folder, exactly as an endpoint would return them. */
export const STATIC_DATASET: RawDataset = {
    plants: plantsJson,
    suppliers: suppliersJson,
    managers: managersJson,
    catalogue: materialCatalogueJson,
    budgets: budgetsJson,
    policy: policyJson,
    meta: datasetJson,
    purchaseOrders: purchaseOrdersJson,
    shipments: shipmentsJson,
};

let loaded: ProcurementDataset | undefined;

/**
 * The dataset the engine runs on, resolved once.
 *
 * The single call site to change when the demo is pointed at a synchronous source: swap
 * `STATIC_DATASET` for the records that source returns, keeping the `RawDataset` shape. An
 * asynchronous source installs its records through `setProcurementDataset` instead.
 */
export function loadProcurementDataset(): ProcurementDataset {
    loaded ??= resolveDataset(STATIC_DATASET);
    return loaded;
}

/**
 * Installs a dataset fetched elsewhere, for a source that cannot be read synchronously.
 *
 * Has to happen before anything imports `../data.ts`, because the engine and the access
 * layer both derive module-level constants from the dataset at load — hence the throw
 * rather than a silent swap that would leave half the workspace on the old figures. See
 * `README.md` for the entry-point recipe that satisfies that ordering.
 */
export function setProcurementDataset(dataset: ProcurementDataset): void {
    if (loaded) fail('the dataset was already loaded; install an external dataset before importing the engine');
    loaded = dataset;
}
