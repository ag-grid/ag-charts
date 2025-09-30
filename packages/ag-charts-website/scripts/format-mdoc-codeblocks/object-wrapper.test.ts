import { describe, expect, it } from 'vitest';

import { processMdocContent } from './formatter';

describe('mdoc object wrapper formatting', () => {
    it('preserves property-only snippets without adding wrapper artefacts', async () => {
        const input = ['```ts wrapper="object"', 'contextMenu: {', '    enabled: false,', '}', '```', ''].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(false);
        expect(formatted).toBe(input);
    });

    it('strips trailing semicolons from full object literals', async () => {
        const input = [
            '```ts wrapper="object"',
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
            '```ts wrapper="object"',
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
            '```ts wrapper="object"',
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
            '```ts wrapper="object"',
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
            '```ts wrapper="object"',
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
            '```ts wrapper="object"',
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
            '```ts wrapper="object"',
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
            '```ts wrapper="object"',
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
            '```ts wrapper="object"',
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
            '```js wrapper="object"',
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
            '```js wrapper="object"',
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
            '```ts wrapper="object"',
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
            '```ts wrapper="object"',
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
            '```ts wrapper="object"',
            '// Angular Chart Component',
            '@Component({',
            "    selector: 'app-root',",
            '})',
            'export class AppComponent {}',
            '```',
            '',
        ].join('\n');

        const expected = [
            '```ts wrapper="object"',
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
            '```ts wrapper="object"',
            '// Angular Chart Component',
            "import { AgCharts } from 'ag-charts-angular';",
            '// Chart Options Type Interface',
            "import { AgChartOptions } from 'ag-charts-community';",
            '```',
            '',
        ].join('\n');

        const expected = [
            '```ts wrapper="object"',
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
        const input = ['```js wrapper="object"', 'padding: 4; //padding of 4px on all sides', '```', ''].join('\n');

        // Semicolon is stripped, and since it's wrapped in an object, Prettier adds a comma
        const expected = ['```js wrapper="object"', 'padding: 4, //padding of 4px on all sides', '```', ''].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toBe(expected);
    });

    it('fixes semicolons inside complete object literals', async () => {
        const input = ['```js wrapper="object"', '{', "    styleNonce: '416d1177',", '}', '```', ''].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        // Already has comma, no changes needed
        expect(changed).toBe(false);
        expect(formatted).toBe(input);
    });

    it('removes indentation from reactHooks code blocks', async () => {
        const input = [
            '```jsx wrapper="reactHooks"',
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
            '```jsx wrapper="reactHooks"',
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
            '```jsx wrapper="reactHooks"',
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
});
