// Shared types for the commodity-manager workspace. Modelled on the entities a
// manufacturing procurement system actually holds — purchase orders, suppliers,
// shipments — plus the commodity-manager assignment that scopes them to one person.

/**
 * A purchasing commodity. Each one is owned end-to-end by a single commodity manager,
 * which is what makes it the unit of access control — see `CommodityManager`.
 */
export type Commodity =
    | 'Steel & Metals'
    | 'Electronics & Components'
    | 'Plastics & Polymers'
    | 'Packaging Materials'
    | 'Chemicals & Coatings'
    | 'Fasteners & Hardware';

/**
 * Delivery state of a purchase order.
 *
 * `Delivered` is terminal and records what happened; the other three are live
 * projections for an order still in flight. Kept as one enum because that is how the
 * PO grid's Status column is specified, and how a buyer reads it.
 */
export type PoStatus = 'On time' | 'At risk' | 'Late' | 'Delivered';

/** The live states a shipment can be in — the terminal `Delivered` is excluded. */
export type ShipmentStatus = 'On time' | 'At risk' | 'Late';

/** Unit of measure a material is bought in. */
export type Unit = 'kg' | 'tonne' | 'm' | 'units' | 'pallets' | 'litre';

/** A geographic point, in the lat/lon order AG Charts' map series expect. */
export interface GeoPoint {
    latitude: number;
    longitude: number;
}

/**
 * A commodity manager and the suppliers assigned to them.
 *
 * This assignment is the access model: the workspace resolves one manager and every
 * query is scoped to their `supplierIds`, so records belonging to another manager are
 * never fetched rather than fetched and filtered out.
 */
export interface CommodityManager {
    managerId: string;
    name: string;
    title: string;
    commodity: Commodity;
    supplierIds: string[];
}

/** A vendor, with the negotiated terms and performance record a scorecard is built from. */
export interface Supplier {
    supplierId: string;
    name: string;
    /** Country name, matching the world topology's `properties.name`. */
    country: string;
    city: string;
    origin: GeoPoint;
    /** Baseline on-time rate as a 0–1 fraction, before per-order noise. */
    reliability: number;
    /** Multiplier on a material's list price: <1 undercuts the market, >1 is a premium. */
    priceIndex: number;
    /** Typical transit time from this supplier to a plant, in days. */
    leadTimeDays: number;
    /** Incoming-quality acceptance rate as a 0–1 fraction. */
    qualityScore: number;
    /**
     * Realised price against the negotiated contract price, as a signed fraction: `0.03`
     * is running 3% over contract. Distinct from `priceIndex`, which is the position
     * against the open market.
     */
    priceVariance: number;
    /** When the current contract comes up for renewal. */
    contractRenewal: number;
}

/** A receiving manufacturing site — every shipment's destination. */
export interface Plant {
    plantId: string;
    name: string;
    destination: GeoPoint;
}

/** A material that can be purchased, positioned within its commodity. */
export interface Material {
    materialId: string;
    name: string;
    commodity: Commodity;
    subcategory: string;
    unit: Unit;
    /** List price per unit, before the supplier's `priceIndex`. */
    listPrice: number;
    /** Suppliers approved for this material. */
    supplierIds: string[];
}

/** One purchase order line item — the raw record every view is derived from. */
export interface PurchaseOrder {
    poId: string;
    supplierId: string;
    supplierName: string;
    commodity: Commodity;
    subcategory: string;
    material: string;
    plantId: string;
    quantity: number;
    unit: Unit;
    unitCost: number;
    totalCost: number;
    orderDate: number;
    expectedDate: number;
    /** Delivery timestamp; `null` while the order is still in flight. */
    actualDate: number | null;
    /**
     * Quantity passed at receiving inspection, in the order's unit; `null` until delivered.
     * Never above `quantity` — a rejected part is scrapped or returned, not replaced on the line.
     */
    acceptedQuantity: number | null;
    status: PoStatus;
}

