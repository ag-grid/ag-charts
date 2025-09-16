describe('prettier-plugin-partial-js-markdown', () => {
    let plugin: any;

    beforeAll(() => {
        plugin = require('../dist/src/index');
    });

    describe('plugin structure', () => {
        it('should export a default plugin object', () => {
            expect(plugin).toBeDefined();
            expect(plugin.default).toBeDefined();
        });

        it('should have parsers defined', () => {
            expect(plugin.parsers).toBeDefined();
            expect(plugin.parsers['partial-js-markdown']).toBeDefined();
        });

        it('should have the correct parser structure', () => {
            const parser = plugin.parsers['partial-js-markdown'];
            expect(parser.parse).toBeDefined();
            expect(parser.preprocess).toBeDefined();
            expect(parser.astFormat).toBe('mdast');
            expect(parser.locStart).toBeDefined();
            expect(parser.locEnd).toBeDefined();
        });

        it('should have empty languages array', () => {
            expect(plugin.languages).toBeDefined();
            expect(Array.isArray(plugin.languages)).toBe(true);
            expect(plugin.languages.length).toBe(0);
        });

        it('should have empty printers object', () => {
            expect(plugin.printers).toBeDefined();
            expect(typeof plugin.printers).toBe('object');
            expect(Object.keys(plugin.printers).length).toBe(0);
        });
    });

    describe('wrapper module', () => {
        let wrapper: any;

        beforeAll(() => {
            wrapper = require('../dist/src/wrapper');
        });

        it('should export tryWrapCode function', () => {
            expect(wrapper.tryWrapCode).toBeDefined();
            expect(typeof wrapper.tryWrapCode).toBe('function');
        });

        it('should export wrapStrategies array', () => {
            expect(wrapper.wrapStrategies).toBeDefined();
            expect(Array.isArray(wrapper.wrapStrategies)).toBe(true);
            expect(wrapper.wrapStrategies.length).toBeGreaterThan(0);
        });

        it('should have valid wrap strategies', () => {
            wrapper.wrapStrategies.forEach((strategy: any) => {
                expect(strategy.name).toBeDefined();
                expect(typeof strategy.wrap).toBe('function');
                expect(typeof strategy.unwrap).toBe('function');
                expect(typeof strategy.canHandle).toBe('function');
            });
        });
    });

    describe('code wrapping logic', () => {
        let wrapper: any;

        beforeAll(() => {
            wrapper = require('../dist/src/wrapper');
        });

        it('should wrap object properties correctly', () => {
            const code = 'foo: "bar",\nbaz: 123';
            const result = wrapper.tryWrapCode(code);
            expect(result).toBeDefined();
            expect(result.strategy.name).toBe('interfaceProperty');
            expect(result.wrapped).toContain('interface __Temp__ {');
            expect(result.wrapped).toContain(code);
        });

        it('should wrap JSX correctly', () => {
            const code = '<div>Hello</div>';
            const result = wrapper.tryWrapCode(code);
            expect(result).toBeDefined();
            expect(result.strategy.name).toBe('jsx');
            expect(result.wrapped).toContain('const __temp__ = (');
            expect(result.wrapped).toContain(code);
        });

        it('should wrap function body correctly', () => {
            const code = 'if (x > 0) {\n    return x;\n}';
            const result = wrapper.tryWrapCode(code);
            expect(result).toBeDefined();
            expect(result.strategy.name).toBe('function');
            expect(result.wrapped).toContain('function __temp__() {');
            expect(result.wrapped).toContain(code);
        });

        it('should wrap TypeScript types correctly', () => {
            const code = '{ name: string; age?: number }';
            const result = wrapper.tryWrapCode(code);
            expect(result).toBeDefined();
            expect(result.strategy.name).toBe('type');
            expect(result.wrapped).toContain('type __Temp__ =');
            expect(result.wrapped).toContain(code);
        });
    });
});