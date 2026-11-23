import parser from '../transformation-scripts/chart-vanilla-src-parser';
import { frameworkFilesGenerator } from './frameworkFilesGenerator';

const HTML = `<div id="myChart"></div><div id="lineChart"></div><div id="barChart"></div>`;

const SINGLE_CHART_HTML = `<div id="myChart"></div>`;

const generateVanillaMainJs = async (srcFile: string) => {
    const { bindings, typedBindings } = parser({
        srcFile,
        html: HTML,
        dirPath: '/example',
        exampleSettings: { enterprise: false },
    });
    const { files } = await frameworkFilesGenerator.vanilla({
        entryFile: srcFile,
        indexHtml: HTML,
        isEnterprise: false,
        bindings,
        typedBindings,
        otherScriptFiles: {},
        styleFileNames: [],
        isDev: false,
    });
    return files['main.js'];
};

const generateVue3MainTs = async (srcFile: string) => {
    const { bindings, typedBindings } = parser({
        srcFile,
        html: SINGLE_CHART_HTML,
        dirPath: '/example',
        exampleSettings: { enterprise: false },
    });
    const { files, entryFileName } = await frameworkFilesGenerator.vue3({
        entryFile: srcFile,
        indexHtml: SINGLE_CHART_HTML,
        isEnterprise: false,
        bindings,
        typedBindings,
        otherScriptFiles: {},
        styleFileNames: [],
        isDev: true,
    });
    return files[entryFileName];
};

describe('frameworkFilesGenerator.vanilla', () => {
    test('does not destructure modules only referenced by the stripped registration', async () => {
        const mainJs = await generateVanillaMainJs(`
import { AgCharts, CategoryAxisModule, LegendModule, ModuleRegistry, NumberAxisModule, RangeBarSeriesModule } from 'ag-charts-community';

ModuleRegistry.registerModules([CategoryAxisModule, LegendModule, NumberAxisModule, RangeBarSeriesModule]);

const options = { container: document.getElementById('myChart'), series: [{ type: 'range-bar' }] };

AgCharts.create(options);
`);

        expect(mainJs).toContain('const { AgCharts } = agCharts;');
        expect(mainJs).not.toContain('Module');
    });

    test('does not destructure AllCommunityModule', async () => {
        const mainJs = await generateVanillaMainJs(`
import { AgCharts, AllCommunityModule, ModuleRegistry } from 'ag-charts-community';

ModuleRegistry.registerModules([AllCommunityModule]);

const options = { container: document.getElementById('myChart') };

AgCharts.create(options);
`);

        expect(mainJs).toContain('const { AgCharts } = agCharts;');
        expect(mainJs).not.toContain('AllCommunityModule');
    });

    test('keeps modules that are passed per chart', async () => {
        const mainJs = await generateVanillaMainJs(`
import { AgCharts, BarSeriesModule, CategoryAxisModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

ModuleRegistry.registerModules([CategoryAxisModule, NumberAxisModule]);

const lineOptions = { container: document.getElementById('lineChart') };
const barOptions = { container: document.getElementById('barChart') };

AgCharts.create(lineOptions, { modules: [LineSeriesModule] });
AgCharts.create(barOptions, { modules: [BarSeriesModule] });
`);

        expect(mainJs).toContain('const { AgCharts, BarSeriesModule, LineSeriesModule } = agCharts;');
        expect(mainJs).not.toContain('CategoryAxisModule');
        expect(mainJs).not.toContain('NumberAxisModule');
    });
});

describe('frameworkFilesGenerator.vue3', () => {
    const SRC = `
import { AgCharts, AgTooltipRendererParams } from 'ag-charts-community';
import type { Datum } from './data';

const options = {
    container: document.getElementById('myChart'),
    data: [] as Datum[],
    series: [
        {
            type: 'bar',
            xKey: 'x',
            yKey: 'y',
            tooltip: { renderer: (params: AgTooltipRendererParams<Datum>) => ({ title: params.datum.x }) },
        },
    ],
};

AgCharts.create(options);
`;

    test('keeps a type-only import and the parameter types of a callback, which the JS bindings drop', async () => {
        const mainTs = await generateVue3MainTs(SRC);

        expect(mainTs).toContain("import type { Datum } from './data';");
        expect(mainTs).toContain('(params: AgTooltipRendererParams<Datum>)');
        expect(mainTs).toContain('data: [] as Datum[]');
    });
});
