import { DataModel } from './dataModel';

type TestDatumDefinition = any;

describe('DataModel.processValue', () => {
    let dataModel: DataModel<any, any>;

    beforeEach(() => {
        const options = {
            props: [
                { type: 'key', valueType: 'category', property: 'category', scopes: ['test'] },
                { type: 'value', valueType: 'range', property: 'value', scopes: ['test'] },
            ],
            groupByKeys: false,
        };

        dataModel = new DataModel(options as any);
    });

    describe('basic value processing', () => {
        it('should extract property value from datum', () => {
            const def: TestDatumDefinition = {
                type: 'value',
                valueType: 'range',
                property: 'testProp',
                scopes: ['test'],
                index: 0,
                missing: new Map(),
            };

            const datum = { testProp: 42 };
            const result = dataModel.processValue(def, datum, 0);

            expect(result.value).toBe(42);
            expect(result.valid).toBe(true);
            expect(result.missing).toBe(false);
        });

        it('should handle missing property', () => {
            const def: TestDatumDefinition = {
                type: 'value',
                valueType: 'range',
                property: 'missingProp',
                scopes: ['test'],
                index: 0,
                missing: new Map(),
            };

            const datum = { otherProp: 42 };
            const result = dataModel.processValue(def, datum, 0, 'test');

            expect(result.value).toBeUndefined();
            expect(result.valid).toBe(true);
            expect(result.missing).toBe(true);
            expect(def.missing.get('test')).toBe(1);
        });

        it('should use missingValue when property is missing', () => {
            const def: TestDatumDefinition = {
                type: 'value',
                valueType: 'range',
                property: 'missingProp',
                missingValue: -1,
                scopes: ['test'],
                index: 0,
                missing: new Map(),
            };

            const datum = { otherProp: 42 };
            const result = dataModel.processValue(def, datum, 0);

            expect(result.value).toBe(-1);
            expect(result.valid).toBe(true);
            expect(result.missing).toBe(true);
        });
    });

    describe('processor caching', () => {
        it('should cache processor functions', () => {
            const processorSpy = jest.fn(() => (value: any) => value * 2);

            const def: TestDatumDefinition = {
                type: 'value',
                valueType: 'range',
                property: 'testProp',
                processor: processorSpy,
                scopes: ['test'],
                index: 0,
                missing: new Map(),
            };

            const datum1 = { testProp: 10 };
            const datum2 = { testProp: 20 };

            const result1 = dataModel.processValue(def, datum1, 0);
            const result2 = dataModel.processValue(def, datum2, 1);

            expect(result1.value).toBe(20); // 10 * 2
            expect(result2.value).toBe(40); // 20 * 2
            expect(processorSpy).toHaveBeenCalledTimes(1); // Processor function created only once
        });

        it('should reuse cached processors across multiple calls', () => {
            const processorSpy = jest.fn(() => (value: any) => value + 100);

            const def: TestDatumDefinition = {
                type: 'value',
                valueType: 'range',
                property: 'testProp',
                processor: processorSpy,
                scopes: ['test'],
                index: 0,
                missing: new Map(),
            };

            // Call processValue multiple times
            for (let i = 0; i < 5; i++) {
                const datum = { testProp: i };
                const result = dataModel.processValue(def, datum, i);
                expect(result.value).toBe(i + 100);
            }

            // Processor should only be created once
            expect(processorSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('validation handling', () => {
        it('should validate values using validation function', () => {
            const def: TestDatumDefinition = {
                type: 'value',
                valueType: 'range',
                property: 'testProp',
                validation: (value: number) => value > 0,
                scopes: ['test'],
                index: 0,
                missing: new Map(),
            };

            const validDatum = { testProp: 42 };
            const invalidDatum = { testProp: -5 };

            const validResult = dataModel.processValue(def, validDatum, 0);
            expect(validResult.value).toBe(42);
            expect(validResult.valid).toBe(true);

            const invalidResult = dataModel.processValue(def, invalidDatum, 1);
            expect(invalidResult.value).toBeUndefined();
            expect(invalidResult.valid).toBe(false);
        });

        it('should use invalidValue for invalid data', () => {
            const def: TestDatumDefinition = {
                type: 'value',
                valueType: 'range',
                property: 'testProp',
                validation: (value: number) => value > 0,
                invalidValue: 0,
                scopes: ['test'],
                index: 0,
                missing: new Map(),
            };

            const invalidDatum = { testProp: -5 };
            const result = dataModel.processValue(def, invalidDatum, 0);

            expect(result.value).toBe(0);
            expect(result.valid).toBe(false);
        });
    });

    describe('forced values', () => {
        it('should use forceValue when specified', () => {
            const def: TestDatumDefinition = {
                type: 'value',
                valueType: 'range',
                property: 'testProp',
                forceValue: 100,
                scopes: ['test'],
                index: 0,
                missing: new Map(),
            };

            const datum = { testProp: 42 };
            const result = dataModel.processValue(def, datum, 0);

            expect(result.value).toBe(100);
            expect(result.valid).toBe(true);
            expect(result.missing).toBe(false);
        });

        it('should preserve sign for negative forced values', () => {
            const def: TestDatumDefinition = {
                type: 'value',
                valueType: 'range',
                property: 'testProp',
                forceValue: 100,
                scopes: ['test'],
                index: 0,
                missing: new Map(),
            };

            const negativeDatum = { testProp: -42 };
            const result = dataModel.processValue(def, negativeDatum, 0);

            expect(result.value).toBe(-100); // Sign preserved
            expect(result.valid).toBe(true);
        });
    });

    describe('scope-based missing value tracking', () => {
        it('should track missing values for single scope', () => {
            const def: TestDatumDefinition = {
                type: 'value',
                valueType: 'range',
                property: 'missingProp',
                scopes: ['test'],
                index: 0,
                missing: new Map(),
            };

            const datum = { otherProp: 42 };

            dataModel.processValue(def, datum, 0, 'test');
            dataModel.processValue(def, datum, 1, 'test');

            expect(def.missing.get('test')).toBe(2);
        });

        it('should track missing values for multiple scopes', () => {
            const def: TestDatumDefinition = {
                type: 'value',
                valueType: 'range',
                property: 'missingProp',
                scopes: ['scope1', 'scope2'],
                index: 0,
                missing: new Map(),
            };

            const datum = { otherProp: 42 };

            dataModel.processValue(def, datum, 0, ['scope1', 'scope2']);

            expect(def.missing.get('scope1')).toBe(1);
            expect(def.missing.get('scope2')).toBe(1);
        });
    });

    describe('accessor support', () => {
        it('should use provided accessors', () => {
            const def: TestDatumDefinition = {
                type: 'value',
                valueType: 'range',
                property: 'nested.prop',
                scopes: ['test'],
                index: 0,
                missing: new Map(),
            };

            const accessor = jest.fn((d: any) => d.nested?.prop);
            const accessors = new Map([['nested.prop', accessor]]);

            const datum = { nested: { prop: 42 } };
            const result = dataModel.processValue(def, datum, 0, undefined, accessors);

            expect(result.value).toBe(42);
            expect(accessor).toHaveBeenCalledWith(datum);
        });

        it('should handle accessor errors gracefully', () => {
            const def: TestDatumDefinition = {
                type: 'value',
                valueType: 'range',
                property: 'errorProp',
                scopes: ['test'],
                index: 0,
                missing: new Map(),
            };

            const accessor = jest.fn(() => {
                throw new Error('Accessor error');
            });
            const accessors = new Map([['errorProp', accessor]]);

            const datum = { errorProp: 42 };
            const result = dataModel.processValue(def, datum, 0, undefined, accessors);

            expect(result.value).toBeUndefined();
            expect(result.missing).toBe(true);
        });
    });

    describe('domain extension', () => {
        it('should extend domain when dataDomain is provided', () => {
            const def: TestDatumDefinition = {
                type: 'value',
                valueType: 'range',
                property: 'testProp',
                scopes: ['test'],
                index: 0,
                missing: new Map(),
            };

            const mockDomain = {
                extend: jest.fn(),
                getDomain: jest.fn(),
            };

            const dataDomain = new Map([[def, mockDomain]]);
            const datum = { testProp: 42 };

            const result = dataModel.processValue(def, datum, 0, undefined, undefined, dataDomain as any);

            expect(result.value).toBe(42);
            expect(mockDomain.extend).toHaveBeenCalledWith(42);
        });

        it('should initialize domain if missing', () => {
            const def: TestDatumDefinition = {
                type: 'value',
                valueType: 'range',
                property: 'testProp',
                scopes: ['test'],
                index: 0,
                missing: new Map(),
            };

            const dataDomain = new Map();
            const initDataDomain = jest.fn();

            const datum = { testProp: 42 };
            dataModel.processValue(def, datum, 0, undefined, undefined, dataDomain as any, initDataDomain);

            expect(initDataDomain).toHaveBeenCalled();
        });
    });
});
