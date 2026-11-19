// The smallest input that once produced a variant that fails `strict`, and what the variant must contain to compile.
import parser from './chart-vanilla-src-parser';
import { vanillaToAngular } from './chart-vanilla-to-angular';
import { vanillaToReactFunctionalTs } from './chart-vanilla-to-react-functional-ts';
import { vanillaToTypescript } from './chart-vanilla-to-typescript';
import { vanillaToVue3 } from './chart-vanilla-to-vue3';
import { standardiseWhitespace } from './test-utils';

const HTML = `<div id="myChart"></div>`;
const TWO_CHARTS_HTML = `<div id="myChart"></div><div id="otherChart"></div>`;

const parse = (srcFile: string, html = HTML) =>
    parser({ srcFile, html, dirPath: '/example', exampleSettings: { enterprise: false } }).typedBindings;

const generate = async (srcFile: string, html = HTML) => {
    const bindings = parse(srcFile, html);
    return {
        typescript: standardiseWhitespace(vanillaToTypescript(bindings)),
        react: standardiseWhitespace(await vanillaToReactFunctionalTs(bindings, [], [], false)),
        angular: standardiseWhitespace(await vanillaToAngular(bindings, [], false)),
        vue: standardiseWhitespace(await vanillaToVue3(bindings, [], false)),
    };
};

/** The names a module's import statements bring in, across all import statements from that module. */
const importedFrom = (output: string, module: string) =>
    [...output.matchAll(new RegExp(`import (?:type )?{([^}]*)} from '${module}'`, 'g'))].flatMap((m) =>
        m[1].split(',').map((name) => name.trim().replace(/^type /, ''))
    );

const expectAgChartOptionsImportedOnce = (output: Record<string, string>) => {
    for (const [name, source] of Object.entries(output)) {
        const imported = [...importedFrom(source, 'ag-charts-community'), ...importedFrom(source, 'ag-charts-types')];
        expect(
            imported.filter((n) => n === 'AgChartOptions'),
            `${name} imports AgChartOptions once`
        ).toHaveLength(1);
    }
};

const UNTYPED = `
import { AgCharts } from 'ag-charts-community';

const options = {
    container: document.getElementById('myChart'),
    data: [{ x: 'a', y: 1 }],
    series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
};

AgCharts.create(options);
`;

const TYPED = `
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: [{ x: 'a', y: 1 }],
    series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
};

AgCharts.create(options);
`;

describe('options the example leaves untyped', () => {
    // `container` is not a property of the inferred literal type of the options, so assigning it needs a type.
    test('every framework annotates them as AgChartOptions and imports that type', async () => {
        const output = await generate(UNTYPED);

        expect(output.typescript).toContain('const options: AgChartOptions = {');
        expect(output.react).toContain('useState<AgChartOptions>(');
        expect(output.angular).toContain('public options: AgChartOptions;');
        expect(output.vue).toContain('ref<AgChartOptions>(');

        expectAgChartOptionsImportedOnce(output);
    });

    test('options the example types are annotated with that type, and AgChartOptions is not imported for them', async () => {
        const output = await generate(TYPED);

        expect(output.typescript).toContain('const options: AgCartesianChartOptions = {');
        expect(output.react).toContain('useState<AgCartesianChartOptions>(');
        expect(output.angular).toContain('public options: AgCartesianChartOptions;');
        expect(output.vue).toContain('ref<AgCartesianChartOptions>(');

        expect(importedFrom(output.typescript, 'ag-charts-community')).not.toContain('AgChartOptions');
        expect(importedFrom(output.react, 'ag-charts-community')).not.toContain('AgChartOptions');
        expect(importedFrom(output.angular, 'ag-charts-community')).not.toContain('AgChartOptions');
    });
});

