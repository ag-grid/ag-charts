import { describe, expect, it } from 'vitest';

import { boolean, callback, number, object } from '../state/validation';
import { type ModuleDefinition, ModuleType } from './moduleDefinition';
import { createModuleScope } from './moduleScope';
import {
    composeContributedDefs,
    contributionHost,
    contributionMatchesChartType,
    contributionsOf,
    isContributionRequested,
    nestAtOptionsPath,
    parseOptionsPath,
    readContributedValue,
    resolveContributions,
    visitOptionsPath,
} from './optionsContribution';

const base = { version: '1.0.0', create: () => ({}) } as const;
const plugin = (name: string, extra: Partial<ModuleDefinition> = {}): ModuleDefinition => ({
    type: ModuleType.Plugin,
    name,
    ...base,
    ...extra,
});

describe('parseOptionsPath', () => {
    it('splits dotted segments and marks `[]` hosts', () => {
        expect(parseOptionsPath('axes[].listeners.click').segments).toEqual([
            { key: 'axes', each: true },
            { key: 'listeners', each: false },
            { key: 'click', each: false },
        ]);
    });

    it('returns the same instance for a repeated path', () => {
        expect(parseOptionsPath('zoom')).toBe(parseOptionsPath('zoom'));
    });

    it.each(['', 'axes[', 'axes[]x.y', '.zoom', 'a..b', 'series[]'])('rejects %j', (path) => {
        expect(() => parseOptionsPath(path)).toThrow(/options contribution path/);
    });
});

describe('contributionHost', () => {
    it('splits axis and series hosts from the relative path', () => {
        expect(contributionHost(parseOptionsPath('axes[].listeners.click'))).toEqual({
            host: 'axis',
            relative: parseOptionsPath('listeners.click'),
        });
        expect(contributionHost(parseOptionsPath('series[].errorBar'))).toEqual({
            host: 'series',
            relative: parseOptionsPath('errorBar'),
        });
    });

    it('treats every other path as the chart host', () => {
        const path = parseOptionsPath('seriesArea.backgroundRegions');
        expect(contributionHost(path)).toEqual({ host: 'chart', relative: path });
    });
});

describe('contributionsOf', () => {
    it('derives a root location for a plugin', () => {
        const options = { enabled: boolean };
        expect(
            contributionsOf({ type: ModuleType.Plugin, name: 'zoom', chartType: 'cartesian', options, ...base })
        ).toEqual([{ path: 'zoom', options, chartTypes: ['cartesian'] }]);
    });

    it('derives an axis-host location for an axis plugin, honouring `optionsKey`', () => {
        const [contribution] = contributionsOf({
            type: ModuleType.AxisPlugin,
            name: 'polarCrossLines',
            optionsKey: 'crossLines',
            chartType: 'polar',
            axisTypes: ['angle-number'],
            ...base,
        });
        expect(contribution).toMatchObject({
            path: 'axes[].crossLines',
            chartTypes: ['polar'],
            axisTypes: ['angle-number'],
        });
        expect(contribution.requested).toBeUndefined();
    });

    it('derives a series-host location for a series plugin', () => {
        const [contribution] = contributionsOf({
            type: ModuleType.SeriesPlugin,
            name: 'errorBar',
            seriesTypes: ['bar', 'line'],
            ...base,
        });
        expect(contribution).toMatchObject({
            path: 'series[].errorBar',
            seriesTypes: ['bar', 'line'],
            requested: 'present',
        });
    });

    it.each([ModuleType.Chart, ModuleType.Axis, ModuleType.Series, ModuleType.Preset])(
        'derives nothing for a %s module',
        (type) => {
            expect(contributionsOf({ type, name: 'x', ...base })).toEqual([]);
        }
    );

    it('prefers explicit `contributes` over the derived location', () => {
        const contributes = [
            { path: 'axes[].listeners.click', options: callback },
            { path: 'listeners.axisClick', options: callback },
        ];
        expect(contributionsOf({ type: ModuleType.Plugin, name: 'axis-interaction', contributes, ...base })).toBe(
            contributes
        );
    });

    it('gives explicit contributions the definition chart type unless they declare their own', () => {
        const contributes = [{ path: 'listeners.axisClick' }, { path: 'seriesArea.x', chartTypes: ['polar'] }];
        expect(
            contributionsOf({ type: ModuleType.Plugin, name: 'x', chartType: 'cartesian', contributes, ...base })
        ).toEqual([
            { path: 'listeners.axisClick', chartTypes: ['cartesian'] },
            { path: 'seriesArea.x', chartTypes: ['polar'] },
        ]);
    });
});

