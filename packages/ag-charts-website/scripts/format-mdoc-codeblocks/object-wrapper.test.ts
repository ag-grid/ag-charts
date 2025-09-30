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
});
