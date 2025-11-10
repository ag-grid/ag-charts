import { BaseProperties, PropertiesArray, Property, isProperties } from 'ag-charts-core';

import { expectWarningsCalls, setupMockConsole } from './test/mockConsole';

describe('BaseProperties', () => {
    setupMockConsole();

    it('should correctly set properties on an instance', () => {
        class MyClass extends BaseProperties<{ prop1: string; prop2: number }> {
            @Property
            prop1!: string;

            @Property
            prop2!: number;
        }
        const instance = new MyClass();
        instance.set({ prop1: 'value1', prop2: 42 });
        expect(instance.prop1).toBe('value1');
        expect(instance.prop2).toBe(42);
    });

    it('should warn on setting unknown properties', () => {
        class MyClass extends BaseProperties<{ prop1: string }> {
            @Property
            prop1!: string;
        }
        const instance = new MyClass();
        instance.set({ unknownProp: 'value' } as any);
        expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - unable to set [unknownProp] in MyClass - property is unknown",
  ],
]
`);
    });

    it('should warn on providing non-object properties', () => {
        class MyClass extends BaseProperties<{ prop1: string }> {
            @Property
            prop1!: string;
        }
        const instance = new MyClass();
        instance.set('string' as any);
        expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - unable to set MyClass - expecting a properties object",
  ],
]
`);
    });

    it('should serialize to JSON correctly', () => {
        class MyClass extends BaseProperties<{ prop1: string; prop2: number }> {
            @Property
            prop1!: string;

            @Property
            prop2!: number;
        }
        const instance = new MyClass().set({ prop1: 'value1', prop2: 42 });
        const json = instance.toJson();
        expect(json).toEqual({ prop1: 'value1', prop2: 42 });
    });

    it('should clear all properties correctly', () => {
        class NestedProperties extends BaseProperties<{ nestedValue: string }> {
            @Property
            nestedValue!: string;
        }

        class MyClass extends BaseProperties<{ prop1: string; prop2: number; nested: { nestedValue: string } }> {
            @Property
            prop1!: string;

            @Property
            prop2!: number;

            @Property
            nested = new NestedProperties();
        }

        const instance = new MyClass();
        instance.set({
            prop1: 'value1',
            prop2: 42,
            nested: { nestedValue: 'nested' },
        });

        // Verify properties are set
        expect(instance.prop1).toBe('value1');
        expect(instance.prop2).toBe(42);
        expect(instance.nested.nestedValue).toBe('nested');

        // Clear all properties
        instance.clear();

        // Verify properties are cleared
        expect(instance.prop1).toBeUndefined();
        expect(instance.prop2).toBeUndefined();
        expect(instance.nested.nestedValue).toBeUndefined();
    });
});

describe('PropertiesArray', () => {
    setupMockConsole();

    it('should correctly handle arrays of BaseProperties instances', () => {
        class MyProperties extends BaseProperties<{ value: string }> {
            @Property
            value!: string;
        }
        const array = new PropertiesArray(MyProperties, { value: 'item1' }, { value: 'item2' });
        expect(array[0]).toBeInstanceOf(MyProperties);
        expect(array[1]).toBeInstanceOf(MyProperties);
        expect(array[0].value).toBe('item1');
        expect(array[1].value).toBe('item2');
        expect(array.toJson()).toEqual([{ value: 'item1' }, { value: 'item2' }]);
    });

    it('should correctly handle arrays properties on BaseProperties instances', () => {
        class MyProperties extends BaseProperties<{ value: string }> {
            @Property
            value!: string;
        }
        class MyClass extends BaseProperties<{ props: { value: string }[] }> {
            @Property
            props = new PropertiesArray(MyProperties);
        }
        const instance = new MyClass().set({ props: [{ value: 'item1' }, { value: 'item2' }] });
        expect(instance.props).toBeInstanceOf(PropertiesArray);
        expect(instance.props[0]).toBeInstanceOf(MyProperties);
        expect(instance.props[1]).toBeInstanceOf(MyProperties);
        expect(instance.props[0].value).toBe('item1');
        expect(instance.props[1].value).toBe('item2');
        expect(instance.toJson()).toEqual({ props: [{ value: 'item1' }, { value: 'item2' }] });
    });

    it('should reset correctly', () => {
        class MyProperties extends BaseProperties<{ value: string }> {
            @Property
            value!: string;
        }
        const array = new PropertiesArray(MyProperties, { value: 'item1' });
        const newArray = array.reset([{ value: 'newItem' }])!;
        expect(newArray[0]).toBeInstanceOf(MyProperties);
        expect(newArray[0].value).toBe('newItem');
        expect(newArray.length).toBe(1);
    });

    it('should reject non-arrays', () => {
        class MyProperties extends BaseProperties<{ value: string }> {
            @Property
            value!: string;
        }
        class MyClass extends BaseProperties<{ props: { value: string }[] }> {
            @Property
            props = new PropertiesArray(MyProperties);
        }
        // @ts-expect-error error
        const instance = new MyClass().set({ props: { value: 'item1' } });
        expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - unable to set [props] - expecting a properties array",
  ],
]
`);
        expect(instance.props).toHaveLength(0);
    });
});

describe('isProperties', () => {
    it('should identify BaseProperties and PropertiesArray instances correctly', () => {
        class MyProperties extends BaseProperties<{ value: string }> {
            value!: string;
        }
        const instance = new MyProperties();
        const array = new PropertiesArray(MyProperties);
        expect(isProperties(instance)).toBe(true);
        expect(isProperties(array)).toBe(true);
        expect(isProperties({})).toBe(false);
    });
});