describe('contributionMatchesChartType', () => {
    it('applies everywhere when no chart types are declared', () => {
        expect(contributionMatchesChartType({ path: 'x' }, 'polar')).toBe(true);
    });

    it('filters by declared chart types', () => {
        expect(contributionMatchesChartType({ path: 'x', chartTypes: ['cartesian'] }, 'polar')).toBe(false);
        expect(contributionMatchesChartType({ path: 'x', chartTypes: ['cartesian'] }, 'cartesian')).toBe(true);
    });
});

describe('ModuleScope.optionsContributions', () => {
    it('lists one entry per contribution across the scope chain', () => {
        const parent = createModuleScope();
        parent.register(plugin('zoom'));
        const child = createModuleScope(parent);
        child.register(
            plugin('axis-interaction', {
                contributes: [{ path: 'axes[].listeners.click' }, { path: 'listeners.axisClick' }],
            })
        );

        expect(child.optionsContributions().map((entry) => entry.contribution.path)).toEqual([
            'axes[].listeners.click',
            'listeners.axisClick',
            'zoom',
        ]);
        expect(parent.optionsContributions().map((entry) => entry.contribution.path)).toEqual(['zoom']);
    });

    it('caches until the scope or an ancestor changes', () => {
        const parent = createModuleScope();
        const child = createModuleScope(parent);
        const first = child.optionsContributions();
        expect(child.optionsContributions()).toBe(first);

        parent.register(plugin('zoom'));
        const second = child.optionsContributions();
        expect(second).not.toBe(first);
        expect(second).toHaveLength(1);

        child.register(plugin('navigator'));
        expect(child.optionsContributions()).toHaveLength(2);
    });

    it('indexes contributions by module name', () => {
        const scope = createModuleScope();
        scope.register(plugin('zoom'));
        scope.register(plugin('axis-interaction', { contributes: [{ path: 'listeners.axisClick' }] }));

        expect(scope.moduleContributions('axis-interaction').map((entry) => entry.contribution.path)).toEqual([
            'listeners.axisClick',
        ]);
        expect(scope.moduleContributions('missing')).toEqual([]);
    });

    it('lets an enterprise definition replace the community one by name', () => {
        const scope = createModuleScope();
        scope.register(plugin('series-area'));
        scope.register(
            plugin('series-area', { enterprise: true, contributes: [{ path: 'seriesArea.backgroundRegions' }] })
        );

        expect(scope.optionsContributions().map((entry) => entry.contribution.path)).toEqual([
            'seriesArea.backgroundRegions',
        ]);
    });
});

describe('visitOptionsPath', () => {
    const visited = (options: unknown, path: string) => {
        const hits: string[] = [];
        visitOptionsPath(options, parseOptionsPath(path), (host, key, location) =>
            hits.push(`${location}=${JSON.stringify(host[key])}`)
        );
        return hits;
    };

    it('visits a root key', () => {
        expect(visited({ zoom: { enabled: true } }, 'zoom')).toEqual(['zoom={"enabled":true}']);
    });

    it('visits a nested key and skips absent parents', () => {
        expect(visited({ seriesArea: { backgroundRegions: [] } }, 'seriesArea.backgroundRegions')).toEqual([
            'seriesArea.backgroundRegions=[]',
        ]);
        expect(visited({}, 'seriesArea.backgroundRegions')).toEqual([]);
    });

    it('fans out over array and keyed-record hosts', () => {
        expect(visited({ series: [{ errorBar: 1 }, {}, { errorBar: 2 }] }, 'series[].errorBar')).toEqual([
            'series[0].errorBar=1',
            'series[1].errorBar=undefined',
            'series[2].errorBar=2',
        ]);
        expect(visited({ axes: { x: { listeners: { click: 'a' } }, y: {} } }, 'axes[].listeners.click')).toEqual([
            'axes.x.listeners.click="a"',
        ]);
    });

    it('ignores non-object hosts', () => {
        expect(visited({ axes: 3 }, 'axes[].crossLines')).toEqual([]);
        expect(visited(null, 'zoom')).toEqual([]);
    });
});

