import { describe, expect, it } from 'vitest';

import { PUBLIC_PARAM_NAMES } from './chartsTheme';
import { CURATED_KEYS, PARAM_GROUPS } from './params';

describe('charts theme builder param layout', () => {
    it('covers every public AG Charts theme param', () => {
        // A param added to the AG Charts API should show up here as a failure,
        // not as a control the builder silently never offers.
        const missing = PUBLIC_PARAM_NAMES.filter((name) => !CURATED_KEYS.includes(name));
        expect(missing).toEqual([]);
    });

    it('offers no param AG Charts does not have', () => {
        const unknown = CURATED_KEYS.filter((key) => !PUBLIC_PARAM_NAMES.includes(key));
        expect(unknown).toEqual([]);
    });

    it('places each param in exactly one group', () => {
        const seen = new Map<string, string[]>();
        for (const group of PARAM_GROUPS) {
            for (const { key } of group.params) {
                seen.set(key, [...(seen.get(key) ?? []), group.id]);
            }
        }
        const duplicated = [...seen.entries()].filter(([, groups]) => groups.length > 1);
        expect(duplicated).toEqual([]);
    });
});
