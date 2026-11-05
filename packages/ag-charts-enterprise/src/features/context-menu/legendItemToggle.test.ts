import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance, AgChartOptions, AgDonutSeriesOptions, AgLineSeriesOptions } from 'ag-charts-community';
import {
    clickLegendItem,
    doubleClickLegendItem,
    getLegendItemStates,
    openLegendItemContextMenu,
    setupMockCanvas,
    setupMockConsole,
    setupMockPointerEvent,
    waitForChartStability,
} from 'ag-charts-community-test';

import { createEnterpriseChart, findContextMenuItem } from '../../test/utils';

type Interaction = 'click' | 'double-click' | 'menu: Toggle Visibility' | 'menu: Toggle Other Series';

/** A set of legend items that the legend shows and hides together. */
interface Unit {
    name: string;
    ids: string[];
    /** Legend index of the unit's first item. */
    index: number;
    /** Legend index of another item in the unit, when it has one. */
    otherIndex?: number;
}

interface Mode {
    name: string;
    series: AgChartOptions['series'];
    /** Legend item ids, in legend order. */
    ids: string[];
    units: Unit[];
    /** The unit most interactions target, and the last one left visible in the preventHidingAll rows. */
    focus: string;
    lines: boolean;
}

interface Case {
    mode: Mode;
    interaction: Interaction;
    title: string;
    preventHidingAll?: boolean;
    setup: number[];
    target: number;
    hidden: string[];
    menuDisabled?: 'true' | 'false';
    fails?: boolean;
}

const COLOURS: Record<string, string> = {
    Shared: 'red',
    a: 'red',
    b: 'green',
    c: 'blue',
    Alpha: 'red',
    Beta: 'green',
    Gamma: 'blue',
};
const XS = [0, 1, 2, 3];

function line(id: string, yKey: string, extra?: Partial<AgLineSeriesOptions>): AgLineSeriesOptions {
    const colour = COLOURS[extra?.legendItemName ?? id];
    return {
        type: 'line',
        id,
        xKey: 'x',
        yKey,
        yName: id,
        data: XS.map((x) => ({ x, [yKey]: x + id.charCodeAt(0) })),
        stroke: colour,
        marker: { fill: colour, stroke: colour },
        ...extra,
    };
}

function ring(id: string, names: string[]): AgDonutSeriesOptions {
    return {
        type: 'donut',
        id,
        angleKey: 'value',
        legendItemKey: 'name',
        data: names.map((name) => ({ name, value: 1 })),
        fills: names.map((name) => COLOURS[name]),
    };
}

function lineMode(name: string, yKeys: string[]): Mode {
    const ids = ['a', 'b', 'c'];
    return {
        name,
        series: ids.map((id, index) => line(id, yKeys[index])),
        ids: ids.map((id, index) => `${id}:${yKeys[index]}`),
        units: ids.map((id, index) => ({ name: id, ids: [`${id}:${yKeys[index]}`], index })),
        focus: 'b',
        lines: true,
    };
}

function sharedNameMode(name: string, reverseB: boolean): Mode {
    const b = line('b', 'y', { legendItemName: 'Shared' });
    return {
        name,
        series: [
            line('a', 'y', { legendItemName: 'Shared' }),
            reverseB ? { ...b, data: [...(b.data ?? [])].reverse() } : b,
            line('c', 'y'),
        ],
        ids: ['a:y', 'b:y', 'c:y'],
        units: [
            { name: 'Shared', ids: ['a:y', 'b:y'], index: 0, otherIndex: 1 },
            { name: 'c', ids: ['c:y'], index: 2 },
        ],
        focus: 'Shared',
        lines: true,
    };
}

function sharedKeyMode(name: string, outer: string[]): Mode {
    const inner = ['Alpha', 'Beta', 'Gamma'];
    return {
        name,
        series: [ring('inner', inner), ring('outer', outer)],
        ids: [...inner.map((_, i) => `inner:${i}`), ...outer.map((_, i) => `outer:${i}`)],
        units: inner.map((unit, index) => ({
            name: unit,
            ids: [`inner:${index}`, `outer:${outer.indexOf(unit)}`],
            index,
            otherIndex: inner.length + outer.indexOf(unit),
        })),
        focus: 'Beta',
        lines: false,
    };
}

const MODES: Mode[] = [
    lineMode('unique keys', ['y1', 'y2', 'y3']),
    lineMode('shared yKey', ['y', 'y', 'y']),
    sharedKeyMode('shared legendItemKey', ['Alpha', 'Beta', 'Gamma']),
    sharedKeyMode('shared legendItemKey, reordered', ['Gamma', 'Alpha', 'Beta']),
    sharedNameMode('shared legendItemName', false),
    // Line legend identity is series-level, so the data order cannot change the result here.
    sharedNameMode('shared legendItemName, reordered', true),
];

