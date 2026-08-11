import * as path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import inventory from './zone-callback-inventory.json';

/**
 * Guards `AgChartsBase.patchChartOptions` against drift in `ag-charts-types`.
 *
 * The Angular wrapper creates charts outside the Angular zone, so event-style callbacks in the
 * options (listeners, context-menu actions, ...) must be explicitly re-entered into the zone or
 * change detection never runs for anything they do. This test walks the public root option types
 * and collects every "event-like" callback surface:
 *
 * - callbacks whose return type is void-like (listeners, actions), or
 * - callbacks whose return value carries further callbacks (e.g. `getItems` returning items
 *   with `action` callbacks) — the shape that motivated this guard.
 *
 * Value-returning render callbacks (formatters, renderers, stylers) are excluded — they run
 * during rendering and must NOT trigger change detection. Known render-path property names
 * (IGNORED_PROPERTY_NAMES) are skipped outright, even where their return types carry nested
 * callbacks (e.g. stylers whose style result may include a marker shape draw callback).
 *
 * Every collected surface must be classified in zone-callback-inventory.json as either
 * `zone-wrap` (patchChartOptions handles it) or `no-wrap` (deliberate, with a reason).
 * A new unclassified surface fails this test: decide whether patchChartOptions must wrap it,
 * then add the entry.
 */

const TYPES_ENTRY = path.resolve(__dirname, '../../ag-charts-types/src/main.ts');
const ROOT_TYPES = [
    'AgChartOptions',
    'AgFinancialChartOptions',
    'AgGaugeOptions',
    'AgQuadrantChartOptions',
    'AgSparklineOptions',
];
const CARRIES_CALLBACKS_DEPTH = 3;
// Render-path callbacks by convention; not intended to mutate state, so never zone-wrapped.
const IGNORED_PROPERTY_NAMES = new Set(['renderer', 'itemStyler', 'styler', 'shape', 'formatter']);

type Classification = { classification: 'zone-wrap' | 'no-wrap'; reason: string };

function collectCallbackSurfaces(): Set<string> {
    const program = ts.createProgram([TYPES_ENTRY], {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        strict: true,
        skipLibCheck: true,
        lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
    });
    const checker = program.getTypeChecker();
    const entryFile = program.getSourceFile(TYPES_ENTRY);
    if (!entryFile) throw new Error(`Cannot load ${TYPES_ENTRY}`);
    const moduleSymbol = checker.getSymbolAtLocation(entryFile);
    if (!moduleSymbol) throw new Error('Cannot resolve ag-charts-types module symbol');

    const surfaces = new Set<string>();
    const visited = new Set<number>();

    const typeId = (t: ts.Type): number => (t as any).id;

    const expand = (t: ts.Type): ts.Type[] => (t.isUnionOrIntersection() ? t.types.flatMap(expand) : [t]);

    const isLocalType = (t: ts.Type): boolean => {
        const sym = t.aliasSymbol ?? t.getSymbol();
        return (sym?.declarations ?? []).some((d) => d.getSourceFile().fileName.includes('ag-charts-types'));
    };

    const ownerName = (prop: ts.Symbol): string => {
        let node: ts.Node | undefined = prop.declarations?.[0];
        while (node) {
            if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) return node.name.text;
            node = node.parent;
        }
        return '<anonymous>';
    };

    const isDeclaredLocally = (prop: ts.Symbol): boolean =>
        (prop.declarations ?? []).some((d) => d.getSourceFile().fileName.includes('ag-charts-types'));

    const isVoidLike = (t: ts.Type): boolean =>
        expand(t).every(
            (m) => m.flags & (ts.TypeFlags.Void | ts.TypeFlags.Undefined | ts.TypeFlags.Any | ts.TypeFlags.Never)
        );

    const carriesCallbacks = (t: ts.Type, depth: number, seen: Set<number>): boolean => {
        if (depth < 0) return false;
        for (const member of expand(t)) {
            if (seen.has(typeId(member))) continue;
            seen.add(typeId(member));
            if (member.getCallSignatures().length > 0) return true;
            const element = checker.isArrayLikeType(member) ? member.getNumberIndexType() : undefined;
            if (element && carriesCallbacks(element, depth, seen)) return true;
            if (member.flags & ts.TypeFlags.Object && isLocalType(member)) {
                for (const prop of checker.getPropertiesOfType(member)) {
                    if (carriesCallbacks(checker.getTypeOfSymbol(prop), depth - 1, seen)) return true;
                }
            }
        }
        return false;
    };

    const isEventLike = (propType: ts.Type): boolean =>
        expand(propType).some((member) =>
            member.getCallSignatures().some((sig) => {
                const ret = sig.getReturnType();
                return isVoidLike(ret) || carriesCallbacks(ret, CARRIES_CALLBACKS_DEPTH, new Set());
            })
        );

    const walk = (t: ts.Type): void => {
        for (const member of expand(t)) {
            if (visited.has(typeId(member))) continue;
            visited.add(typeId(member));

            if (checker.isArrayLikeType(member)) {
                const element = member.getNumberIndexType();
                if (element) walk(element);
                continue;
            }
            if (!(member.flags & ts.TypeFlags.Object)) continue;

            const stringIndex = member.getStringIndexType();
            if (stringIndex) walk(stringIndex);
            const numberIndex = member.getNumberIndexType();
            if (numberIndex) walk(numberIndex);

            if (!isLocalType(member)) continue;
            for (const prop of checker.getPropertiesOfType(member)) {
                if (!isDeclaredLocally(prop)) continue;
                const propType = checker.getTypeOfSymbol(prop);
                if (expand(propType).some((m) => m.getCallSignatures().length > 0)) {
                    if (!IGNORED_PROPERTY_NAMES.has(prop.name) && isEventLike(propType)) {
                        surfaces.add(`${ownerName(prop)}.${prop.name}`);
                    }
                    continue;
                }
                walk(propType);
            }
        }
    };

    for (const rootName of ROOT_TYPES) {
        const rootSymbol = checker.getExportsOfModule(moduleSymbol).find((exported) => exported.name === rootName);
        if (!rootSymbol) throw new Error(`Root type ${rootName} is not exported from ag-charts-types`);
        walk(checker.getDeclaredTypeOfSymbol(rootSymbol));
    }

    return surfaces;
}

describe('ag-charts-types event-callback inventory', () => {
    const found = collectCallbackSurfaces();
    const classified = inventory as Record<string, Classification>;

    it('finds callback surfaces (anti-vacuous guard)', () => {
        expect(found.size).toBeGreaterThan(0);
    });

    it('has every event-like callback surface classified in zone-callback-inventory.json', () => {
        const missing = [...found].filter((key) => !(key in classified)).sort();
        const candidates = Object.fromEntries(
            missing.map((key) => [key, { classification: 'no-wrap', reason: 'TODO: decide and explain' }])
        );
        expect(
            missing,
            `New event-like callback surface(s) in ag-charts-types. Decide whether AgChartsBase.patchChartOptions ` +
                `must zone-wrap each one, then classify it in zone-callback-inventory.json. Candidate entries:\n` +
                JSON.stringify(candidates, null, 4)
        ).toEqual([]);
    });

    it('has no stale entries in zone-callback-inventory.json', () => {
        const stale = Object.keys(classified)
            .filter((key) => !found.has(key))
            .sort();
        expect(
            stale,
            'Inventory entries no longer present in ag-charts-types — remove them from zone-callback-inventory.json'
        ).toEqual([]);
    });
});
