import parser from './chart-vanilla-src-parser';
import { vanillaToAngular } from './chart-vanilla-to-angular';
import { vanillaToReactFunctionalTs } from './chart-vanilla-to-react-functional-ts';
import { vanillaToTypescript } from './chart-vanilla-to-typescript';
import { vanillaToVue3 } from './chart-vanilla-to-vue3';

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

    test('vue3 output preserves the type declaration and the generic options type', async () => {
        // Vue 3 is generated from the typed bindings, as the output is TypeScript.
        const { typedBindings } = parse(TYPE_ALIAS_SRC);
        const output = await vanillaToVue3(typedBindings, [], false);
        expect(output).toContain('type MyDatumType');
        expect(output).toContain('ref<AgChartOptions<MyDatumType>>');
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

    test('angular output prefixes inScope function calls inside the options literal with this.', async () => {
        const src = `
import { AgChartOptions, AgCharts } from 'ag-charts-community';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: [{ quarter: 'Q1', value: 1 }],
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'value',
            listeners: { nodeClick: () => refresh() },
        },
    ],
};

const chart = AgCharts.create(options);

/** inScope */
function refresh(): boolean | undefined {
    options.data = [{ quarter: 'Q1', value: 2 }];
    chart.update(options);
    return true;
}
`;
        const { typedBindings } = parse(src);
        const output = await vanillaToAngular(typedBindings, [], false);

        // The call inside the options literal is rewritten to target the instance method...
        expect(output).toContain('nodeClick: () => this.refresh()');
        // ...which the component still defines, with its declaration left unprefixed and the
        // return type annotation placed before the arrow.
        expect(output).toMatch(/^\s*refresh = \(\): boolean \| undefined => \{/m);

        // The react conversion places the return type annotation the same way.
        const reactOutput = await vanillaToReactFunctionalTs(typedBindings, [], [], false);
        expect(reactOutput).toMatch(/const refresh = \(\): boolean \| undefined => \{/);
    });

    test('angular output prefixes inScope function calls in top-level init code with this.', async () => {
        const src = `
import { AgChartOptions, AgCharts } from 'ag-charts-community';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: [{ quarter: 'Q1', value: 1 }],
    series: [{ type: 'bar', xKey: 'quarter', yKey: 'value' }],
};

const chart = AgCharts.create(options);

refresh();

/** inScope */
function refresh() {
    options.data = [{ quarter: 'Q1', value: 2 }];
    chart.update(options);
}
`;
        const { typedBindings } = parse(src);
        const output = await vanillaToAngular(typedBindings, [], false);

        // Top-level statements land in ngOnInit, where the function is a component member.
        expect(output).toContain('this.refresh()');
        expect(output).not.toMatch(/(?<!\.)\brefresh\(\)/);
    });

    test('angular output expands object shorthand references to inScope functions', async () => {
        const src = `
import { AgChartOptions, AgCharts } from 'ag-charts-community';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: [{ quarter: 'Q1', value: 1 }],
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'value',
            listeners: { nodeClick },
        },
    ],
};

const chart = AgCharts.create(options);

/** inScope */
function nodeClick() {
    options.data = [{ quarter: 'Q1', value: 2 }];
    chart.update(options);
}
`;
        const { typedBindings } = parse(src);
        const output = await vanillaToAngular(typedBindings, [], false);

        // Shorthand cannot take a bare this. prefix; it expands to a full property instead.
        expect(output).toContain('listeners: { nodeClick: this.nodeClick }');
    });

    test('angular output does not prefix instance-method names inside string literals', async () => {
        // A string value in the options literal that happens to contain a method name as a substring
        // (here `repeat` inside `'no-repeat'`) must be left untouched — only real calls are prefixed.
        const src = `
import { AgChartOptions, AgCharts } from 'ag-charts-community';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: [{ quarter: 'Q1', value: 1 }],
    series: [{ type: 'bar', xKey: 'quarter', yKey: 'value', repeat: 'no-repeat' }],
};

const chart = AgCharts.create(options);

function repeat() {
    options.data = [{ quarter: 'Q1', value: 2 }];
    chart.update(options);
}
`;
        const { typedBindings } = parse(src);
        const output = await vanillaToAngular(typedBindings, [], false);

        // The string literal is preserved verbatim...
        expect(output).toContain("repeat: 'no-repeat'");
        // ...and is never corrupted into the prefixed form.
        expect(output).not.toContain('no-this.repeat');
    });

    test('angular output does not duplicate option types already imported from ag-charts-types', async () => {
        const src = `
import { AgCharts } from 'ag-charts-community';
import type { AgChartOptions } from 'ag-charts-types';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: [{ quarter: 'Q1', value: 1 }],
    series: [{ type: 'bar', xKey: 'quarter', yKey: 'value' }],
};

const chart = AgCharts.create(options);
`;
        const { typedBindings } = parse(src);
        const output = await vanillaToAngular(typedBindings, [], false);

        expect(output.match(/^import .*\bAgChartOptions\b.* from/gm)).toHaveLength(1);
    });
});
