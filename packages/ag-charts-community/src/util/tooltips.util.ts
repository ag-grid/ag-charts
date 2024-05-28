import { sanitizeHtml } from './sanitize';
import { isTruthy } from './type-guards';
import type { FalsyValue } from './types';

export function formatKeyValue(key: unknown, value: unknown, escape: (v: unknown) => string = String): string {
    return `<b>${escape(key)}</b>: ${escape(value)}`;
}

export function sanitizeKeyValuePairs(entries: ([string, string] | FalsyValue)[]) {
    const escapeMethod = (v: unknown) => sanitizeHtml(String(v));
    return entries
        .filter(isTruthy)
        .map(([key, value]) => formatKeyValue(key, value, escapeMethod))
        .join('<br>');
}
