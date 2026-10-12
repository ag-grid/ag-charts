import parser from '../transformation-scripts/chart-vanilla-src-parser';
import { frameworkFilesGenerator } from './frameworkFilesGenerator';

const HTML = `<div id="myChart"></div><div id="lineChart"></div><div id="barChart"></div>`;

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
    return files['main.js'] as string;
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