describe('an example that imports AgChartOptions itself', () => {
    const SRC = `
import { AgChartOptions, AgCharts } from 'ag-charts-community';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
};

AgCharts.create(options);
`;

    test('no variant imports it twice', async () => {
        const output = await generate(SRC);
        expectAgChartOptionsImportedOnce(output);
    });

    test('nor does Vue where the example takes it from ag-charts-types as a type import', async () => {
        const output = await vanillaToVue3(
            parse(`
import { AgCharts } from 'ag-charts-community';
import type { AgChartOptions } from 'ag-charts-types';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
};

AgCharts.create(options);
`),
            [],
            false
        );
        expect(output.match(/\bAgChartOptions\b[^;]*from/g)).toHaveLength(1);
    });
});

describe('the example casts the options it creates the chart from', () => {
    test('the cast is kept, as it types the chart instance the example then updates', () => {
        const output = vanillaToTypescript(
            parse(`
import { AgCharts, AgChartOptions } from 'ag-charts-community';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: [],
};

const chart = AgCharts.create(options as AgChartOptions);
`)
        );
        expect(output).toContain('const chart = AgCharts.create(options as AgChartOptions);');
    });

    test('a cast to a type with arguments is kept whole', () => {
        const output = standardiseWhitespace(
            vanillaToTypescript(
                parse(`
import { AgCharts, AgChartOptions } from 'ag-charts-community';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: [],
};

AgCharts.create(options as AgChartOptions<{ a: number }>);
`)
            )
        );
        expect(output).toContain('AgCharts.create(options as AgChartOptions<{ a: number; }>);');
    });

    test('options that are not cast are passed as they are', () => {
        expect(vanillaToTypescript(parse(UNTYPED))).toContain('AgCharts.create(options);');
    });
});

describe('React TS options with generic arguments', () => {
    // `AgChartOptions<TDatum>` is not assignable to the component's `options` prop, which is a plain `AgChartOptions`.
    const GENERIC = `
import { AgChartOptions, AgCharts } from 'ag-charts-community';

type Datum = { x: string; y: number };

const options: AgChartOptions<Datum> = {
    container: document.getElementById('myChart'),
    data: [],
    series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
};

AgCharts.create(options);
`;

    test('are cast to AgChartOptions when passed to the component', async () => {
        const output = standardiseWhitespace(await vanillaToReactFunctionalTs(parse(GENERIC), [], [], false));
        expect(output).toContain('useState<AgChartOptions<Datum>>(');
        expect(output).toContain('options={options as AgChartOptions}');
    });

    test('are not cast when the type has no arguments', async () => {
        const output = standardiseWhitespace(await vanillaToReactFunctionalTs(parse(UNTYPED), [], [], false));
        expect(output).toContain('options={options}');
        expect(output).not.toContain(' as AgChartOptions');
    });

    test('are cast, and the type imported, where the example types them with another name', async () => {
        const output = standardiseWhitespace(
            await vanillaToReactFunctionalTs(
                parse(`
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

type Datum = { x: string };

const options: AgCartesianChartOptions<Datum> = {
    container: document.getElementById('myChart'),
};

AgCharts.create(options);
`),
                [],
                [],
                false
            )
        );
        expect(output).toContain('options={options as AgChartOptions}');
        expect(importedFrom(output, 'ag-charts-community')).toContain('AgChartOptions');
    });
});

describe('chart instance API', () => {
    const SRC = `
import { AgCharts, AgChartOptions } from 'ag-charts-community';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: [],
};

const chart = AgCharts.create(options);

function download() {
    chart.download();
}
`;

    test('React TS types the ref with AgChartInstance, the name the library exports, and imports it', async () => {
        const output = standardiseWhitespace(await vanillaToReactFunctionalTs(parse(SRC), [], [], false));
        expect(output).toContain('useRef<AgChartInstance>(null)');
        expect(output).not.toContain('AgChartsInstance');
        expect(importedFrom(output, 'ag-charts-community')).toContain('AgChartInstance');
    });

    test('Vue calls the chart through a non-null assertion on the component ref', async () => {
        const output = standardiseWhitespace(await vanillaToVue3(parse(SRC), [], false));
        expect(output).toContain('agCharts.value!.chart!.download()');
        expect(output).not.toMatch(/agCharts\.value\.chart/);
        expect(output).toMatch(/const agCharts = ref<InstanceType<typeof AgCharts>>\(\);/);
    });
});

