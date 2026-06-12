import parser from './chart-vanilla-src-parser';
import { vanillaToAngular } from './chart-vanilla-to-angular';
import { vanillaToReactFunctionalTs } from './chart-vanilla-to-react-functional-ts';
import { vanillaToTypescript } from './chart-vanilla-to-typescript';

const HTML = `<div id="myChart"></div>`;

const parse = (srcFile: string) =>
    parser({
        srcFile,
        html: HTML,
        dirPath: '/example',
        exampleSettings: { enterprise: false },
    });

describe('top-level type/interface declaration preservation', () => {
    const TYPE_ALIAS_SRC = `
import { AgChartOptions, AgCharts } from 'ag-charts-community';

type MyDatumType = { quarter: string; value: number };

const options: AgChartOptions<MyDatumType> = {
    container: document.getElementById('myChart'),
    data: [{ quarter: 'Q1', value: 1 }],
    series: [{ type: 'bar', xKey: 'quarter', yKey: 'value' }],
};

const chart = AgCharts.create(options);
`;

    test('parser collects the type alias into declarations and declaredTypeNames', () => {
        const { typedBindings } = parse(TYPE_ALIAS_SRC);
        expect(typedBindings.declarations.join('\n')).toContain('type MyDatumType');
        expect(typedBindings.declaredTypeNames).toContain('MyDatumType');
    });

    test('typescript output preserves the type declaration', () => {
        const { typedBindings } = parse(TYPE_ALIAS_SRC);
        const output = vanillaToTypescript(typedBindings);
        expect(output).toContain('type MyDatumType');
        expect(output).toContain('AgChartOptions<MyDatumType>');
    });

    test('reactFunctionalTs output preserves the type declaration', async () => {
        const { typedBindings } = parse(TYPE_ALIAS_SRC);
        const output = await vanillaToReactFunctionalTs(typedBindings, [], [], false);
        expect(output).toContain('type MyDatumType');
        expect(output).toContain('AgChartOptions<MyDatumType>');
    });

    test('angular output preserves the type and does not import the locally-declared type', async () => {
        const { typedBindings } = parse(TYPE_ALIAS_SRC);
        const output = await vanillaToAngular(typedBindings, [], false);
        expect(output).toContain('type MyDatumType');
        // AgChartOptions is a real export and must stay imported...
        expect(output).toContain('AgChartOptions');
        // ...but the locally-declared MyDatumType must not be synthesised into the import.
        expect(output).not.toMatch(/import\s*{[^}]*\bMyDatumType\b[^}]*}\s*from\s*'ag-charts-community'/);
        // The type declaration is separated from the imports by a blank line.
        expect(output).toMatch(/from 'ag-charts-community';\n\ntype MyDatumType/);
    });

    test('interface declarations are preserved the same way', () => {
        const interfaceSrc = TYPE_ALIAS_SRC.replace(
            'type MyDatumType = { quarter: string; value: number };',
            'interface MyDatumType { quarter: string; value: number }'
        );
        const { typedBindings } = parse(interfaceSrc);
        expect(typedBindings.declarations.join('\n')).toContain('interface MyDatumType');
        expect(typedBindings.declaredTypeNames).toContain('MyDatumType');
        expect(vanillaToTypescript(typedBindings)).toContain('interface MyDatumType');
    });
});