/**
 * An in-flight shipment. One shipment consolidates every in-flight order line on the
 * same supplier → plant lane despatched in the same window, which is how a carrier
 * actually moves goods — so it maps to one or more purchase orders, not exactly one.
 */
export interface Shipment {
    shipmentId: string;
    supplierId: string;
    supplierName: string;
    /** The single material carried, or a count when the shipment is mixed. */
    material: string;
    /** Number of purchase-order lines on this shipment. */
    lineCount: number;
    plantId: string;
    plantName: string;
    origin: GeoPoint;
    originName: string;
    destination: GeoPoint;
    destinationName: string;
    departDate: number;
    /** Carrier's projected arrival, including any logged delay. */
    projectedDate: number;
    /** The date production needs the material by. */
    requiredDate: number;
    /** Whether the carrier has logged a delay event against this shipment. */
    carrierDelay: boolean;
    status: ShipmentStatus;
    value: number;
}

/** A shipment with its interpolated current position, as the map plots it. */
export interface TrackedShipment extends Shipment {
    /** Journey completion as a 0–1 fraction of the depart → projected window. */
    progress: number;
    position: GeoPoint;
    /** Whole days until (positive) or past (negative) the required date. */
    daysToRequired: number;
    /**
     * Days of slack between the projected arrival and the required date. Negative means
     * the shipment is projected to land late — this, not `daysToRequired`, is what the
     * status is derived from.
     */
    slackDays: number;
}

/** A node in the spend hierarchy the sunburst renders. */
export interface SpendNode {
    /** Label shown on the sector. */
    name: string;
    /**
     * Path from the commodity root: `[]` is the commodity itself, `['Stainless Steel']` a
     * subcategory, `['Stainless Steel', 'NIP']` one supplier's spend within it.
     */
    path: string[];
    /** Total spend at this node, including descendants. */
    spend: number;
    /**
     * Sector size, set on leaves only.
     *
     * The sunburst sums a branch from its leaves, so a size on an internal node is
     * counted *in addition to* its children and leaves a gap in the ring the width of the
     * node's own value. Equals `spend`, except for a leaf with no spend in the period,
     * which gets a sliver so it keeps its place — see `buildSpendTree`.
     */
    size?: number;
    /** Share of the immediate parent's spend, 0–1. `1` at the root. */
    shareOfParent: number;
    /** Share of the whole commodity's spend, 0–1. */
    shareOfTotal: number;
    /** Set on a supplier leaf, so a click can resolve to the supplier it represents. */
    supplierId?: string;
    children?: SpendNode[];
}

/**
 * A suggested next move on one supplier, with the figures it was drawn from.
 *
 * Rule-derived from the scorecard, not generated: every field traces to a measured value, which is
 * what makes the suggestion checkable rather than something she has to take on trust.
 */
export interface SupplierInsight {
    insightId: string;
    supplierId: string;
    /** The move, phrased as the action she would take. */
    action: string;
    /** Why, in the figures behind it. */
    evidence: string;
}

/** How a supplier relationship currently stands, worst first. */
export type RelationshipFlag = 'Late shipment open' | 'Renewal due' | 'Delivery risk' | 'Quality watch' | 'On track';

/**
 * One supplier's row on the scorecard — the core of the commodity manager's job.
 *
 * Backs both presentations the spec asks for: the scatter plots `priceIndex` against
 * `onTimeRate` sized by `spend`, and the card list shows the contract and relationship
 * columns. One derivation, so the two can never disagree.
 */
