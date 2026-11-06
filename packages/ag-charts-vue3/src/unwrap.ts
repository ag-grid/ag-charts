import { isRef, toRaw } from 'vue';

import type { AgChartInstance, AgDataTransaction } from 'ag-charts-community';

// Vue hands out proxies of everything held in reactive state. The chart matches data by reference, so a raw datum
// passed to `applyTransaction()` never matches the proxy of the same datum that the chart was given.

function isPlainObject(value: object): value is Record<string, unknown> {
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}

function unwrapItems(items: unknown[]): unknown[] {
    let result: unknown[] | undefined;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const raw = typeof item === 'object' && item !== null ? toRaw(item) : item;
        if (raw !== item && result === undefined) {
            result = items.slice(0, i);
        }
        result?.push(raw);
    }
    return result ?? items;
}

// Children are read through the holder as passed, so refs unwrap where Vue would unwrap them, then become raw.
// `context` is the app's own state and passes untouched. Each object is visited once, so linked graphs stay linear.
function unwrap(value: unknown, key: string | undefined, active: Set<object>, done: Map<object, unknown>): unknown {
    if (typeof value !== 'object' || value === null) return value;

    const raw: object = toRaw(value);
    if (active.has(raw)) return raw;

    // Datums are not walked: only the datums themselves need to be raw for the chart to match them by reference.
    if (Array.isArray(raw) && key === 'data') return unwrapItems(raw);

    if (done.has(raw)) return done.get(raw);
    if (!Array.isArray(raw) && !isPlainObject(raw)) return raw;

    const holder = value as Record<string, unknown>;
    let result: any;
    active.add(raw);
    if (Array.isArray(raw)) {
        for (let i = 0; i < raw.length; i++) {
            const next = unwrap(holder[i], undefined, active, done);
            if (next !== raw[i]) {
                result ??= raw.slice(0, i);
            }
            result?.push(next);
        }
    } else {
        for (const k of Object.keys(raw)) {
            const item = (raw as Record<string, unknown>)[k];
            const read = holder === raw ? item : holder[k];
            const next = k === 'context' ? read : unwrap(read, k, active, done);
            if (next !== item) {
                result ??= { ...raw };
                result[k] = next;
            }
        }
    }
    active.delete(raw);

    done.set(raw, result ?? raw);
    return result ?? raw;
}

/**
 * Returns `options` with every Vue proxy beneath it replaced by its raw target. Only plain objects and arrays are
 * walked; anything else is passed through by identity. Nothing is mutated, and unchanged branches are not copied.
 */
export function unwrapOptions<O>(options: O): O {
    return unwrap(options, undefined, new Set(), new Map()) as O;
}

/**
 * Returns `transaction` with the raw target of every item in `add`, `remove` and `update`. A transaction that is not
 * a plain object, or has a non-array operation, is returned as passed so the chart reports it as it always has.
 */
export function unwrapTransaction(transaction: AgDataTransaction): AgDataTransaction {
    if (typeof transaction !== 'object' || transaction === null) return transaction;

    if (!isPlainObject(toRaw(transaction))) return transaction;

    // Fields are read through the object as passed, so a reactive transaction yields the same values (refs
    // unwrapped) as before and only its items become raw.
    const fields = transaction as Record<string, unknown>;
    let result: Record<string, unknown> | undefined;
    for (const key of ['add', 'remove', 'update']) {
        const operation = fields[key];
        const items = typeof operation === 'object' && operation !== null ? toRaw(operation) : operation;
        if (!Array.isArray(items)) continue;

        const unwrapped = unwrapItems(items);
        if (unwrapped !== operation) {
            result ??= { ...fields };
            result[key] = unwrapped;
        }
    }
    return (result ?? transaction) as AgDataTransaction;
}

/**
 * Makes `chart.applyTransaction()` accept proxied or raw items. The instance keeps its identity and other methods.
 */
export function unwrapTransactions<C extends AgChartInstance<any>>(chart: C): C {
    const target: Pick<AgChartInstance<any>, 'applyTransaction'> = chart;
    const { applyTransaction } = target;
    target.applyTransaction = (transaction) => applyTransaction.call(chart, unwrapTransaction(transaction));
    return chart;
}
