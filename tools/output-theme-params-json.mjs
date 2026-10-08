#!/usr/bin/env node
/**
 * Used to keep Figma in sync with the code: the generated JSON is the source the
 * Figma theme variables are built from.
 *
 * Generates a JSON reference of every public AG Charts theme parameter, grouped
 * exactly as the Theme Builder groups them.
 *
 * Each entry holds the parameter name, its value type, its description and the
 * default value applied by `ag-default` (the default theme). Defaults derived from
 * other parameters are written in the same reference form as AG Grid's equivalent
 * script, e.g. `{ "ref": "foregroundColor", "mix": 0.02, "onto": "backgroundColor" }`,
 * or `{ "calc": "fontSize * 1.25" }` for a length scaled from another parameter.
 *
 * Sources:
 *  - groups and ordering: packages/ag-charts-website/src/components/theme-builder/params.ts
 *  - type and description: dist/packages/ag-charts-types/resolved-interfaces.AUTO.json
 *      (built by `yarn nx docs-resolved-interfaces ag-charts-types`)
 *  - default values:      packages/ag-charts-community/dist/package/main.esm.mjs
 *      (built by `yarn nx build:package ag-charts-community`)
 *
 * Usage: node tools/output-theme-params-json.mjs --out <path>
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const GROUPS_FILE = 'packages/ag-charts-website/src/components/theme-builder/params.ts';
const DOCS_FILE = 'dist/packages/ag-charts-types/resolved-interfaces.AUTO.json';
const CHARTS_BUNDLE = 'packages/ag-charts-community/dist/package/main.esm.mjs';
// The public params interface, whose resolved members include those it inherits
const PARAMS_INTERFACE = 'AgChartThemeParams';
const DEFAULT_THEME = 'ag-default';

const requireFile = (relativePath, buildCommand) => {
    const absolutePath = resolve(repoRoot, relativePath);
    if (!existsSync(absolutePath)) {
        throw new Error(`Missing ${relativePath}. Build it first with: ${buildCommand}`);
    }
    return absolutePath;
};

const readJson = (absolutePath) => JSON.parse(readFileSync(absolutePath, 'utf8'));

/** The literal value of a property in an object literal, if it is a string. */
const stringProperty = (objectLiteral, name) => {
    const property = objectLiteral.properties.find(
        (node) => ts.isPropertyAssignment(node) && node.name.getText() === name
    );
    return property && ts.isStringLiteral(property.initializer) ? property.initializer.text : undefined;
};

/**
 * Group label -> parameter names, in Theme Builder order. Read from the source of
 * `PARAM_GROUPS` because the builder is TypeScript bundled only into the website.
 */
const readGroups = () => {
    const path = requireFile(GROUPS_FILE, 'n/a - this file is checked in');
    const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);

    let groupsLiteral;
    const visit = (node) => {
        if (ts.isVariableDeclaration(node) && node.name.getText() === 'PARAM_GROUPS') {
            groupsLiteral = node.initializer;
        }
        ts.forEachChild(node, visit);
    };
    visit(source);
    if (!groupsLiteral || !ts.isArrayLiteralExpression(groupsLiteral)) {
        throw new Error(`Could not find the PARAM_GROUPS array literal in ${GROUPS_FILE}`);
    }

    return groupsLiteral.elements.map((group) => {
        const label = stringProperty(group, 'label');
        const params = group.properties.find(
            (node) => ts.isPropertyAssignment(node) && node.name.getText() === 'params'
        );
        if (!label || !params || !ts.isArrayLiteralExpression(params.initializer)) {
            throw new Error(`Unexpected group shape in ${GROUPS_FILE}: ${group.getText()}`);
        }
        return [label, params.initializer.elements.map((param) => stringProperty(param, 'key'))];
    });
};

/** A resolved type from the docs reference, as written in TypeScript. */
const typeToString = (type) => {
    if (typeof type === 'string') return type;
    switch (type.kind) {
        case 'union':
            return type.type.map(typeToString).join(' | ');
        case 'array':
            return `${typeToString(type.type)}[]`;
        default:
            throw new Error(`Unsupported type kind "${type.kind}" in ${DOCS_FILE}`);
    }
};

/** Parameter name -> { type, description }, from the generated docs reference. */
const readDocs = () => {
    const interfaces = readJson(requireFile(DOCS_FILE, 'yarn nx docs-resolved-interfaces ag-charts-types'));
    const members = interfaces[PARAMS_INTERFACE]?.members;
    if (!members) {
        throw new Error(`No generated documentation for ${PARAMS_INTERFACE}`);
    }
    return Object.fromEntries(
        members.map((member) => [
            member.name,
            { type: typeToString(member.type), description: (member.docs ?? []).join('\n') },
        ])
    );
};

