import { describe, expect, it } from 'vitest';

import { type ModuleNode, buildModuleMappingsTable } from './renderModuleMappings';

const SITE_ROOT = 'https://www.ag-grid.com/';

const groups: ModuleNode[] = [
    {
        name: 'Series',
        children: [
            { name: 'Line', moduleName: 'LineSeriesModule', path: 'line-series' },
            { name: 'Heatmap', moduleName: 'HeatmapSeriesModule', path: 'heatmap-series', isEnterprise: true },
        ],
    },
];

function bodyRows(output: string): string[][] {
    return output
        .split('\n')
        .filter((line) => line.startsWith('|'))
        .slice(2)
        .map((line) =>
            line
                .split('|')
                .slice(1, -1)
                .map((cell) => cell.trim())
        );
}

describe('buildModuleMappingsTable', () => {
    it('links to the module selector on the HTML page', () => {
        const output = buildModuleMappingsTable(groups, 'javascript', SITE_ROOT);

        expect(output.split('\n')[0]).toContain(
            '[Select modules interactively](https://www.ag-grid.com/javascript/module-registry/#selecting-modules)'
        );
    });

    it('lists every module, linking the feature to its docs page and marking Enterprise', () => {
        expect(bodyRows(buildModuleMappingsTable(groups, 'javascript', SITE_ROOT))).toEqual([
            ['[Line](https://www.ag-grid.com/javascript/line-series/)', '`LineSeriesModule`', ''],
            ['[Heatmap](https://www.ag-grid.com/javascript/heatmap-series/)', '`HeatmapSeriesModule`', 'Enterprise'],
        ]);
    });

    it('inherits Enterprise from an ancestor group', () => {
        const nested: ModuleNode[] = [
            { name: 'Enterprise', isEnterprise: true, children: [{ name: 'Maps', moduleName: 'MapModule' }] },
        ];

        expect(bodyRows(buildModuleMappingsTable(nested, 'javascript', SITE_ROOT))).toEqual([
            ['Maps', '`MapModule`', 'Enterprise'],
        ]);
    });

    it.each([
        ['hidden nodes', [{ name: 'Hidden', moduleName: 'HiddenModule', hide: true }]],
        ['nodes hidden from selection', [{ name: 'Internal', moduleName: 'InternalModule', hideFromSelection: true }]],
        ['no groups', []],
    ])('degrades to an empty string for %s', (_label, input) => {
        expect(buildModuleMappingsTable(input as ModuleNode[], 'javascript', SITE_ROOT)).toBe('');
    });
});
