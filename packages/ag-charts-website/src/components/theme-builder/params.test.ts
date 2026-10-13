import { ParamModel } from '@ag-website-shared/theming/ParamModel';
import { describe, expect, it } from 'vitest';

import { type AgChartThemeName, _Theme } from 'ag-charts-community';

import { PUBLIC_PARAM_NAMES, getStackParams } from './chartsTheme';
import {
    CURATED_KEYS,
    type ChartsParamEntry,
    INHERITED_KEYS,
    INHERITED_SOURCES,
    PARAM_GROUPS,
    defaultOpenSections,
    groupParams,
    inheritedKeysOf,
    inheritedSourcesOf,
} from './params';
// Side-effect import, as in the builder itself: it registers the curated keys
// with the shared param model.
import './registerThemeBuilderConfig';

const keysOf = (entry: ChartsParamEntry) => (Array.isArray(entry) ? entry.map(({ key }) => key) : entry.key);

describe('charts theme builder param layout', () => {
    it('lays out the groups and params in panel order, pairing each size with its row-mate', () => {
        expect(PARAM_GROUPS.map((group) => ({ label: group.label, params: group.params.map(keysOf) }))).toEqual([
            {
                label: 'General',
                params: [['fontFamily', 'fontSize'], 'backgroundColor', 'foregroundColor', 'accentColor'],
            },
            { label: 'Borders & Spacing', params: ['borderColor', 'borderRadius', 'chartPadding'] },
            {
                label: 'Axis & Grid',
                params: [
                    'axisTitleFontFamily',
                    ['axisTitleColor', 'axisTitleFontSize'],
                    'axisLineColor',
                    'gridLineColor',
                ],
            },
            {
                label: 'Titles & Footnote',
                params: [
                    'titleFontFamily',
                    ['titleColor', 'titleFontSize'],
                    'subtitleFontFamily',
                    ['subtitleColor', 'subtitleFontSize'],
                    'footnoteFontFamily',
                    ['footnoteColor', 'footnoteFontSize'],
                ],
            },
        ]);
        expect(CURATED_KEYS).toHaveLength(22);
    });

    it('opens General and Palette by default, and All Parameters only once a param is pinned there', () => {
        expect(defaultOpenSections(false)).toEqual(['Palette', 'General']);
        expect(defaultOpenSections(true)).toEqual(['Palette', 'General', 'All Parameters']);
    });

    it('offers no param AG Charts does not have', () => {
        const unknown = CURATED_KEYS.filter((key) => !PUBLIC_PARAM_NAMES.includes(key));
        expect(unknown).toEqual([]);
    });

    it('places each param in exactly one group', () => {
        const seen = new Map<string, string[]>();
        for (const group of PARAM_GROUPS) {
            for (const { key } of groupParams(group)) {
                seen.set(key, [...(seen.get(key) ?? []), group.id]);
            }
        }
        const duplicated = [...seen.entries()].filter(([, groups]) => groups.length > 1);
        expect(duplicated).toEqual([]);
    });

    it('registers every grouped param as editable outside All Parameters', () => {
        // The panel's editor throws on a param only All Parameters may edit.
        const advancedOnly = CURATED_KEYS.filter((key) => ParamModel.for(key).onlyEditableAsAdvancedParam);
        expect(advancedOnly).toEqual([]);
    });
});

describe('params with an inherited value', () => {
    it('finds the ones that inherit, and only those', () => {
        // The chain the note exists to show: a chrome text colour is the
        // foreground colour, and a tooltip's is the chrome's, so setting the
        // root recolours all three.
        expect(INHERITED_KEYS.has('chromeTextColor')).toBe(true);
        expect(INHERITED_KEYS.has('tooltipTextColor')).toBe(true);
        expect(INHERITED_KEYS.has('foregroundColor')).toBe(false);
        // A composite whose members are references, and a raw CSS string that
        // names a param variable - both inherit.
        expect(INHERITED_KEYS.has('tooltipBorder')).toBe(true);
        expect(INHERITED_KEYS.has('focusShadow')).toBe(true);
        expect(INHERITED_KEYS.has('popupShadow')).toBe(false);
        // A size calculated from another param.
        expect(INHERITED_KEYS.has('titleFontSize')).toBe(true);
        expect(INHERITED_SOURCES.titleFontSize).toEqual(['fontSize']);
        expect(INHERITED_KEYS.has('axisTitleFontSize')).toBe(true);
        expect(INHERITED_SOURCES.axisTitleFontSize).toEqual(['fontSize']);
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

describe('what a param inherits from', () => {
    it('names the param a plain reference points at', () => {
        expect(inheritedSourcesOf({ ref: 'foregroundColor' })).toEqual(['foregroundColor']);
    });

    it('names both ends of a blend', () => {
        expect(inheritedSourcesOf({ ref: 'foregroundColor', mix: 0.15, onto: 'backgroundColor' })).toEqual([
            'foregroundColor',
            'backgroundColor',
        ]);
    });

    it('names every member of a composite', () => {
        expect(inheritedSourcesOf({ color: { ref: 'borderColor' }, width: { ref: 'borderWidth' } })).toEqual([
            'borderColor',
            'borderWidth',
        ]);
    });

    it('names the params a raw CSS default references', () => {
        expect(inheritedSourcesOf('0 0 0 3px color-mix(in srgb, var(--ag-accent-color) 50%, transparent)')).toEqual([
            'accentColor',
        ]);
    });

    it('names nothing for a value that stands alone', () => {
        expect(inheritedSourcesOf('#fff')).toEqual([]);
        expect(inheritedSourcesOf(12)).toEqual([]);
        expect(inheritedSourcesOf(undefined)).toEqual([]);
        // A variable that is not a public param - AG Charts has private ones -
        // is not something the panel can offer to send the user to.
        expect(inheritedSourcesOf('1px solid var(--ag-not-a-param)')).toEqual([]);
    });

    it('names the params a calculated length scales from', () => {
        expect(inheritedSourcesOf({ calc: 'borderRadius * 0.5' })).toEqual(['borderRadius']);
    });

    it('can say what every inherited param inherits from', () => {
        // The note's copy reads "Inherited from <name>", so a param with
        // nothing to name would render an unfinished sentence.
        const unexplained = [...INHERITED_KEYS].filter((key) => (INHERITED_SOURCES[key]?.length ?? 0) === 0);
        expect(unexplained).toEqual([]);
    });
});
