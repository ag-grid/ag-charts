import parser from './chart-vanilla-src-parser';
import { vanillaToAngular } from './chart-vanilla-to-angular';
import { vanillaToReactFunctional } from './chart-vanilla-to-react-functional';
import { vanillaToReactFunctionalTs } from './chart-vanilla-to-react-functional-ts';
import { vanillaToTypescript } from './chart-vanilla-to-typescript';
import { vanillaToVue3 } from './chart-vanilla-to-vue3';
import { standardiseWhitespace } from './test-utils';

const HTML = `<div id="lineChart"></div><div id="barChart"></div>`;

const SRC = `
import { AgCharts, BarSeriesModule, CategoryAxisModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

ModuleRegistry.registerModules([CategoryAxisModule, NumberAxisModule]);

const lineOptions = {
    container: document.getElementById('lineChart'),
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
};

const barOptions = {
    container: document.getElementById('barChart'),
    series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
};

AgCharts.create(lineOptions, { modules: [LineSeriesModule] });
AgCharts.create(barOptions, { modules: [BarSeriesModule] });
`;

const parse = (srcFile: string) =>
    parser({ srcFile, html: HTML, dirPath: '/example', exampleSettings: { enterprise: false } });

describe('per-chart modules', () => {
    test('parser records the modules of each create call against its options variable', () => {
        const { bindings, typedBindings } = parse(SRC);
        expect(bindings.chartModules).toEqual({ lineOptions: '[LineSeriesModule]', barOptions: '[BarSeriesModule]' });
        expect(typedBindings.chartModules).toEqual(bindings.chartModules);
    });

    test('parser rejects params other than modules', () => {
        expect(() =>
            parse(`const options = { container: document.getElementById('lineChart') };
AgCharts.create(options, { theme: 'ag-default' });`)
        ).toThrow(/Unsupported AgCharts.create param "theme"/);
    });

    test('typescript output passes the modules to each create call', () => {
        const output = standardiseWhitespace(vanillaToTypescript(parse(SRC).typedBindings));
        expect(output).toContain('AgCharts.create(lineOptions, { modules: [LineSeriesModule] });');
        expect(output).toContain('AgCharts.create(barOptions, { modules: [BarSeriesModule] });');
    });

    test('react outputs pass the modules as a component prop', async () => {
        const { bindings, typedBindings } = parse(SRC);
        for (const output of [
            await vanillaToReactFunctional(bindings, [], [], false),
            await vanillaToReactFunctionalTs(typedBindings, [], [], false),
        ]) {
            expect(output).toContain('modules={[LineSeriesModule]}');
            expect(output).toContain('modules={[BarSeriesModule]}');
            expect(output).toMatch(/import {[^}]*\bLineSeriesModule\b[^}]*} from 'ag-charts-community'/);
        }
    });

    test('vue output binds the modules through a setup constant', async () => {
        const output = standardiseWhitespace(await vanillaToVue3(parse(SRC).typedBindings, [], [], false));
        expect(output).toContain('const lineOptionsModules = [LineSeriesModule];');
        expect(output).toContain(':modules="lineOptionsModules"');
        expect(output).toContain(':modules="barOptionsModules"');
    });

    test('angular output binds the modules through a component field', async () => {
        const output = standardiseWhitespace(await vanillaToAngular(parse(SRC).typedBindings, [], false));
        expect(output).toContain('public lineOptionsModules = [LineSeriesModule];');
        expect(output).toContain('[modules]="lineOptionsModules"');
        expect(output).toContain('[modules]="barOptionsModules"');
    });
});
