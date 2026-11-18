import { wrapOptionsUpdateCode } from './chart-utils';
import { standardiseWhitespace } from './test-utils';

describe('wrapOptionsUpdateCode', () => {
    it('adds default options update code', () => {
        const functionDefinition = `function foo(bar) {
            options.padding.top = 20;
        }`;

        const propertyDefinition = wrapOptionsUpdateCode(functionDefinition);
        const expected =
            'function foo(bar) { const options = clone(this.options); options.padding.top = 20; this.options = options; }';

        expect(standardiseWhitespace(propertyDefinition)).toBe(expected);
    });

    it('can customise options update code', () => {
        const functionDefinition = `foo = (bar) => {
            options.padding.top = 20;
        }`;

        const propertyDefinition = wrapOptionsUpdateCode(
            functionDefinition,
            'this.state.options',
            'this.setState({ options });'
        );

        const expected =
            'foo = (bar) => { const options = clone(this.state.options); options.padding.top = 20; this.setState({ options }); }';

        expect(standardiseWhitespace(propertyDefinition)).toBe(expected);
    });

    it('correctly interprets braces inside the function body', () => {
        const functionDefinition = `foo(bar) {
            options.axes.x.gridLine.style = [{ lineDash: [1, 3] }];
        }`;

        const propertyDefinition = wrapOptionsUpdateCode(functionDefinition);
        const expected =
            'foo(bar) { const options = clone(this.options); options.axes.x.gridLine.style = [{ lineDash: [1, 3] }]; this.options = options; }';

        expect(standardiseWhitespace(propertyDefinition)).toBe(expected);
    });

    describe('reads of the whole options variable', () => {
        it('rewrites a bare read in code that updates no member', () => {
            const propertyDefinition = wrapOptionsUpdateCode(`foo() {
                const { series } = options;
                console.log(series, { ...options });
            }`);

            expect(standardiseWhitespace(propertyDefinition)).toBe(
                'foo() { const { series } = this.options; console.log(series, { ...this.options }); }'
            );
            expect(propertyDefinition).not.toContain('clone(');
        });

        it('rewrites a bare read to the custom input variable', () => {
            const propertyDefinition = wrapOptionsUpdateCode(`foo() { return options; }`, 'options.value');

            expect(standardiseWhitespace(propertyDefinition)).toBe('foo() { return options.value; }');
        });

        it('rewrites a bare read next to an update to the local copy, so both are the same variable', () => {
            const propertyDefinition = wrapOptionsUpdateCode(`foo() {
                options.padding.top = 20;
                helper(options);
            }`);

            expect(standardiseWhitespace(propertyDefinition)).toBe(
                'foo() { const options = clone(this.options); options.padding.top = 20; helper(options); this.options = options; }'
            );
        });

        it('rewrites a bare read to the custom local variable', () => {
            const propertyDefinition = wrapOptionsUpdateCode(
                `foo() { options.padding.top = 20; helper(options); }`,
                'this.state.options',
                'this.setState({ options: copy });',
                'copy'
            );

            expect(standardiseWhitespace(propertyDefinition)).toContain('copy.padding.top = 20; helper(copy);');
        });

        it('leaves a member that is merely called options', () => {
            const propertyDefinition = wrapOptionsUpdateCode(`foo() { return props.options; }`);

            expect(standardiseWhitespace(propertyDefinition)).toBe('foo() { return props.options; }');
        });
    });
});
