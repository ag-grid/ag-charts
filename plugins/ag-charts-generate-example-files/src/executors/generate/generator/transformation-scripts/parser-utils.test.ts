import {
    type BindingImport,
    DEFAULT_OPTIONS_TYPE,
    chartApi,
    ensureNamedImport,
    getImportedName,
    getPropertyOptionsType,
    getReferencedOptions,
    getTypes,
    replaceOptionsReferences,
    usesDefaultOptionsType,
} from './parser-utils';

const toThis = (name: string) => `this.${name}`;

describe('replaceOptionsReferences', () => {
    it('rewrites a read of the options variable', () => {
        expect(replaceOptionsReferences('const { series } = options;', ['options'], toThis)).toBe(
            'const { series } = this.options;'
        );
    });

    it('rewrites a spread and an argument', () => {
        expect(replaceOptionsReferences('{ ...options, a: f(options) }', ['options'], toThis)).toBe(
            '{ ...this.options, a: f(this.options) }'
        );
    });

    it('rewrites member access on the variable', () => {
        expect(replaceOptionsReferences('() => options.series.length', ['options'], toThis)).toBe(
            '() => this.options.series.length'
        );
    });

    it('leaves a member of another object that is called the same', () => {
        expect(replaceOptionsReferences('props.options + chart.options.axes', ['options'], toThis)).toBe(
            'props.options + chart.options.axes'
        );
    });

    it('leaves identifiers that merely contain the name', () => {
        expect(replaceOptionsReferences('myoptions + options2 + $options', ['options'], toThis)).toBe(
            'myoptions + options2 + $options'
        );
    });

    it('leaves a property key and a shorthand declaration', () => {
        expect(replaceOptionsReferences('{ options: 1 }', ['options'], toThis)).toBe('{ options: 1 }');
        expect(replaceOptionsReferences('{ a: 1, options }', ['options'], toThis)).toBe('{ a: 1, options }');
        expect(replaceOptionsReferences('{ a: 1, options, b: 2 }', ['options'], toThis)).toBe(
            '{ a: 1, options, b: 2 }'
        );
    });

    it('rewrites a value that follows a property key', () => {
        expect(replaceOptionsReferences('{ options: options }', ['options'], toThis)).toBe('{ options: this.options }');
    });

    it('leaves string, template and comment contents', () => {
        const code = `'options' + "options" + \`options\` // options
/* options */ + options`;
        expect(replaceOptionsReferences(code, ['options'], toThis)).toBe(`'options' + "options" + \`options\` // options
/* options */ + this.options`);
    });

    it('rewrites several names, naming each to the callback', () => {
        const seen: string[] = [];
        const result = replaceOptionsReferences('{ ...options1, ...options2 }', ['options1', 'options2'], (name) => {
            seen.push(name);
            return `${name}.value`;
        });
        expect(result).toBe('{ ...options1.value, ...options2.value }');
        expect(seen).toEqual(['options1', 'options2']);
    });

    it('returns the code untouched for no names', () => {
        expect(replaceOptionsReferences('options', [], toThis)).toBe('options');
    });
});

describe('getPropertyOptionsType and usesDefaultOptionsType', () => {
    it('returns the declared type, or AgChartOptions where there is none', () => {
        expect(getPropertyOptionsType({ typeInfo: { typeStr: 'AgCartesianChartOptions' } })).toBe(
            'AgCartesianChartOptions'
        );
        expect(getPropertyOptionsType({})).toBe('AgChartOptions');
        expect(getPropertyOptionsType({ typeInfo: {} })).toBe(DEFAULT_OPTIONS_TYPE);
    });

    it('is true when a chart options variable is untyped', () => {
        expect(
            usesDefaultOptionsType({
                chartProperties: { myChart: 'options' },
                properties: [{ name: 'options' }],
            })
        ).toBe(true);
    });

    it('is false when every chart options variable is typed', () => {
        expect(
            usesDefaultOptionsType({
                chartProperties: { a: 'first', b: 'second' },
                properties: [
                    { name: 'first', typeInfo: { typeStr: 'AgChartOptions' } },
                    { name: 'second', typeInfo: { typeStr: 'AgPolarChartOptions' } },
                ],
            })
        ).toBe(false);
    });

    it('ignores properties that are not chart options', () => {
        expect(
            usesDefaultOptionsType({
                chartProperties: { a: 'first' },
                properties: [{ name: 'first', typeInfo: { typeStr: 'AgChartOptions' } }, { name: 'other' }],
            })
        ).toBe(false);
    });

    it('is false with no charts', () => {
        expect(usesDefaultOptionsType({ properties: [{ name: 'options' }] })).toBe(false);
    });

    it('is true when only one of several charts is untyped', () => {
        expect(
            usesDefaultOptionsType({
                chartProperties: { a: 'first', b: 'second' },
                properties: [{ name: 'first', typeInfo: { typeStr: 'AgChartOptions' } }, { name: 'second' }],
            })
        ).toBe(true);
    });
});

