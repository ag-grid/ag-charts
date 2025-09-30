import { describe, expect, it } from 'vitest';

import { processMdocContent } from './formatter';

describe('mdoc object wrapper formatting', () => {
    it('preserves property-only snippets without adding wrapper artefacts', async () => {
        const input = ['```ts format="snippet"', 'contextMenu: {', '    enabled: false,', '}', '```', ''].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(false);
        expect(formatted).toBe(input);
    });

    it('strips trailing semicolons from full object literals', async () => {
        const input = [
            '```ts format="snippet"',
            '{',
            '    animation: {',
            '        duration: 500,',
            '    },',
            '};',
            '```',
            '',
        ].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        const expected = [
            '```ts format="snippet"',
            '{',
            '    animation: {',
            '        duration: 500,',
            '    },',
            '}',
            '```',
            '',
        ].join('\n');

        expect(changed).toBe(true);
        expect(formatted).toBe(expected);
    });

    it('strips trailing commas even when present in the original snippet', async () => {
        const input = [
            '```ts format="snippet"',
            'axes: [',
            '    {',
            "        type: 'number',",
            "        position: 'left',",
            '    },',
            '],',
            '```',
            '',
        ].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        const expected = [
            '```ts format="snippet"',
            'axes: [',
            '    {',
            "        type: 'number',",
            "        position: 'left',",
            '    },',
            ']',
            '```',
            '',
        ].join('\n');

        expect(changed).toBe(true);
        expect(formatted).toBe(expected);
    });

    it('preserves nested blocks that close with `};` inside the snippet', async () => {
        const input = [
            '```ts format="snippet"',
            'template: `<ag-gauge :options="options"/>`,',
            'components: {',
            "    'ag-gauge': AgGauge",
            '},',
            'data() {',
            '    return {',
            '        options: {',
            "            type: 'linear-gauge',",
            '            value: 80,',
            '            scale: {',
            '                min: 0,',
            '                max: 100,',
            '            },',
            '        },',
            '    };',
            '}',
            '```',
            '',
        ].join('\n');

        const expected = [
            '```ts format="snippet"',
            'template: `<ag-gauge :options="options"/>`,',
            'components: {',
            "    'ag-gauge': AgGauge,",
            '},',
            'data() {',
            '    return {',
            '        options: {',
            "            type: 'linear-gauge',",
            '            value: 80,',
            '            scale: {',
            '                min: 0,',
            '                max: 100,',
            '            },',
            '        },',
            '    };',
            '}',
            '```',
            '',
        ].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toBe(expected);
    });

    it('formats json code blocks using prettier without wrappers', async () => {
        const input = ['```json', '{"properties":{"name":"United Kingdom"}}', '```', ''].join('\n');

        const expected = ['```json', '{ "properties": { "name": "United Kingdom" } }', '```', ''].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toBe(expected);
    });

    it('strips trailing semicolons even when code is valid JavaScript', async () => {
        // This tests the case where code is valid JS (formats without wrapper)
        // but we still want semicolon stripping via the wrapper
        const input = [
            '```ts format="snippet"',
            '{',
            '    value: 80,',
            '    scale: {',
            '        min: 0,',
            '        max: 100',
            '    }',
            '};',
            '```',
            '',
        ].join('\n');

        const expected = [
            '```ts format="snippet"',
            '{',
            '    value: 80,',
            '    scale: {',
            '        min: 0,',
            '        max: 100,',
            '    },',
            '}',
            '```',
            '',
        ].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toBe(expected);
    });

    it('does not wrap complete statements (const, import, etc.)', async () => {
        const input = [
            '```ts format="snippet"',
            'const myTheme = {',
            '    palette: {',
            "        fills: ['#5C2983', '#0076C5'],",
            '    },',
            '};',
            '```',
            '',
        ].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        // Code is already properly formatted, so no changes expected
        expect(changed).toBe(false);
        expect(formatted).toBe(input);
    });

    it('handles objects with function bodies containing semicolons', async () => {
        const input = [
            '```js format="snippet"',
            '{',
            '    formatter: {',
            '        x: (params) => {',
            '            const value = params.value;',
            '            return value.toString();',
            '        },',
            '        y: (params) => {',
            '            return `Value: ${params.value}`;',
            '        },',
            '    },',
            '}',
            '```',
            '',
        ].join('\n');

        const expected = [
            '```js format="snippet"',
            '{',
            '    formatter: {',
            '        x: (params) => {',
            '            const value = params.value;',
            '            return value.toString();',
            '        },',
            '        y: (params) => {',
            '            return `Value: ${params.value}`;',
            '        },',
            '    },',
            '}',
            '```',
            '',
        ].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(false);
        expect(formatted).toBe(expected);
    });

    it('handles Angular decorators with export statements', async () => {
        const input = [
            '```ts format="snippet"',
            '@Component({',
            "    selector: 'app-root',",
            '    standalone: true,',
            '})',
            'export class AppComponent {',
            '    constructor() {}',
            '}',
            '```',
            '',
        ].join('\n');

        const expected = [
            '```ts format="snippet"',
            '@Component({',
            "    selector: 'app-root',",
            '    standalone: true,',
            '})',
            'export class AppComponent {',
            '    constructor() {}',
            '}',
            '```',
            '',
        ].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(false);
        expect(formatted).toBe(expected);
    });

    it('handles decorators with leading comments', async () => {
        const input = [
            '```ts format="snippet"',
            '// Angular Chart Component',
            '@Component({',
            "    selector: 'app-root',",
            '})',
            'export class AppComponent {}',
            '```',
            '',
        ].join('\n');

        const expected = [
            '```ts format="snippet"',
            '// Angular Chart Component',
            '@Component({',
            "    selector: 'app-root',",
            '})',
            'export class AppComponent {}',
            '```',
            '',
        ].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(false);
        expect(formatted).toBe(expected);
    });

    it('handles import statements with leading comments', async () => {
        const input = [
            '```ts format="snippet"',
            '// Angular Chart Component',
            "import { AgCharts } from 'ag-charts-angular';",
            '// Chart Options Type Interface',
            "import { AgChartOptions } from 'ag-charts-community';",
            '```',
            '',
        ].join('\n');

        const expected = [
            '```ts format="snippet"',
            '// Angular Chart Component',
            "import { AgCharts } from 'ag-charts-angular';",
            '// Chart Options Type Interface',
            "import { AgChartOptions } from 'ag-charts-community';",
            '```',
            '',
        ].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(false);
        expect(formatted).toBe(expected);
    });

    it('converts semicolons in simple property lines', async () => {
        const input = ['```js format="snippet"', 'padding: 4; //padding of 4px on all sides', '```', ''].join('\n');

        // Semicolon is stripped, and since it's wrapped in an object, Prettier adds a comma
        const expected = ['```js format="snippet"', 'padding: 4, //padding of 4px on all sides', '```', ''].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toBe(expected);
    });

    it('fixes semicolons inside complete object literals', async () => {
        const input = ['```js format="snippet"', '{', "    styleNonce: '416d1177',", '}', '```', ''].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        // Already has comma, no changes needed
        expect(changed).toBe(false);
        expect(formatted).toBe(input);
    });

    it('removes indentation from reactHooks code blocks', async () => {
        const input = [
            '```jsx format="reactHooks"',
            'const [options, setOptions] = useState({',
            "    type: 'linear-gauge',",
            '    value: 80,',
            '});',
            '',
            'return <AgGauge options={options} />;',
            '```',
            '',
        ].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        // Should remain without indentation
        expect(changed).toBe(false);
        expect(formatted).toBe(input);
    });

    it('removes incorrect indentation added by previous formatter runs', async () => {
        const input = [
            '```jsx format="reactHooks"',
            '    const [options, setOptions] = useState({',
            "        type: 'linear-gauge',",
            '        value: 80,',
            '    });',
            '',
            '    return <AgGauge options={options} />;',
            '```',
            '',
        ].join('\n');

        const expected = [
            '```jsx format="reactHooks"',
            'const [options, setOptions] = useState({',
            "    type: 'linear-gauge',",
            '    value: 80,',
            '});',
            '',
            'return <AgGauge options={options} />;',
            '```',
            '',
        ].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toBe(expected);
    });

    it('handles very long lines gracefully', async () => {
        // Create a line with more than 160 characters
        const longPropertyName = 'a'.repeat(200);
        const input = ['```ts format="snippet"', `${longPropertyName}: 'value',`, '```', ''].join('\n');

        const { formatted } = await processMdocContent(input, 'virtual.mdoc');

        // Should format without error, even if line is very long
        expect(formatted).toContain(longPropertyName);
    });

    it('handles Unicode characters in code', async () => {
        const input = ['```js format="snippet"', "label: '温度 (°C)',", "tooltip: '数据点',", '```', ''].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        // Should preserve Unicode characters
        expect(formatted).toContain('温度');
        expect(formatted).toContain('°C');
        expect(formatted).toContain('数据点');
    });

    it('handles malformed metadata gracefully', async () => {
        const input = ['```ts format=snippet', 'const value = 80;', '```', ''].join('\n');

        const { formatted } = await processMdocContent(input, 'virtual.mdoc');

        // Should still format even with malformed metadata (will be treated as no metadata)
        expect(formatted).toBeDefined();
        expect(formatted).toContain('const value = 80;');
    });

    it('handles empty code blocks', async () => {
        const input = ['```js format="snippet"', '', '```', ''].join('\n');

        const { formatted } = await processMdocContent(input, 'virtual.mdoc');

        // Empty code blocks get a newline added after formatting
        expect(formatted).toContain('```js format="snippet"');
        expect(formatted).toContain('```');
    });

    it('handles mixed language code blocks in same document', async () => {
        const input = [
            '```ts format="snippet"',
            'contextMenu: {',
            '    enabled: false,',
            '}',
            '```',
            '',
            '```json',
            '{"name": "test"}',
            '```',
            '',
        ].join('\n');

        const expected = [
            '```ts format="snippet"',
            'contextMenu: {',
            '    enabled: false,',
            '}',
            '```',
            '',
            '```json',
            '{ "name": "test" }',
            '```',
            '',
        ].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toBe(expected);
    });

    it('handles code with emoji characters', async () => {
        const input = ['```js format="snippet"', "label: '📊 Chart Data',", "tooltip: '✨ Hover me',", '```', ''].join(
            '\n'
        );

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        // Should preserve emoji characters
        expect(formatted).toContain('📊');
        expect(formatted).toContain('✨');
    });

    it('handles multiple format strategies in one file', async () => {
        const input = [
            '```ts format="snippet"',
            'contextMenu: {',
            '    enabled: false,',
            '}',
            '```',
            '',
            '```jsx format="reactHooks"',
            'const [state] = useState(80);',
            'return <div>{state}</div>;',
            '```',
            '',
        ].join('\n');

        const { formatted } = await processMdocContent(input, 'virtual.mdoc');

        // Both blocks should be processed correctly with their respective strategies
        expect(formatted).toContain('enabled: false');
        expect(formatted).toContain('useState(80)');
    });

    it('strips trailing semicolons from property assignments with arrays', async () => {
        const input = [
            '```js format="snippet"',
            'series: [',
            "    { type: 'area', xKey: 'month', yKey: 'subscriptions' },",
            "    { type: 'area', xKey: 'month', yKey: 'services' },",
            '];',
            '```',
            '',
        ].join('\n');

        const expected = [
            '```js format="snippet"',
            'series: [',
            "    { type: 'area', xKey: 'month', yKey: 'subscriptions' },",
            "    { type: 'area', xKey: 'month', yKey: 'services' },",
            ']',
            '```',
            '',
        ].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toBe(expected);
    });

    it('strips trailing semicolons from property assignments with objects', async () => {
        const input = ['```ts format="snippet"', 'contextMenu: {', '    enabled: false,', '};', '```', ''].join('\n');

        const expected = ['```ts format="snippet"', 'contextMenu: {', '    enabled: false,', '}', '```', ''].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toBe(expected);
    });

    it('handles complete array literals with semicolons', async () => {
        const input = [
            '```js format="snippet"',
            '[',
            "    { type: 'bar', xKey: 'month' },",
            "    { type: 'line', xKey: 'month' },",
            '];',
            '```',
            '',
        ].join('\n');

        const expected = [
            '```js format="snippet"',
            '[',
            "    { type: 'bar', xKey: 'month' },",
            "    { type: 'line', xKey: 'month' },",
            ']',
            '```',
            '',
        ].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toBe(expected);
    });

    it('handles simple property with array value and semicolon', async () => {
        const input = ['```ts format="snippet"', "axes: [{ type: 'number' }];", '```', ''].join('\n');

        const expected = ['```ts format="snippet"', "axes: [{ type: 'number' }]", '```', ''].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toBe(expected);
    });
});
