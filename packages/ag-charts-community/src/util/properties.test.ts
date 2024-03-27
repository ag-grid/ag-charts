import { BaseProperties, PropertiesArray, isProperties } from './properties';
import { expectWarning, setupMockConsole } from './test/mockConsole';
import { NUMBER, OBJECT_ARRAY, STRING, Validate } from './validation';

describe('BaseProperties', () => {
    setupMockConsole();

    it('should correctly set properties on an instance', () => {
        class MyClass extends BaseProperties<{ prop1: string; prop2: number }> {
            @Validate(STRING)
            prop1!: string;

            @Validate(NUMBER)
            prop2!: number;
        }
        const instance = new MyClass();
        instance.set({ prop1: 'value1', prop2: 42 });
        expect(instance.prop1).toBe('value1');
        expect(instance.prop2).toBe(42);
    });

    it('should warn on setting unknown properties', () => {
        class MyClass extends BaseProperties<{ prop1: string }> {
            @Validate(STRING)
            prop1!: string;
        }
        const instance = new MyClass();
        instance.set({ unknownProp: 'value' } as any);
        expectWarning('AG Charts - unable to set [unknownProp] in MyClass - property is unknown');
    });

    it('should warn on providing non-object properties', () => {
        class MyClass extends BaseProperties<{ prop1: string }> {
            @Validate(STRING)
            prop1!: string;
        }
        const instance = new MyClass();
        instance.set('string' as any);
        expectWarning('AG Charts - unable to set MyClass - expecting a properties object');
    });

    it('should validate required properties correctly', () => {
        class MyClass extends BaseProperties<{ prop1: string; prop2?: number }> {
            @Validate(STRING)
            prop1!: string;

            @Validate(NUMBER, { optional: true })
            prop2?: number;
        }
        const instance = new MyClass().set({ prop1: 'value1' });
        expect(instance.isValid()).toBe(true);

        const incompleteInstance = new MyClass();
        expect(incompleteInstance.isValid()).toBe(false);
    });

    it('should serialize to JSON correctly', () => {
        class MyClass extends BaseProperties<{ prop1: string; prop2: number }> {
            @Validate(STRING)
            prop1!: string;

            @Validate(NUMBER)
            prop2!: number;
        }
        const instance = new MyClass().set({ prop1: 'value1', prop2: 42 });
        const json = instance.toJson();
        expect(json).toEqual({ prop1: 'value1', prop2: 42 });
    });
});

describe('PropertiesArray', () => {
    it('should correctly handle arrays of BaseProperties instances', () => {
        class MyProperties extends BaseProperties<{ value: string }> {
            @Validate(STRING)
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
            @Validate(STRING)
            value!: string;
        }
        class MyClass extends BaseProperties<{ props: { value: string }[] }> {
            @Validate(OBJECT_ARRAY)
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
            @Validate(STRING)
            value!: string;
        }
        const array = new PropertiesArray(MyProperties, { value: 'item1' });
        const newArray = array.reset([{ value: 'newItem' }]);
        expect(newArray[0]).toBeInstanceOf(MyProperties);
        expect(newArray[0].value).toBe('newItem');
        expect(newArray.length).toBe(1);
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