export interface SupplierScorecard {
    supplierId: string;
    supplier: string;
    country: string;
    /**
     * What the supplier charged as a share of catalogue list price; 1 = at list.
     *
     * An index rather than a price per unit, because the roster spans a whole commodity: it mixes
     * tonnes of plate with kilos of alloy, and an average across those units compares nothing.
     */
    priceIndex: number;
    /** On-time rate as a 0–1 fraction across the orders in scope. */
    onTimeRate: number;
    /**
     * True when too few orders in scope have been delivered to measure a rate, so
     * `onTimeRate` is the supplier's contracted reliability, not its performance.
     */
    rateIsContracted: boolean;
    /** Orders in scope actually delivered — the evidence behind `onTimeRate`. */
    deliveredCount: number;
    spend: number;
    /** Order lines in scope — the roster's size column, since it needs no unit. */
    orderCount: number;
    qualityScore: number;
    /**
     * Value of delivered quantity that failed inspection, at the price she paid for it, measured
     * over the same delivery window as `onTimeRate`. The money consequence of `qualityScore`.
     */
    rejectedValue: number;
    priceVariance: number;
    contractRenewal: number;
    /** Whole days until the contract renews; negative once it has lapsed. */
    daysToRenewal: number;
    /** Active shipments from this supplier projected to arrive after they are needed. */
    lateShipments: number;
    flag: RelationshipFlag;
}

/** A tile in her KPI strip. */
/**
 * A tile's figure as a share of the thing it is measured against, for the tiles that have such a
 * thing: spend against budget, on-time rate against its target. Both ends are 0–1 fractions.
 */
export interface KpiGauge {
    value: number;
    /** Where the target sits on the same scale. */
    target: number;
    /** What the target is, for the marker's tooltip. */
    targetLabel: string;
}

/** One band of a tile's breakdown bar: how many, of what, in which ink. */
export interface KpiSegment {
    label: string;
    count: number;
    color: string;
    /** Glyph restating the band, so the breakdown does not rest on colour. */
    icon: string;
}

export interface Kpi {
    key: string;
    label: string;
    value: string;
    /** Supporting line under the value, e.g. share of her budget. */
    detail?: string;
    /** Threshold state, which selects the tile's accent. */
    tone: 'neutral' | 'good' | 'warn' | 'bad';
    /** Glyph restating `tone` non-colometrically. */
    icon: string;
    /** Progress against target, drawn under the figure. Omitted for tiles with no target. */
    gauge?: KpiGauge;
    /** What the figure is drawn from, as one segmented bar. Omitted for tiles with no breakdown. */
    segments?: KpiSegment[];
}

/** What the manager did about an item needing attention. */
export type AttentionActionId = 'contact';

export interface AttentionAction {
    id: AttentionActionId;
    label: string;
}

/**
 * One item on the "Needs my attention" list.
 *
 * Derived from the same records as the KPIs and the grid — a view over her own data, not
 * a separate feed — so an item can always hand the orders tab the shipment it was raised against.
 *
 * Only a late shipment raises one, so `kind` and `severity` each carry a single value; they stay
 * on the item because the list styles itself from them.
 */
export interface AttentionItem {
    itemId: string;
    kind: 'shipment';
    severity: 'bad';
    title: string;
    detail: string;
    /** The shipment to select on the orders tab when the item is followed. */
    shipmentId: string;
    /** The decisions available in place. */
    actions: AttentionAction[];
}

/** What the manager recorded against a purchase order from the grid's Action column. */
export type PoActionKind = 'Resolved' | 'Reassigned' | 'Escalated';

/** An inclusive date range. */
export interface DateRange {
    start: Date;
    end: Date;
}

// --- derived trend series -----------------------------------------------------

/** One calendar month of the trend window. */
export interface MonthBucket {
    /** Local midnight on the first of the month. */
    start: number;
    /** Exclusive end — local midnight on the first of the next month. */
    end: number;
    /** Short label, e.g. `Mar 26`. */
    label: string;
}

/** One supplier's delivery performance in one month. */
export interface OnTimePoint {
    month: number;
    label: string;
    /** On-time share of that month's deliveries; `null` when nothing was delivered. */
    rate: number | null;
    delivered: number;
}

/**
 * Every delivery-slip observation for one supplier, in days late.
 *
 * Held as the raw values rather than as a five-number summary, because a summary cannot show shape:
 * two suppliers with identical quartiles can be steady-but-always-late or
 * usually-fine-occasionally-awful, and that is the distinction the histograms exist to draw.
 */
