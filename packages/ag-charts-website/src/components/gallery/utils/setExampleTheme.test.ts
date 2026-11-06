import fs from 'node:fs';
import path from 'node:path';
import { format } from 'prettier';
import ts from 'typescript';

import { setExampleTheme } from './setExampleTheme';

const GALLERY_EXAMPLES_DIR = path.resolve(__dirname, '../../../content/gallery/_examples');

const lines = (...source: string[]) => source.join('\n');

const getStringLiteral = (node: ts.Expression | undefined) =>
    node != null && ts.isStringLiteral(node) ? node.text : node?.getText();

const getPropertyValues = (object: ts.ObjectLiteralExpression | undefined, name: string) => {
    const properties: readonly ts.ObjectLiteralElementLike[] = object?.properties ?? [];
    return properties
        .filter(
            (property): property is ts.PropertyAssignment =>
                ts.isPropertyAssignment(property) && ts.isIdentifier(property.name) && property.name.text === name
        )
        .map((property) => property.initializer);
};

const getThemeName = (theme: ts.Expression) =>
    getStringLiteral(ts.isObjectLiteralExpression(theme) ? getPropertyValues(theme, 'baseTheme')[0] : theme);

/** The theme names on each top-level options object passed to `AgCharts.create*()`, read from the AST. */
const getCreatedOptionsThemes = (source: string) => {
    const file = ts.createSourceFile('main.ts', source, ts.ScriptTarget.Latest, true);
    const optionsByName = new Map<string, ts.ObjectLiteralExpression>();
    for (const statement of file.statements) {
        if (!ts.isVariableStatement(statement)) continue;
        for (const { name, initializer } of statement.declarationList.declarations) {
            if (ts.isIdentifier(name) && initializer != null && ts.isObjectLiteralExpression(initializer)) {
                optionsByName.set(name.text, initializer);
            }
        }
    }

    const createdNames = new Set<string>();
    const visit = (node: ts.Node) => {
        if (
            ts.isCallExpression(node) &&
            /^AgCharts\.create\w*$/.test(node.expression.getText()) &&
            node.arguments.length === 1 &&
            ts.isIdentifier(node.arguments[0])
        ) {
            createdNames.add(node.arguments[0].text);
        }
        ts.forEachChild(node, visit);
    };
    visit(file);

    return Array.from(createdNames, (name) => getPropertyValues(optionsByName.get(name), 'theme').map(getThemeName));
};

describe('setExampleTheme', () => {
    it('adds the theme after the container when the options have none', () => {
        const source = lines(
            'const options = {',
            "    container: document.getElementById('myChart'),",
            '    data: getData(),',
            '};',
            'AgCharts.create(options);'
        );

        expect(setExampleTheme(source, 'ag-vivid')).toBe(
            lines(
                'const options = {',
                "    container: document.getElementById('myChart'),",
                "    theme: 'ag-vivid',",
                '    data: getData(),',
                '};',
                'AgCharts.create(options);'
            )
        );
    });

    it('adds the theme first when the options have no container', () => {
        const source = lines(
            'const options: AgChartOptions = {',
            '    data: getData(),',
            '};',
            'AgCharts.create(options);'
        );

        expect(setExampleTheme(source, 'ag-sheets-dark')).toBe(
            lines(
                'const options: AgChartOptions = {',
                "    theme: 'ag-sheets-dark',",
                '    data: getData(),',
                '};',
                'AgCharts.create(options);'
            )
        );
    });

    it('replaces a theme name', () => {
        const source = lines('const options = {', "    theme: 'ag-default',", '};', 'AgCharts.create(options);');

        expect(setExampleTheme(source, 'ag-material')).toBe(
            lines('const options = {', "    theme: 'ag-material',", '};', 'AgCharts.create(options);')
        );
    });

    it('adds a base theme to a theme object, keeping its overrides', () => {
        const source = lines(
            'const options = {',
            '    theme: {',
            '        overrides: {',
            '            bar: { series: { label: { enabled: true } } },',
            '        },',
            '    },',
            '};',
            'AgCharts.create(options);'
        );

        expect(setExampleTheme(source, 'ag-polychroma')).toBe(
            lines(
                'const options = {',
                '    theme: {',
                "        baseTheme: 'ag-polychroma',",
                '        overrides: {',
                '            bar: { series: { label: { enabled: true } } },',
                '        },',
                '    },',
                '};',
                'AgCharts.create(options);'
            )
        );
    });

    it("replaces a theme object's base theme", () => {
        const source = lines(
            'const options = {',
            '    theme: {',
            '        overrides: {},',
            "        baseTheme: 'ag-default',",
            '    },',
            '};',
            'AgCharts.create(options);'
        );

        expect(setExampleTheme(source, 'ag-vivid-dark')).toBe(
            lines(
                'const options = {',
                '    theme: {',
                '        overrides: {},',
                "        baseTheme: 'ag-vivid-dark',",
                '    },',
                '};',
                'AgCharts.create(options);'
            )
        );
    });

    it('themes every options object passed to a create call, and nothing else', () => {
        const source = lines(
            'const shared = {',
            '    type: "radial-gauge",',
            '};',
            'const first: AgGaugeOptions = {',
            '    ...shared,',
            '};',
            'const second: AgGaugeOptions = {',
            '    ...shared,',
            '};',
            'AgCharts.createGauge(first);',
            'AgCharts.createGauge(second);'
        );

        expect(setExampleTheme(source, 'ag-vivid')).toBe(
            lines(
                'const shared = {',
                '    type: "radial-gauge",',
                '};',
                'const first: AgGaugeOptions = {',
                "    theme: 'ag-vivid',",
                '    ...shared,',
                '};',
                'const second: AgGaugeOptions = {',
                "    theme: 'ag-vivid',",
                '    ...shared,',
                '};',
                'AgCharts.createGauge(first);',
                'AgCharts.createGauge(second);'
            )
        );
    });

    it('leaves a theme it cannot rewrite untouched', () => {
        const source = lines('const options = {', '    theme: myTheme,', '};', 'AgCharts.create(options);');

        expect(setExampleTheme(source, 'ag-vivid')).toBe(source);
    });

    it('matches the indentation and quotes of the options', () => {
        const source = lines(
            'const options = {',
            '  container: document.getElementById("myChart"),',
            '  theme: {',
            '    baseTheme: "ag-default",',
            '  },',
            '};',
            'AgCharts.create(options);'
        );

        expect(setExampleTheme(source, 'ag-vivid')).toBe(
            lines(
                'const options = {',
                '  container: document.getElementById("myChart"),',
                '  theme: {',
                '    baseTheme: "ag-vivid",',
                '  },',
                '};',
                'AgCharts.create(options);'
            )
        );
    });

    // The examples are authored in the repo's Prettier style, while the vanilla files the Plunker and
    // CodeSandbox exports receive are reformatted with Prettier's defaults.
    describe.each([
        ['as authored', (source: string) => Promise.resolve(source)],
        ['as exported', (source: string) => format(source, { parser: 'typescript' })],
    ])('%s', (_, toFormat) => {
        it.each(fs.readdirSync(GALLERY_EXAMPLES_DIR))('themes every chart in the %s gallery example', async (name) => {
            const source = await toFormat(fs.readFileSync(path.join(GALLERY_EXAMPLES_DIR, name, 'main.ts'), 'utf-8'));

            const themes = getCreatedOptionsThemes(setExampleTheme(source, 'ag-vivid'));

            expect(themes.length).toBeGreaterThan(0);
            expect(themes).toEqual(Array(themes.length).fill(['ag-vivid']));
        });
    });
});
