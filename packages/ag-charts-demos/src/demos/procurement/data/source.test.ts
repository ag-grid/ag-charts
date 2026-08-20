import { describe, expect, it } from 'vitest';

import { STATIC_DATASET, resolveDataset } from './source';
import type { RawDataset } from './source';

const clone = (): RawDataset => structuredClone(STATIC_DATASET);

describe('resolveDataset', () => {
    it('resolves the bundled dataset', () => {
        const dataset = resolveDataset(STATIC_DATASET);
        expect(dataset.commodities).toContain('Steel & Metals');
        expect(dataset.suppliers.length).toBe(STATIC_DATASET.suppliers.length);
        expect(dataset.purchaseOrders.length).toBe(STATIC_DATASET.purchaseOrders.length);
        expect(dataset.shipments.length).toBe(STATIC_DATASET.shipments.length);
        expect(dataset.materials.every((material) => material.materialId.includes(material.name))).toBe(true);
        for (const commodity of dataset.commodities) {
            expect(dataset.budgets[commodity].quarterly).toBeGreaterThan(0);
            expect(dataset.subcategories[commodity].length).toBeGreaterThan(0);
        }
    });

    it('resolves every form of contract renewal against the dataset now', () => {
        const raw = clone();
        const template = raw.suppliers[0];
        raw.suppliers.push(
            { ...template, supplierId: 'ISO', contractRenewal: '2027-03-04T00:00:00' },
            { ...template, supplierId: 'DAY', contractRenewal: { daysFromNow: 18 } },
            { ...template, supplierId: 'MON', contractRenewal: { monthsFromNow: 5 } },
            { ...template, supplierId: 'DOM', contractRenewal: { monthsFromNow: 19, dayOfMonth: 1 } }
        );

        const { now, suppliers } = resolveDataset(raw);
        const renewal = new Map(suppliers.map((supplier) => [supplier.supplierId, new Date(supplier.contractRenewal)]));

        expect(renewal.get('ISO')).toEqual(new Date('2027-03-04T00:00:00'));
        expect(renewal.get('DAY')!.getTime() - now.getTime()).toBe(18 * 24 * 60 * 60 * 1000);
        expect(renewal.get('MON')!.getMonth()).toBe(new Date(now.getFullYear(), now.getMonth() + 5, 1).getMonth());
        expect(renewal.get('MON')!.getDate()).toBe(now.getDate());
        expect(renewal.get('DOM')!.getDate()).toBe(1);
    });

    it('rejects a supplier reference that does not resolve', () => {
        const raw = clone();
        raw.managers[0].supplierIds.push('NOPE');
        expect(() => resolveDataset(raw)).toThrow(/unknown supplier "NOPE"/);
    });

    it('rejects a commodity outside the supported set, however consistent the feed is', () => {
        // The whole feed agrees on it — catalogue, budget and manager — so nothing else here
        // catches it, and it would otherwise resolve into a `Commodity` the union does not hold
        // and the workspace's `Record<Commodity, …>` maps have no entry for.
        const raw = clone();
        const [entry] = raw.catalogue;
        const renamed = 'Unobtainium';
        raw.managers
            .filter((manager) => manager.commodity === entry.commodity)
            .forEach((manager) => {
                manager.commodity = renamed;
            });
        raw.budgets
            .filter((budget) => budget.commodity === entry.commodity)
            .forEach((budget) => {
                budget.commodity = renamed;
            });
        entry.commodity = renamed;

        expect(() => resolveDataset(raw)).toThrow(/"Unobtainium", which is not a commodity this build supports/);
    });

    it('rejects a commodity the catalogue does not define', () => {
        const raw = clone();
        raw.budgets[0].commodity = 'Unobtainium';
        expect(() => resolveDataset(raw)).toThrow(/unknown commodity "Unobtainium"/);
    });

    it('rejects a commodity budgeted twice', () => {
        const raw = clone();
        raw.budgets.push({ ...raw.budgets[0], annual: 1, quarterly: 1 });
        expect(() => resolveDataset(raw)).toThrow(/the budget table states ".+" twice/);
    });

    it('rejects a commodity with no budget', () => {
        const raw = clone();
        raw.budgets = raw.budgets.slice(1);
        expect(() => resolveDataset(raw)).toThrow(/has no budget/);
    });

    it('parses order and shipment dates into instants', () => {
        const { purchaseOrders, shipments } = resolveDataset(STATIC_DATASET);
        const [order] = purchaseOrders;
        expect(new Date(order.orderDate).toISOString()).toBe(STATIC_DATASET.purchaseOrders[0].orderDate);
        expect(order.expectedDate).toBeGreaterThan(order.orderDate);
        expect(purchaseOrders.every((line) => (line.actualDate == null) === (line.acceptedQuantity == null))).toBe(
            true
        );

        const [shipment] = shipments;
        expect(new Date(shipment.departDate).toISOString()).toBe(STATIC_DATASET.shipments[0].departDate);
        expect(shipment.projectedDate).toBeGreaterThan(shipment.departDate);
    });

    it('rejects an order line whose references do not resolve', () => {
        const withMaterial = clone();
        withMaterial.purchaseOrders[0].materialId = 'Steel & Metals/Carbon Steel/Unobtainium Coil';
        expect(() => resolveDataset(withMaterial)).toThrow(
            /unknown material "Steel & Metals\/Carbon Steel\/Unobtainium Coil"/
        );

        const withShipment = clone();
        withShipment.purchaseOrders[0].shipmentId = 'SHP-9999';
        expect(() => resolveDataset(withShipment)).toThrow(/unknown shipment "SHP-9999"/);

        const withPlant = clone();
        withPlant.shipments[0].plantId = 'XXX';
        expect(() => resolveDataset(withPlant)).toThrow(/unknown plant "XXX"/);
    });

    it('rejects an order line from a supplier the catalogue does not approve', () => {
        // The sunburst lays a leaf out per approved supplier and looks spend up against it, so an
        // unapproved line would drop out of that chart while still counting in the grid and tiles.
        const raw = clone();
        const line = raw.purchaseOrders[0];
        const approved = raw.catalogue
            .flatMap((entry) => entry.subcategories.map((sub) => ({ commodity: entry.commodity, sub })))
            .flatMap(({ commodity, sub }) =>
                sub.materials.map((material) => ({
                    materialId: `${commodity}/${sub.subcategory}/${material.name}`,
                    material,
                }))
            )
            .find(({ materialId }) => materialId === line.materialId)!.material;
        approved.supplierIds = approved.supplierIds.filter((id) => id !== line.supplierId);

        expect(() => resolveDataset(raw)).toThrow(/the catalogue does not approve for it/);
    });

    it("rejects an order line booked onto another lane's shipment", () => {
        // A shipment's value and contents are summed from its lines while its lane comes from the
        // shipment record, so a line off the lane spends against the wrong supplier and plant.
        // The shipment is what moves here, not the line: moving the line would take it off its
        // material's approved suppliers too, and that is a different rule failing.
        const shipped = STATIC_DATASET.purchaseOrders.find((order) => order.shipmentId != null)!;
        const lane = STATIC_DATASET.shipments.find((shipment) => shipment.shipmentId === shipped.shipmentId)!;
        const otherSupplier = STATIC_DATASET.suppliers.find((s) => s.supplierId !== lane.supplierId)!;
        const otherPlant = STATIC_DATASET.plants.find((plant) => plant.plantId !== lane.plantId)!;

        const wrongSupplier = clone();
        wrongSupplier.shipments.find((s) => s.shipmentId === lane.shipmentId)!.supplierId = otherSupplier.supplierId;
        expect(() => resolveDataset(wrongSupplier)).toThrow(/runs .+ rather than the line's/);

        const wrongPlant = clone();
        wrongPlant.shipments.find((s) => s.shipmentId === lane.shipmentId)!.plantId = otherPlant.plantId;
        expect(() => resolveDataset(wrongPlant)).toThrow(/runs .+ rather than the line's/);
    });

    it('rejects a receipt that is only half recorded', () => {
        const raw = clone();
        raw.purchaseOrders[0].actualDate = null;
        expect(() => resolveDataset(raw)).toThrow(/disagree about receipt/);
    });

    it('rejects a receipt that accepted more than was ordered', () => {
        const raw = clone();
        const line = raw.purchaseOrders.find((order) => order.acceptedQuantity != null)!;
        line.acceptedQuantity = line.quantity + 1;
        expect(() => resolveDataset(raw)).toThrow(/accepted \d+ of \d+ ordered/);
    });

    it('rejects a duplicated order line', () => {
        const raw = clone();
        raw.purchaseOrders.push({ ...raw.purchaseOrders[0] });
        expect(() => resolveDataset(raw)).toThrow(/lists PO-\d+ twice/);
    });

    it('rejects an order promised or received before it was raised', () => {
        // Lead time is measured from the order date, so a date before it is a negative lead time
        // averaged into the slip and lead-time charts rather than an obviously broken record.
        const early = clone();
        const [line] = early.purchaseOrders;
        line.expectedDate = new Date(new Date(line.orderDate).getTime() - 86_400_000).toISOString();
        expect(() => resolveDataset(early)).toThrow(/is expected on .+, before it was ordered on /);

        const received = clone();
        const delivered = received.purchaseOrders.find((order) => order.actualDate != null)!;
        delivered.actualDate = new Date(new Date(delivered.orderDate).getTime() - 86_400_000).toISOString();
        expect(() => resolveDataset(received)).toThrow(/was received on .+, before it was ordered on /);
    });

    it('rejects an order line raised after its shipment departed', () => {
        // A consolidation waits for every line it carries, so its departure follows the last of them.
        const raw = clone();
        const line = raw.purchaseOrders.find((order) => order.shipmentId != null)!;
        const lane = raw.shipments.find((shipment) => shipment.shipmentId === line.shipmentId)!;
        line.orderDate = new Date(new Date(lane.departDate).getTime() + 86_400_000).toISOString();
        expect(() => resolveDataset(raw)).toThrow(/was ordered on .+, after shipment .+ departed on /);
    });

    it('rejects a shipment projected to arrive before it departs', () => {
        const raw = clone();
        const [shipment] = raw.shipments;
        shipment.projectedDate = new Date(new Date(shipment.departDate).getTime() - 86_400_000).toISOString();
        expect(() => resolveDataset(raw)).toThrow(/is projected to arrive on .+, before it departs on /);
    });

    /** Early delivery is ordinary, and the slip distribution is largely made of it. */
    it('accepts a receipt ahead of the promised date', () => {
        const { purchaseOrders } = resolveDataset(STATIC_DATASET);
        const early = purchaseOrders.filter(
            (order) => order.actualDate != null && order.actualDate < order.expectedDate
        );
        expect(early.length).toBeGreaterThan(0);
    });

    it('rejects an unparseable date', () => {
        const raw = clone();
        raw.purchaseOrders[0].expectedDate = 'the ides of March';
        expect(() => resolveDataset(raw)).toThrow(/unparseable date "the ides of March"/);
    });

    it('rejects an unknown unit of measure', () => {
        const raw = clone();
        raw.catalogue[0].subcategories[0].materials[0].unit = 'furlong';
        expect(() => resolveDataset(raw)).toThrow(/unknown unit "furlong"/);
    });
});