const isOperation = (value) => typeof value === 'object' && value != null && !Array.isArray(value);

/** Pull the param name out of a `{ $ref }`, or undefined for anything else. */
const refName = (value) => (isOperation(value) && typeof value.$ref === 'string' ? value.$ref : undefined);

/**
 * Convert one internal default, written with `$`-prefixed theme operations, into
 * the reference form AG Grid's script outputs. Mirrors `toStackParamValue` in the
 * Theme Builder's `chartsTheme.ts`, but resolves `$if` against the default theme's
 * own params, and throws on anything it cannot express rather than dropping it.
 */
const toReferenceForm = (name, value, params) => {
    if (!isOperation(value)) {
        // strings, numbers (px lengths and font weights), booleans and font-family arrays
        return value;
    }
    if ('$ref' in value) {
        return { ref: value.$ref };
    }
    if ('$foregroundBackgroundMix' in value) {
        // `ratio` is the weight of the foreground colour
        return { ref: 'foregroundColor', mix: value.$foregroundBackgroundMix, onto: 'backgroundColor' };
    }
    if ('$mix' in value) {
        const [a, b, t] = value.$mix;
        const ref = refName(a);
        const onto = refName(b);
        if (ref != null && onto != null) {
            // Color.mix(a, b, t) lerps a -> b, so `a` carries a weight of 1 - t
            return { ref, mix: Number((1 - t).toFixed(6)), onto };
        }
    }
    if ('$multiply' in value) {
        const [ratio, source] = value.$multiply;
        const sourceName = refName(source);
        if (typeof ratio === 'number' && sourceName != null) {
            return { calc: `${sourceName} * ${ratio}` };
        }
    }
    if ('$rem' in value) {
        // A ratio of a font size param, `fontSize` unless named
        const [ratio, param = 'fontSize'] = Array.isArray(value.$rem) ? value.$rem : [value.$rem];
        if (typeof ratio === 'number' && typeof param === 'string') {
            return { calc: `${param} * ${Number(ratio.toFixed(6))}` };
        }
    }
    if ('$if' in value) {
        const [condition, whenTrue, whenFalse] = value.$if;
        const [subject, typeName] = condition.$isType ?? [];
        const subjectName = refName(subject);
        if (subjectName != null && typeof typeName === 'string') {
            const branch = typeof params[subjectName] === typeName ? whenTrue : whenFalse;
            return toReferenceForm(name, branch, params);
        }
    }
    if (Object.keys(value).some((key) => key.startsWith('$'))) {
        throw new Error(`Cannot express the default of "${name}" in reference form: ${JSON.stringify(value)}`);
    }
    // Composite params such as `buttonBorder: { color, width }`, whose members are themselves operations
    return Object.fromEntries(
        Object.entries(value).map(([key, member]) => [key, toReferenceForm(`${name}.${key}`, member, params)])
    );
};

/** Parameter name -> default value, as held by the default theme in reference form. */
const readDefaults = async () => {
    const bundle = requireFile(CHARTS_BUNDLE, 'yarn nx build:package ag-charts-community');
    const { _Theme } = await import(pathToFileURL(bundle).href);
    const { params } = _Theme.themes[DEFAULT_THEME]();
    return { publicNames: Object.keys(_Theme.ChartTheme.getDefaultPublicParameters()), params };
};

const generate = async () => {
    const docs = readDocs();
    const { publicNames, params } = await readDefaults();
    const groups = readGroups();

    const grouped = groups.flatMap(([, names]) => names);
    const missing = publicNames.filter((name) => !grouped.includes(name));
    if (missing.length > 0) {
        throw new Error(`Theme parameters missing from the Theme Builder groups: ${missing.join(', ')}`);
    }

    const output = {};
    for (const [groupName, parameterNames] of groups) {
        output[groupName] = parameterNames.map((name) => {
            const doc = docs[name];
            if (!doc) {
                throw new Error(`No generated documentation for theme parameter "${name}"`);
            }
            if (params[name] === undefined) {
                throw new Error(`No default value for theme parameter "${name}"`);
            }
            return {
                name,
                type: doc.type,
                description: doc.description,
                defaultValue: toReferenceForm(name, params[name], params),
            };
        });
    }
    return output;
};

const outIndex = process.argv.indexOf('--out');
const outArg = outIndex === -1 ? undefined : process.argv[outIndex + 1];
if (!outArg) {
    console.error('Usage: node tools/output-theme-params-json.mjs --out <path>');
    process.exit(1);
}
const outPath = resolve(process.cwd(), outArg);

const parameters = await generate();
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(parameters, null, 2)}\n`);

const count = Object.values(parameters).reduce((total, group) => total + group.length, 0);
console.log(`Wrote ${count} theme parameters in ${Object.keys(parameters).length} groups to ${outPath}`);