describe('readContributedValue', () => {
    it('reads the first set location on the host, ignoring other hosts', () => {
        const contributions = resolveContributions([
            {
                type: ModuleType.Plugin,
                name: 'x',
                ...base,
                contributes: [{ path: 'listeners.axisClick' }, { path: 'axes[].listeners.click' }],
            },
        ]);
        const click = () => {};
        expect(readContributedValue(contributions, 'axis', { listeners: { click } })).toBe(click);
        expect(readContributedValue(contributions, 'axis', { listeners: {} })).toBeUndefined();
        expect(readContributedValue(contributions, 'chart', { listeners: { click } })).toBeUndefined();
    });
});

describe('nestAtOptionsPath', () => {
    it('wraps a value in the path keys', () => {
        const value = { fill: 'red' };
        expect(nestAtOptionsPath(parseOptionsPath('seriesArea.backgroundRegions'), value)).toEqual({
            seriesArea: { backgroundRegions: value },
        });
        expect(nestAtOptionsPath(parseOptionsPath('zoom'), value)).toEqual({ zoom: value });
    });
});

describe('isContributionRequested', () => {
    const subtree = { path: 'zoom' };
    const leaf = { path: 'listeners.axisClick', options: callback };

    it('treats a disabled subtree as not requested unless the contribution says otherwise', () => {
        expect(isContributionRequested(subtree, { enabled: false })).toBe(false);
        expect(isContributionRequested(subtree, { enabled: true })).toBe(true);
        expect(isContributionRequested(subtree, {})).toBe(true);
        expect(isContributionRequested({ ...subtree, requested: 'present' }, { enabled: false })).toBe(true);
    });

    it('counts any non-null value that is not a disabled object', () => {
        expect(isContributionRequested(subtree, true)).toBe(true);
        expect(isContributionRequested(subtree, undefined)).toBe(false);
        expect(isContributionRequested(leaf, () => {})).toBe(true);
        expect(isContributionRequested(leaf, null)).toBe(false);
    });
});

describe('composeContributedDefs', () => {
    it('installs contributed defs at their paths without mutating the base defs', () => {
        const defs = { title: { text: number }, listeners: { click: callback } } as any;
        const zoomDefs = { enabled: boolean };
        const composed = composeContributedDefs(
            defs,
            resolveContributions([
                plugin('zoom', { options: zoomDefs }),
                plugin('axis-interaction', { contributes: [{ path: 'listeners.axisClick', options: callback }] }),
            ])
        ) as any;

        expect(composed.zoom).toBe(zoomDefs);
        expect(composed.listeners).toEqual({ click: callback, axisClick: callback });
        expect(composed.title).toBe(defs.title);
        expect(defs.zoom).toBeUndefined();
        expect(defs.listeners.axisClick).toBeUndefined();
    });

    it('keeps an existing def and otherwise falls back to `object` when the contribution has no options', () => {
        const defs = { statusBar: boolean } as any;
        const composed = composeContributedDefs(
            defs,
            resolveContributions([plugin('statusBar'), plugin('navigator')])
        ) as any;

        expect(composed.statusBar).toBe(boolean);
        expect(composed.navigator).toBe(object);
    });

    it('ignores axis and series host paths and returns the base defs untouched when nothing applies', () => {
        const defs = { title: { text: number } } as any;
        expect(
            composeContributedDefs(
                defs,
                resolveContributions([
                    { type: ModuleType.AxisPlugin, name: 'crosshair', ...base },
                    { type: ModuleType.SeriesPlugin, name: 'errorBar', ...base },
                ])
            )
        ).toBe(defs);
    });
});
