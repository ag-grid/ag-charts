# Procurement dataset

The data behind the commodity-manager workspace. Nothing is generated at run time:
`../data.ts` reads these files and derives every KPI, chart series and grid row from them,
so the whole dataset can be replaced without touching the engine.

| File                      | What it holds                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------ |
| `purchase-orders.json`    | The order book — one record per PO line, one line per row                            |
| `shipments.json`          | Consolidated carrier movements the in-flight lines reference                         |
| `suppliers.json`          | Supplier master: terms, location, contracted reliability, quality and price position |
| `plants.json`             | Receiving sites — every shipment's destination                                       |
| `commodity-managers.json` | Manager → commodity → supplier assignments; this is the access model                 |
| `material-catalogue.json` | Commodities → subcategories → materials, in the order the sunburst renders them      |
| `commodity-budgets.json`  | Annual and current-quarter spend allocation per commodity                            |
| `policy.json`             | The thresholds a figure is judged against (on-time target, renewal window, …)        |
| `dataset.json`            | The instant the dataset is a snapshot at — every relative figure resolves against it |

`source.ts` is the only module that reads them. It parses the raw records, resolves the
relative dates, checks referential integrity and returns a typed `ProcurementDataset`.

## How the records are shaped

The order book is normalised, the way a system of record holds it. A line carries references
and figures — supplier, material, plant, quantity, unit cost, the dates, the shipment it
travels on — and nothing that follows from them: the commodity, the unit of measure, the
line total and the delivery status are all derived in `../data.ts`, so a record cannot
contradict the catalogue it points at. Shipments likewise carry only what a carrier reports;
their contents, value and status come from the lines that reference them.

Dates are absolute ISO instants, so the dataset reads the same in every timezone.

Validation happens at the boundary and fails loudly, naming the record: an unknown supplier,
material, plant or shipment reference, a duplicated PO id, an unparseable date, a receipt
recorded on only one of `actualDate` / `acceptedQuantity`, or an accepted quantity above the
quantity ordered.

## Editing the data

`commodity-budgets.json` is calibrated against what the order book actually spends: steel
sits just over its quarterly allocation (110%) and comfortably inside its annual plan (70%),
which is the position the workspace opens on and what puts the spend tile over target on one
window and inside it on the other. Adding or repricing lines moves that spend, so the budgets
have to move with it.

### What the steel book does over time

The order book is not flat across its two years, and the shape is deliberate: a book with steady
prices, steady volumes and a fixed material mix draws a flat spend trend and a flat price line,
which shows the charts working but leaves nothing worth reading off them.

| Movement          | Where                                                                                         | What it drives                                                                     |
| ----------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Market escalation | Unit costs step up by quarter: flat through 2025, then +8% in Q1 2026, +11% in Q2, +19% in Q3 | The supplier trend's price and price-vs-list series                                |
| Volume pull-back  | 2026 quantities run ~6% below 2025, receipts with them                                        | The spend trend's bar heights, against a budget pace that does not move with them  |
| Alloy re-spec     | Specialty Alloys is nickel through 2025 and titanium from January 2026                        | The sunburst's material ring, and a gap in the price series where a material stops |

Two consequences worth knowing before editing. `material-catalogue.json`'s steel list prices
carry the same ~8% uplift, because realised price is read against them as an index: leave the
list at pre-escalation levels and every supplier reads above list, which contradicts what
`priceIndex` means. And the escalation is steel-only, so the other commodities' thin slices
keep their original prices.

The book is almost entirely Steel & Metals, because that is the only commodity a workspace
renders — `../workspace.ts` scopes every query to one manager's suppliers, and this demo ships
one persona. The other five commodities keep a deliberately thin slice, sized by what the
invariants need rather than by realism: at least one line per catalogue material, so no
sunburst leaf is permanently empty; at least two per supplier; and two whole lanes still in
flight, so a shipment outside her scope exists to prove a selection cannot widen it.

That slice is too thin to read a figure off. Only steel's spend reconciles with
`commodity-budgets.json`; the other commodities' allocations are plan figures with no matching
book, and an org-wide roll-up would need its own data.

## Pointing at a real source

The `RawDataset` interface in `source.ts` is the contract an endpoint has to satisfy: these
same records, with `contractRenewal` as an ISO date string rather than an offset relative to
`dataset.json`'s `now`.

A synchronous source — bundled JSON, or records already in memory — needs only the last
function in `source.ts` changed:

```ts
export function loadProcurementDataset(): ProcurementDataset {
    return resolveDataset(records);
}
```

An HTTP source is asynchronous, and `../data.ts`, `../workspace.ts` and `../routes.ts` all
evaluate at module load, so the fetch has to complete before they are imported. That means
loading in the entry point and pulling the workspace in dynamically:

```ts
// index.tsx
const raw = await fetch('/api/procurement').then((response) => response.json());
setProcurementDataset(resolveDataset(raw)); // a module-level cache in source.ts
const { WorkspaceApp } = await import('./WorkspaceApp');
```

`resolveDataset` runs the same normalisation and validation on fetched records as on the
files here, so a feed that drifts fails at the boundary naming the offending record, rather
than as an empty ring in a chart.
