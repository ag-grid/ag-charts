import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

// Allowlists may only shrink. To guard another barrel, add an entry and run the update command once.
const GUARDED_BARRELS: GuardedBarrel[] = [
    {
        name: '_ModuleSupport',
        barrel: 'module-support.ts',
        allowlist: 'module-support.allowlist.json',
        alternative:
            'Import the symbol from ag-charts-core, or reach the instance through the chart context (ctx), instead of adding it to `_ModuleSupport`.',
    },
];

interface GuardedBarrel {
    name: string;
    /** Barrel source, relative to this directory. */
    barrel: string;
    /** Sorted JSON array of the names the barrel may still export, relative to this directory. */
    allowlist: string;
    /** Shown when a name is added: where the symbol should come from instead. */
    alternative: string;
}

// Update mode creates missing allowlists and prunes stale entries; it never adds to an existing one.
const update = process.env.UPDATE_EXPORT_ALLOWLISTS === '1';
const updateHint =
    'Run `UPDATE_EXPORT_ALLOWLISTS=1 yarn nx test ag-charts-community --skip-nx-cache -- exportAllowlist` to prune it.';

function writeAllowlist(path: string, names: Iterable<string>) {
    writeFileSync(path, `${JSON.stringify([...names].sort(), null, 4)}\n`);
}

function exportedNames(path: string) {
    const sourceFile = ts.createSourceFile(path, readFileSync(path, 'utf-8'), ts.ScriptTarget.Latest);
    const names = new Set<string>();
    for (const statement of sourceFile.statements) {
        if (ts.isExportDeclaration(statement)) {
            const clause = statement.exportClause;
            if (clause == null) throw new Error(`${path}: \`export *\` cannot be guarded; name each export.`);
            if (ts.isNamespaceExport(clause)) {
                names.add(clause.name.text);
            } else {
                for (const element of clause.elements) names.add(element.name.text);
            }
        } else if (hasExportModifier(statement)) {
            if (ts.isVariableStatement(statement)) {
                for (const { name } of statement.declarationList.declarations) {
                    if (ts.isIdentifier(name)) names.add(name.text);
                }
            } else if (isNamedDeclaration(statement) && statement.name) {
                names.add(statement.name.text);
            }
        }
    }
    return names;
}

function hasExportModifier(node: ts.Node) {
    return ts.canHaveModifiers(node) && ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
}

function isNamedDeclaration(node: ts.Node) {
    return (
        ts.isFunctionDeclaration(node) ||
        ts.isClassDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node) ||
        ts.isEnumDeclaration(node)
    );
}

describe.each(GUARDED_BARRELS)('$name export allowlist', ({ name, barrel, allowlist, alternative }) => {
    const allowlistPath = join(__dirname, allowlist);
    const exported = exportedNames(join(__dirname, barrel));
    if (!existsSync(allowlistPath)) {
        if (!update) throw new Error(`${allowlist} is missing. ${updateHint.replace('prune', 'create')}`);
        writeAllowlist(allowlistPath, exported);
    }
    const allowed: string[] = JSON.parse(readFileSync(allowlistPath, 'utf-8'));

    it('should not export names missing from the allowlist', () => {
        const added = [...exported].filter((n) => !allowed.includes(n)).sort();
        expect(added, `${name} gained exports. ${alternative}`).toEqual([]);
    });

    it('should not list names the barrel no longer exports', () => {
        const stale = allowed.filter((n) => !exported.has(n));
        if (update && stale.length > 0) {
            writeAllowlist(
                allowlistPath,
                allowed.filter((n) => exported.has(n))
            );
            return;
        }
        expect(stale, `${allowlist} lists names ${name} no longer exports. ${updateHint}`).toEqual([]);
    });
});
