import { describe, expect, it } from 'vitest';

import { processMdocContent } from './formatter';

describe('mdoc object wrapper formatting', () => {
    it('adds outer braces to property-only snippets with object values', async () => {
        const input = ['```ts format="snippet"', 'contextMenu: {', '    enabled: false,', '}', '```', ''].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toMatchSnapshot();
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

        expect(changed).toBe(true);
        expect(formatted).toMatchSnapshot();
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

        expect(changed).toBe(true);
        expect(formatted).toMatchSnapshot();
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

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toMatchSnapshot();
    });

    it('formats json code blocks using prettier without wrappers', async () => {
        const input = ['```json', '{"properties":{"name":"United Kingdom"}}', '```', ''].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toMatchSnapshot();
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

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toMatchSnapshot();
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
        expect(formatted).toMatchSnapshot();
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

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(false);
        expect(formatted).toMatchSnapshot();
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

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(false);
        expect(formatted).toMatchSnapshot();
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

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(false);
        expect(formatted).toMatchSnapshot();
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

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(false);
        expect(formatted).toMatchSnapshot();
    });

    it('converts semicolons in simple property lines', async () => {
        const input = ['```js format="snippet"', 'padding: 4; //padding of 4px on all sides', '```', ''].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        // Semicolon is stripped, and since it's wrapped in an object, Prettier adds a comma
        expect(formatted).toMatchSnapshot();
    });

    it('fixes semicolons inside complete object literals', async () => {
        const input = ['```js format="snippet"', '{', "    styleNonce: '416d1177',", '}', '```', ''].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        // Already has comma, no changes needed
        expect(changed).toBe(false);
        expect(formatted).toMatchSnapshot();
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
        expect(formatted).toMatchSnapshot();
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

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toMatchSnapshot();
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

        const { formatted } = await processMdocContent(input, 'virtual.mdoc');

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

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toMatchSnapshot();
    });

    it('handles code with emoji characters', async () => {
        const input = ['```js format="snippet"', "label: '📊 Chart Data',", "tooltip: '✨ Hover me',", '```', ''].join(
            '\n'
        );

        const { formatted } = await processMdocContent(input, 'virtual.mdoc');

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

    it('strips trailing semicolons from property assignments with arrays and adds outer braces', async () => {
        const input = [
            '```js format="snippet"',
            'series: [',
            "    { type: 'area', xKey: 'month', yKey: 'subscriptions' },",
            "    { type: 'area', xKey: 'month', yKey: 'services' },",
            '];',
            '```',
            '',
        ].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toMatchSnapshot();
    });

    it('strips trailing semicolons from property assignments with objects and adds outer braces', async () => {
        const input = ['```ts format="snippet"', 'contextMenu: {', '    enabled: false,', '};', '```', ''].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toMatchSnapshot();
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

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toMatchSnapshot();
    });

    it('handles simple property with array value and semicolon and adds outer braces', async () => {
        const input = ['```ts format="snippet"', "axes: [{ type: 'number' }];", '```', ''].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toMatchSnapshot();
    });

    it('formats code with placeholder comments correctly', async () => {
        // Code with placeholder comments like `// ...` is now formatted correctly.
        // Previously, a containsDocumentationPlaceholders check prevented formatting,
        // but this was removed as it masked genuine syntax errors.
        const input = [
            '```js format="snippet"',
            'series: [',
            '    {',
            '        // ...',
            '        interpolation: {',
            "            type: 'smooth'", // Missing trailing comma
            '        },',
            '    },',
            '],', // Extra trailing comma
            '```',
            '',
        ].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toMatchSnapshot();
    });

    it('formats code with block comment placeholders and adds outer braces', async () => {
        const input = [
            '```js format="snippet"',
            'marker: {',
            '    /* ... */',
            '    fill: {',
            "        type: 'gradient'",
            '    }',
            '}',
            '```',
            '',
        ].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toMatchSnapshot();
    });

    it('formats code with regular comments (not placeholders) and adds outer braces', async () => {
        const input = [
            '```js format="snippet"',
            'axes: [',
            '    {',
            '        // This is a regular comment',
            "        type: 'number'",
            '    }',
            ']',
            '```',
            '',
        ].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toMatchSnapshot();
    });
});

describe('previously masked syntax errors', () => {
    it('throws error for array with missing object wrapper (invalid syntax)', async () => {
        // This pattern was in fills.mdoc - array without proper object structure
        // Previously masked by containsDocumentationPlaceholders check
        const input = [
            '```js format="snippet"',
            'series: [',
            '    // ...',
            '    fill: {',
            "        type: 'gradient'",
            '    }',
            ']',
            '```',
            '',
        ].join('\n');

        // This is invalid syntax - fill property needs to be inside an object
        await expect(processMdocContent(input, 'virtual.mdoc')).rejects.toThrow(/Unexpected token/);
    });

    it('throws error for semicolon inside object (invalid syntax)', async () => {
        // This pattern was in markers.mdoc and map-topology.mdoc
        // Previously masked by containsDocumentationPlaceholders check
        const input = [
            '```js format="snippet"',
            '{',
            '    series: [',
            '        {',
            '            marker: {',
            "                shape: 'square'",
            '            }',
            '        }',
            '    ];', // Invalid - semicolon inside object
            '}',
            '```',
            '',
        ].join('\n');

        // This is invalid syntax - array closing with semicolon inside object
        await expect(processMdocContent(input, 'virtual.mdoc')).rejects.toThrow(/Unexpected token/);
    });

    it('throws error for trailing comma after array in statement (invalid syntax)', async () => {
        // This pattern was in sunburst-series.mdoc
        // Previously masked by containsDocumentationPlaceholders check
        const input = [
            '```js format="snippet"',
            'let data = [',
            '    {',
            "        name: 'Item 1',",
            '        children: []',
            '    }',
            '],', // Invalid - trailing comma after array in let statement
            '```',
            '',
        ].join('\n');

        // This is invalid syntax - trailing comma after array closing in let statement
        await expect(processMdocContent(input, 'virtual.mdoc')).rejects.toThrow(/Unexpected token/);
    });

    it('formats correctly fixed version of array with object wrapper and adds outer braces', async () => {
        // This is the CORRECT version of the fills.mdoc pattern after manual fixing
        const input = [
            '```js format="snippet"',
            'series: [',
            '    {',
            '        // ...',
            '        fill: {',
            "            type: 'gradient'",
            '        }',
            '    }',
            ']',
            '```',
            '',
        ].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toMatchSnapshot();
    });
});

describe('preserve braces for array-of-objects properties', () => {
    it('preserves outer braces for single-line series with array of objects', async () => {
        const input = [
            '```js format="snippet"',
            'series: [{ type: "bar", xKey: "month", yKey: "sales" }]',
            '```',
            '',
        ].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toMatchSnapshot();
    });

    it('preserves outer braces for multi-line series with array of objects', async () => {
        const input = [
            '```js format="snippet"',
            'series: [',
            '    { type: "nightingale", angleKey: "quarter", radiusKey: "software", radiusName: "Software", grouped: true },',
            '    { type: "nightingale", angleKey: "quarter", radiusKey: "hardware", radiusName: "Hardware", grouped: true },',
            '    { type: "nightingale", angleKey: "quarter", radiusKey: "services", radiusName: "Services", grouped: true },',
            ']',
            '```',
            '',
        ].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toMatchSnapshot();
    });

    it('preserves outer braces for bubble series configuration', async () => {
        const input = [
            '```js format="snippet"',
            'series: [',
            '    {',
            '        //...',
            '        size: 10, //defaults to 7',
            '        maxSize: 20, //defaults to 30',
            '        domain: [0, 100], //defaults to the series data domain',
            '    },',
            ']',
            '```',
            '',
        ].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toMatchSnapshot();
    });

    it('preserves outer braces and strips trailing semicolon', async () => {
        const input = [
            '```js format="snippet"',
            'series: [',
            '    { type: "bar", xKey: "month" },',
            '];',
            '```',
            '',
        ].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toMatchSnapshot();
    });

    it('does not add outer braces for simple array properties without objects', async () => {
        const input = ['```js format="snippet"', 'labels: ["Q1", "Q2", "Q3", "Q4"]', '```', ''].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toMatchSnapshot();
    });

    it('does not add outer braces for simple property assignments', async () => {
        const input = ['```js format="snippet"', 'padding: 10', '```', ''].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(false);
        expect(formatted).toMatchSnapshot();
    });

    it('preserves outer braces for object properties', async () => {
        const input = ['```js format="snippet"', 'tooltip: {', '    pagination: true,', '}', '```', ''].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toMatchSnapshot();
    });

    it('preserves outer braces for multi-line object properties', async () => {
        const input = [
            '```js format="snippet"',
            'tooltip: {',
            '    position: {',
            '        anchorTo: "node",',
            '        placement: "top",',
            '    },',
            '}',
            '```',
            '',
        ].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toMatchSnapshot();
    });
});

describe('code that should not use format="snippet"', () => {
    it('throws error for code with this keyword', async () => {
        // Angular code with this.chartOptions cannot be formatted as snippet
        const input = [
            '```ts format="snippet"',
            'this.chartOptions = {',
            '    title: { text: "Chart" }',
            '};',
            '```',
            '',
        ].join('\n');

        await expect(processMdocContent(input, 'virtual.mdoc')).rejects.toThrow(/expected/i);
    });

    it('throws error for code with top-level await', async () => {
        // Top-level await is not valid in snippet context
        const input = ['```js format="snippet"', 'await someFunction();', '```', ''].join('\n');

        await expect(processMdocContent(input, 'virtual.mdoc')).rejects.toThrow();
    });

    it('formats complete JSX without format metadata', async () => {
        // Complete JSX components should not use format="snippet"
        const input = ['```jsx', 'const MyComponent = () => {', '    return <div>Hello</div>;', '};', '```', ''].join(
            '\n'
        );

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(false); // Already properly formatted
        expect(formatted).toContain('const MyComponent = () => {');
    });
});