export interface SlipDistribution {
    supplierId: string;
    supplier: string;
    /** Days late per delivery; negative is early. Ascending. */
    slips: number[];
}

/**
 * What a supplier's rejected material cost, over the orders in scope.
 *
 * Quality expressed in money rather than as a rate: a rate cannot be weighed against a price
 * variance, and 90% acceptance on stainless is a very different bill from 90% on a cheap alloy.
 */
export interface QualityCost {
    supplierId: string;
    supplier: string;
    /** Value of the quantity that failed inspection, at the price she paid for it. */
    rejectedValue: number;
    /** Share of delivered quantity accepted, 0-1 — the rate the value is derived from. */
    acceptedRate: number;
    /** Delivered lines behind the figure. */
    deliveredCount: number;
}

/** One day of the budget burn-up. */
export interface BurnUpPoint {
    date: Date;
    /** Cumulative committed spend to this day; `null` once past today. */
    committed: number | null;
    /** Straight-line budget consumption to this day. */
    pace: number;
}

/** One month of realised price for one supplier. */
export interface PricePoint {
    month: number;
    label: string;
    /** Weighted average price per unit; `null` when nothing was ordered. */
    price: number | null;
    /** Realised price as a share of catalogue list; `null` when nothing was ordered. */
    index: number | null;
}

/**
 * One month of one supplier's performance, across every metric the trend chart can plot.
 *
 * Held as one point per month rather than a series per metric so the three views are guaranteed to
 * share a month axis and a scope — switching metric changes only what is read off the point.
 */
export interface SupplierTrendPoint {
    month: number;
    label: string;
    /** Weighted average price per unit, by order date; `null` when nothing was ordered. */
    price: number | null;
    /** Realised price as a share of catalogue list; `null` when nothing was ordered. */
    index: number | null;
    /** On-time share of the month's deliveries; `null` when nothing was delivered. */
    onTimeRate: number | null;
    /** Share of delivered quantity accepted at inspection; `null` when nothing was delivered. */
    qualityRate: number | null;
}

/**
 * A contiguous span of the timeline that a series plots one datum against.
 *
 * `MonthBucket` is one of these, and the shape a bar chart's x axis is built from either way —
 * which is what lets the spend trend switch its grain without the aggregation knowing.
 */
export interface TimeBucket {
    /** Local midnight at the start of the span. */
    start: number;
    /** Exclusive end — where the next bucket begins. */
    end: number;
    /** Short label, e.g. `Mar 26` for a month or `Jul 8` for a week. */
    label: string;
}

/** How wide one bar of the spend trend is. */
export type SpendTrendGrain = 'month' | 'week';

/**
 * One bucket of committed spend, split across the subcategories it was spent in.
 *
 * Keyed by subcategory name rather than held as a nested list, because that is the shape a
 * stacked series reads: one series per subcategory, one datum per bucket.
 */
export interface SpendTrendRow {
    /** Local midnight at the start of the bucket. */
    start: number;
    /** Short label, e.g. `Mar 26` for a month or `Jul 8` for a week. */
    label: string;
    /** Spend per subcategory, zero where nothing was bought in that bucket. */
    [subcategory: string]: string | number;
}

/**
 * The spend trend, with the grain it came out at.
 *
 * The grain is carried alongside the rows rather than inferred from their count, because the
 * chart and its card both have to say what one bar covers — "committed per week" is a different
 * claim from "per month", and a reader cannot tell which from the bars alone.
 */
export interface SpendTrend {
    rows: SpendTrendRow[];
    grain: SpendTrendGrain;
    /**
     * The last day the trend covers — the end of its final complete bucket.
     *
     * Always short of today, because an unfinished bucket is excluded, so the card has to be able
     * to say where the bars actually stop.
     */
    end: Date;
}

/** One subcategory's spend split across the suppliers it was bought from. */
export interface SupplierShareRow {
    subcategory: string;
    /** Spend per supplier name, zero where a supplier is approved but unused. */
    [supplierName: string]: string | number;
}