function casesFor(mode: Mode): Case[] {
    const unit = (name: string) => mode.units.find((u) => u.name === name)!;
    const others = (...names: string[]) => mode.units.filter((u) => !names.includes(u.name));
    const idsOf = (units: Unit[]) => units.flatMap((u) => u.ids);
    const indexOf = (u: Unit) => u.otherIndex ?? u.index;

    const focus = unit(mode.focus);
    const survivor = focus;
    const [hiddenTarget] = others(mode.focus);
    const hideAllButSurvivor = others(mode.focus).map((u) => u.index);
    const cases: Case[] = [];
    const add = (interaction: Interaction, title: string, rest: Omit<Case, 'mode' | 'interaction' | 'title'>) =>
        cases.push({ mode, interaction, title, ...rest });

    const targets = mode.units.length === 2 ? mode.units : [focus];
    const clickTargets = mode.lines
        ? targets.map((u) => ({ u, target: indexOf(u) }))
        : [
              { u: mode.units[0], target: mode.units[0].index },
              { u: focus, target: indexOf(focus) },
          ];
    for (const { u, target } of clickTargets) {
        add('click', `hides ${u.name}`, { setup: [], target, hidden: u.ids });
    }
    for (const u of targets) {
        add('menu: Toggle Visibility', `hides ${u.name}`, { setup: [], target: indexOf(u), hidden: u.ids });
    }

    if (mode.lines) {
        // Known defect: beside an unnamed series, double-click counts only the named items and so shows everything.
        const fails = mode.units.length === 2;
        for (const u of targets) {
            for (const interaction of ['double-click', 'menu: Toggle Other Series'] as const) {
                add(interaction, `leaves only ${u.name} visible`, {
                    setup: [],
                    target: u.index,
                    hidden: idsOf(others(u.name)),
                    fails,
                });
            }
        }
    } else {
        // Characterisation: on rings, double-click only restores the clicked name, in both rings.
        const [, restored, kept] = mode.units;
        add('double-click', `restores ${restored.name} in both rings and leaves ${kept.name} hidden`, {
            setup: [restored.index, kept.index],
            target: restored.otherIndex!,
            hidden: kept.ids,
        });
    }

    add('menu: Toggle Visibility', `shows hidden ${hiddenTarget.name} again`, {
        preventHidingAll: true,
        setup: hideAllButSurvivor,
        target: indexOf(hiddenTarget),
        hidden: idsOf(others(mode.focus, hiddenTarget.name)),
        menuDisabled: 'false',
    });

    const stillHidden = idsOf(others(mode.focus));
    const phaRow = (interaction: Interaction, title: string, hidden: string[], menuDisabled?: 'true') =>
        add(interaction, title, {
            preventHidingAll: true,
            setup: hideAllButSurvivor,
            target: indexOf(survivor),
            hidden,
            menuDisabled,
        });
    phaRow('click', `keeps the last visible ${survivor.name} shown`, stillHidden);
    phaRow('menu: Toggle Visibility', `keeps the last visible ${survivor.name} shown`, stillHidden, 'true');
    // Double-click always shows the clicked item, so these rows hold whether or not the guard works.
    if (mode.lines) {
        phaRow('double-click', `on the last visible ${survivor.name} shows every series`, []);
        phaRow('menu: Toggle Other Series', `on the last visible ${survivor.name} shows every series`, [], 'true');
    } else {
        phaRow('double-click', `on the last visible ${survivor.name} changes nothing`, stillHidden);
    }

    const [extra] = others(mode.focus);
    add('menu: Toggle Visibility', `hides ${survivor.name} while ${extra.name} is still visible`, {
        preventHidingAll: true,
        setup: others(mode.focus, extra.name).map((u) => u.index),
        target: indexOf(survivor),
        hidden: idsOf(others(extra.name)),
        menuDisabled: 'false',
    });

    return cases;
}

const CASES = MODES.flatMap(casesFor).map((c) => ({
    ...c,
    modeName: c.mode.name,
    title: c.preventHidingAll ? `preventHidingAll ${c.title}` : c.title,
}));

describe('legend item toggles across shared series identities', () => {
    setupMockConsole();
    setupMockCanvas();
    setupMockPointerEvent();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    async function run({ mode, interaction, preventHidingAll, setup, target, menuDisabled }: Case) {
        chart = await createEnterpriseChart({
            series: mode.series,
            legend: { enabled: true, preventHidingAll },
            contextMenu: { enabled: true },
        } as AgChartOptions);

        // Rings sharing a legendItemKey are listed separately, not merged: observed behaviour that the legend indices
        // below rely on.
        expect(getLegendItemStates(chart).map(({ id }) => id)).toEqual(mode.ids);

        for (const index of setup) {
            await clickLegendItem(chart, index);
            await waitForChartStability(chart);
        }

        if (interaction === 'click') {
            await clickLegendItem(chart, target);
            await waitForChartStability(chart);
        } else if (interaction === 'double-click') {
            await doubleClickLegendItem(chart, target);
        } else {
            await openLegendItemContextMenu(chart, target);
            expect(findContextMenuItem('Toggle Visibility').getAttribute('aria-disabled')).toBe(
                menuDisabled ?? 'false'
            );
            const label = interaction === 'menu: Toggle Visibility' ? 'Toggle Visibility' : 'Toggle Other Series';
            findContextMenuItem(label).dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            await waitForChartStability(chart);
        }
    }

    function expectHidden(mode: Mode, hidden: string[]) {
        expect(getLegendItemStates(chart!)).toEqual(
            mode.ids.map((id) => ({ id, enabled: !hidden.includes(id), checked: !hidden.includes(id) }))
        );
    }

    it.each(CASES.filter((c) => !c.fails))('$modeName — $interaction — $title', async (c) => {
        await run(c);
        expectHidden(c.mode, c.hidden);
    });

    it.fails.each(CASES.filter((c) => c.fails))('$modeName — $interaction — $title', async (c) => {
        await run(c);
        expectHidden(c.mode, c.hidden);
    });
});