describe('Vue 3 refs', () => {
    test('are declared as Ref<T> so that the deep unwrapping of ref<T> does not change the chart options type', async () => {
        const output = (await generate(UNTYPED)).vue;
        expect(output).toContain('const options = ref<AgChartOptions>(');
        expect(output).toContain(') as Ref<AgChartOptions>;');
        expect(importedFrom(output, 'vue')).toEqual(
            expect.arrayContaining(['createApp', 'defineComponent', 'ref', 'Ref'])
        );
    });

    test('setup takes no props parameter, which noUnusedParameters would reject', async () => {
        const output = (await generate(UNTYPED)).vue;
        expect(output).toContain('setup() {');
        expect(output).not.toContain('setup(props)');
    });
});

describe('a chart whose options read another chart', () => {
    const TWO_CHARTS = `
import { AgCharts, AgChartOptions } from 'ag-charts-community';

const first: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'First' },
};

const second: AgChartOptions = {
    ...first,
    container: document.getElementById('otherChart'),
    subtitle: { text: 'Second' },
};

AgCharts.create(first);
AgCharts.create(second);
`;

    test('React declares the first as a local in the second chart component', async () => {
        const output = (await generate(TWO_CHARTS, TWO_CHARTS_HTML)).react;
        expect(output).toMatch(/const first: AgChartOptions = \{[^}]*title: \{ text: 'First' \}[^}]*\};/);
        expect(output).toMatch(/const \[second, setSecond\] = useState<AgChartOptions>\(\{ \.\.\.first,/);
    });

    test('Angular declares the first as a local of the second component, which the second then spreads', async () => {
        const output = (await generate(TWO_CHARTS, TWO_CHARTS_HTML)).angular;
        expect(output).toMatch(/const first: AgChartOptions = \{[^}]*title: \{ text: 'First' \}[^}]*\};/);
        expect(output).toMatch(/this\.second = \{ \.\.\.first,/);
        expect(output).not.toContain('...this.first');
    });

    test('Vue declares the first as a ref in the second chart component and spreads its value', async () => {
        const output = (await generate(TWO_CHARTS, TWO_CHARTS_HTML)).vue;
        expect(output).toMatch(/const first = ref<AgChartOptions>\(/);
        expect(output).toMatch(/const second = ref<AgChartOptions>\(\{ \.\.\.first\.value,/);
    });

    test('the first chart component declares nothing it does not use', async () => {
        const output = (await generate(TWO_CHARTS, TWO_CHARTS_HTML)).angular;
        const firstComponent = output.slice(
            output.indexOf('class MyChart'),
            output.indexOf('@Component', output.indexOf('class MyChart'))
        );
        expect(firstComponent).toContain('public first: AgChartOptions;');
        expect(firstComponent).not.toContain('second');
    });
});

describe('charts whose options read each other', () => {
    // options1's callback reads options2, which spreads options1. Both reads must be declared in the right order
    // and the generator must terminate.
    const MUTUAL = `
import { AgCharts, AgChartOptions } from 'ag-charts-community';

const options1: AgChartOptions = {
    container: document.getElementById('myChart'),
    listeners: {
        nodeClick: () => console.log(options2.series),
    },
    series: [],
};

const options2: AgChartOptions = {
    ...options1,
    container: document.getElementById('otherChart'),
    subtitle: { text: 'x' },
};

AgCharts.create(options1);
AgCharts.create(options2);
`;
    const component = (output: string, name: string) => {
        const start = output.indexOf(`class ${name}`);
        const next = output.indexOf('@Component', start);
        return output.slice(start, next === -1 ? undefined : next);
    };

    test('every variant is generated', async () => {
        const output = await generate(MUTUAL, TWO_CHARTS_HTML);
        for (const variant of Object.values(output)) {
            expect(variant).toContain('options1');
            expect(variant).toContain('options2');
        }
    });

    test('Angular reads the component own chart as a member and the other chart as a local', async () => {
        const output = (await generate(MUTUAL, TWO_CHARTS_HTML)).angular;
        const myChart = component(output, 'MyChart');
        expect(myChart).toContain('console.log(options2.series)');
        expect(myChart).toMatch(/const options2: AgChartOptions = \{ \.\.\.this\.options1,/);

        const otherChart = component(output, 'OtherChart');
        expect(otherChart).toMatch(/const options1: AgChartOptions = \{[^]*console\.log\(this\.options2\.series\)/);
        expect(otherChart).toMatch(/this\.options2 = \{ \.\.\.options1,/);
        expect(otherChart).not.toContain('this.options1');
    });

    test('React and Vue declare the spread chart before the chart that spreads it', async () => {
        const { react, vue } = await generate(MUTUAL, TWO_CHARTS_HTML);
        for (const output of [react, vue]) {
            for (const name of ['MyChart', 'OtherChart']) {
                const body = output.slice(output.indexOf(`const ${name} =`));
                const declaredAt = (chart: string) => body.search(new RegExp(`const \\[?${chart}\\b`));
                expect(declaredAt('options1')).toBeGreaterThan(-1);
                expect(declaredAt('options1')).toBeLessThan(declaredAt('options2'));
            }
        }
    });

    test('Angular does not read a dependency chart as a member of the component', async () => {
        const output = (await generate(MUTUAL, TWO_CHARTS_HTML)).angular;
        // OtherChart has no options1 member, so reading this.options1 there would not type-check.
        expect(component(output, 'OtherChart')).not.toContain('public options1');
    });
});

describe('callbacks that read the options variable', () => {
    const SRC = `
import { AgCharts, AgChartOptions } from 'ag-charts-community';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    series: [{ type: 'bar', xKey: 'x', yKey: 'y', listeners: { nodeClick: () => console.log(options.series) } }],
};

AgCharts.create(options);
`;

    test.each([
        ['angular', 'console.log(this.options.series)'],
        ['vue', 'console.log(options.value.series)'],
        ['react', 'console.log(options.series)'],
    ] as const)('%s reads the options through its own state', async (framework, expected) => {
        expect((await generate(SRC))[framework]).toContain(expected);
    });
});

describe('callbacks that read the options variable in a template or as a shorthand property', () => {
    const SRC = `
import { AgCharts, AgChartOptions } from 'ag-charts-community';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    series: [
        {
            type: 'bar',
            xKey: 'x',
            yKey: 'y',
            tooltip: { renderer: () => ({ title: \`\${options.title}\`, data: { options } }) },
        },
    ],
};

AgCharts.create(options);
`;

    test.each([
        ['angular', 'title: `${this.options.title}`', 'data: { options: this.options }'],
        ['vue', 'title: `${options.value.title}`', 'data: { options: options.value }'],
    ] as const)('%s reads the options in the template and in the shorthand', async (framework, template, shorthand) => {
        const output = (await generate(SRC))[framework];
        expect(output).toContain(template);
        expect(output).toContain(shorthand);
    });
});

describe('type-only imports of the example', () => {
    const SRC = `
import { AgCharts } from 'ag-charts-community';
import type { Datum } from './data';
import { getData } from './data';

const options = {
    container: document.getElementById('myChart'),
    data: getData() as Datum[],
    series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
};

AgCharts.create(options);
`;
    const TYPE_ONLY = `
import { AgCharts } from 'ag-charts-community';
import type { Datum } from './data';

const options = {
    container: document.getElementById('myChart'),
    data: [] as Datum[],
    series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
};

AgCharts.create(options);
`;

    test.each(['typescript', 'react', 'angular', 'vue'] as const)(
        '%s keeps an import that is only types as `import type`',
        async (framework) => {
            expect((await generate(TYPE_ONLY))[framework]).toContain("import type { Datum } from './data';");
        }
    );

    test.each(['typescript', 'react', 'angular', 'vue'] as const)(
        '%s imports a module as values when it is also used for values',
        async (framework) => {
            const output = (await generate(SRC))[framework];
            expect(output).toContain("import { Datum, getData } from './data';");
            expect(output).not.toContain("import type { Datum } from './data'");
        }
    );
});
