import { describe, expect, it } from 'vitest';

import { processMdocContent } from './formatter';

describe('mdoc object wrapper formatting', () => {
    it('preserves property-only snippets without adding wrapper artefacts', async () => {
        const input = ['```ts wrapper="object"', 'contextMenu: {', '    enabled: false,', '}', '```', ''].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(false);
        expect(formatted).toBe(input);
    });

    it('keeps full object literals intact including trailing semicolons', async () => {
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

        expect(changed).toBe(false);
        expect(formatted).toBe(input);
    });

    it('retains trailing commas when they are part of the original snippet', async () => {
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

        expect(changed).toBe(false);
        expect(formatted).toBe(input);
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
            "    'ag-gauge': AgGauge",
            '},',
            'data() {',
            '    return {',
            '        options: {',
            "            type: 'linear-gauge',",
            '            value: 80,',
            '            scale: {',
            '                min: 0,',
            '                max: 100',
            '            }',
            '        }',
            '    };',
            '}',
            '```',
            '',
        ].join('\n');

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(true);
        expect(formatted).toBe(expected);
    });

    it('continues to support doc shorthand snippets via the object wrapper pipeline', async () => {
        const input = ['```ts wrapper="docShorthand"', "fill: '#5C6BC0',", 'cornerRadius: 3', '};', '```', ''].join(
            '\n'
        );

        const { formatted, changed } = await processMdocContent(input, 'virtual.mdoc');

        expect(changed).toBe(false);
        expect(formatted).toBe(input);
    });
});
