import { type AgChartThemeName, _Theme } from 'ag-charts-community';
import { describe, expect, it } from 'vitest';

import { PUBLIC_PARAM_NAMES, getStackParams } from './chartsTheme';
import { CURATED_KEYS, INHERITED_KEYS, PARAM_GROUPS, inheritedKeysOf } from './params';

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

describe('params the panel hides until asked', () => {
    it('hides the params that follow another one, and only those', () => {
        // The chain the panel exists to spare the user: a chrome text colour is
        // the foreground colour, and a tooltip's is the chrome's. Setting the
        // root recolours all three, so only the root is offered up front.
        expect(INHERITED_KEYS.has('chromeTextColor')).toBe(true);
        expect(INHERITED_KEYS.has('tooltipTextColor')).toBe(true);
        expect(INHERITED_KEYS.has('foregroundColor')).toBe(false);
        // A composite whose members are references, and a raw CSS string that
        // names a param variable - both are still a value nobody has to choose.
        expect(INHERITED_KEYS.has('tooltipBorder')).toBe(true);
        expect(INHERITED_KEYS.has('focusShadow')).toBe(true);
        expect(INHERITED_KEYS.has('popupShadow')).toBe(false);
    });

    it('names only params the builder offers', () => {
        expect([...INHERITED_KEYS].filter((key) => !CURATED_KEYS.includes(key))).toEqual([]);
    });

    it('classifies every stock theme the same way', () => {
        // The panel reads one theme's defaults, but a user can be working on any
        // of them. A theme that replaced a derived param with a literal would
        // leave a control hidden that it alone needs shown.
        const names = Object.keys(_Theme.themes) as AgChartThemeName[];
        expect(names.length).toBeGreaterThan(1);
        for (const name of names) {
            expect([...inheritedKeysOf(getStackParams(name))].toSorted(), name).toEqual([...INHERITED_KEYS].toSorted());
        }
    });
});