describe('getReferencedOptions', () => {
    const chart = (name: string, value: string) => ({ name, value });

    it('is empty when a chart reads no other chart', () => {
        const bindings = {
            chartProperties: { a: 'options1', b: 'options2' },
            properties: [chart('options1', '{ series: [] }'), chart('options2', '{ series: [] }')],
        };
        expect(getReferencedOptions(bindings, bindings.properties[1])).toEqual([]);
    });

    it('returns the other charts that a chart reads', () => {
        const bindings = {
            chartProperties: { a: 'options1', b: 'options2' },
            properties: [chart('options1', '{ title: 1 }'), chart('options2', '{ ...options1, series: [] }')],
        };
        expect(getReferencedOptions(bindings, bindings.properties[1])).toEqual([bindings.properties[0]]);
    });

    it('lists dependencies before their dependants, transitively', () => {
        const bindings = {
            chartProperties: { a: 'first', b: 'second', c: 'third' },
            properties: [
                chart('first', '{ title: 1 }'),
                chart('second', '{ ...first }'),
                chart('third', '{ ...second }'),
            ],
        };
        expect(getReferencedOptions(bindings, bindings.properties[2]).map((p) => p.name)).toEqual(['first', 'second']);
    });

    it('lists a dependency once however often it is read', () => {
        const bindings = {
            chartProperties: { a: 'first', b: 'second', c: 'third' },
            properties: [
                chart('first', '{}'),
                chart('second', '{ ...first }'),
                chart('third', '{ ...first, ...second }'),
            ],
        };
        expect(getReferencedOptions(bindings, bindings.properties[2]).map((p) => p.name)).toEqual(['first', 'second']);
    });

    it('ignores variables that are not chart options and names inside strings', () => {
        const bindings = {
            chartProperties: { a: 'first', b: 'second' },
            properties: [
                chart('first', '{}'),
                chart('second', `{ title: 'first', other: first_ }`),
                chart('data', '[]'),
            ],
        };
        expect(getReferencedOptions(bindings, bindings.properties[1])).toEqual([]);
    });
});

describe('getImportedName', () => {
    it('is the bound name of a plain or a type specifier', () => {
        expect(getImportedName('AgChartOptions')).toBe('AgChartOptions');
        expect(getImportedName('type AgChartOptions')).toBe('AgChartOptions');
    });
});

describe('ensureNamedImport', () => {
    const community = `'ag-charts-community'`;
    const make = (module: string, imports: string[], isNamespaced = false): BindingImport => ({
        module,
        isNamespaced,
        namedImport: undefined,
        imports,
    });

    it('adds the name to the import from the module', () => {
        const imports = [make(community, ['AgCharts'])];
        ensureNamedImport(imports, community, 'AgChartOptions');
        expect(imports).toHaveLength(1);
        expect(imports[0].imports).toEqual(['AgCharts', 'AgChartOptions']);
    });

    it('adds an import where the module has none', () => {
        const imports = [make(`'./data'`, ['getData'])];
        ensureNamedImport(imports, community, 'AgChartOptions');
        expect(imports).toHaveLength(2);
        expect(imports[1]).toMatchObject({ module: community, isNamespaced: false, imports: ['AgChartOptions'] });
    });

    it('does not import a name that any import already brings into scope', () => {
        const imports = [make(`'ag-charts-types'`, ['type AgChartOptions']), make(community, ['AgCharts'])];
        ensureNamedImport(imports, community, 'AgChartOptions');
        expect(imports[1].imports).toEqual(['AgCharts']);
        expect(imports).toHaveLength(2);
    });

    it('does not add to a namespaced import of the module', () => {
        const imports = [make(community, ['agCharts'], true)];
        ensureNamedImport(imports, community, 'AgChartOptions');
        expect(imports).toHaveLength(2);
        expect(imports[0].imports).toEqual(['agCharts']);
    });

    it('does not add the name twice when called twice', () => {
        const imports = [make(community, ['AgCharts'])];
        ensureNamedImport(imports, community, 'AgChartOptions');
        ensureNamedImport(imports, community, 'AgChartOptions');
        expect(imports[0].imports).toEqual(['AgCharts', 'AgChartOptions']);
    });
});

describe('getTypes', () => {
    const typesOf = (typeText: string) => {
        const ts = require('typescript') as typeof import('typescript');
        const file = ts.createSourceFile('t.ts', `let x: ${typeText};`, ts.ScriptTarget.Latest, true);
        const declaration = (file.statements[0] as import('typescript').VariableStatement).declarationList
            .declarations[0];
        return getTypes(declaration.type!);
    };

    it('lists the types that need importing', () => {
        expect(typesOf('AgChartOptions')).toEqual(['AgChartOptions']);
    });

    it.each(['Promise', 'Map', 'Set', 'Record', 'ReturnType', 'InstanceType', 'HTMLElement', 'TData'])(
        'does not list %s, which needs no import',
        (name) => {
            expect(typesOf(name)).not.toContain(name);
        }
    );
});

describe('chartApi', () => {
    it('is read from the first chart where the example has no options named `options`', () => {
        expect(
            chartApi({
                chartProperties: { myChart: 'financialOptions' },
                properties: [{ name: 'financialOptions', typeInfo: { typeStr: 'AgFinancialChartOptions' } }],
            })
        ).toBe('financial');
    });

    it('is vanilla for a chart with no more specific type', () => {
        expect(
            chartApi({
                chartProperties: { myChart: 'first' },
                properties: [{ name: 'first', typeInfo: { typeStr: 'AgChartOptions' } }],
            })
        ).toBe('vanilla');
        expect(chartApi({ properties: [] })).toBe('vanilla');
    });
});
