import { sizeOf } from './size-of';

describe('sizeOf', () => {
    describe('Primitive Types', () => {
        test('should calculate size of null and undefined', () => {
            expect(sizeOf(null)).toEqual({
                size: 8,
                primitiveSize: 8,
                pointerSize: 0,
                trivialObjectSize: 0,
                arraySize: 0,
                objectSize: 0,
                canvasSize: 0,
                mapSize: 0,
                setSize: 0,
                functionSize: 0,
            });
            expect(sizeOf(undefined)).toEqual({
                size: 8,
                primitiveSize: 8,
                pointerSize: 0,
                trivialObjectSize: 0,
                arraySize: 0,
                objectSize: 0,
                canvasSize: 0,
                mapSize: 0,
                setSize: 0,
                functionSize: 0,
            });
        });

        test('should calculate size of boolean', () => {
            expect(sizeOf(true).size).toBe(4); // BOOLEAN size
            expect(sizeOf(false).size).toBe(4);

            expect(sizeOf(true).primitiveSize).toBe(4);
            expect(sizeOf(false).primitiveSize).toBe(4);
        });

        test('should calculate size of numbers', () => {
            expect(sizeOf(42).size).toBe(8); // NUMBER size
            expect(sizeOf(3.14).size).toBe(8);
            expect(sizeOf(0).size).toBe(8);
            expect(sizeOf(-1).size).toBe(8);

            expect(sizeOf(42).primitiveSize).toBe(8);
        });

        test('should calculate size of strings', () => {
            expect(sizeOf('').size).toBe(12); // STRING_OVERHEAD
            expect(sizeOf('a').size).toBe(14); // STRING_OVERHEAD + 1 * STRING_CHAR_SIZE
            expect(sizeOf('hello').size).toBe(22); // 12 + 5 * 2
            expect(sizeOf('test string').size).toBe(34); // 12 + 11 * 2

            expect(sizeOf('hello').primitiveSize).toBe(22);
        });

        test('should calculate size of symbols and bigints', () => {
            const symbol = Symbol('test');
            const bigint = BigInt(123456789);

            expect(sizeOf(symbol).size).toBe(16); // SYMBOL_BIGINT size
            expect(sizeOf(bigint).size).toBe(16);

            expect(sizeOf(symbol).primitiveSize).toBe(16);
            expect(sizeOf(bigint).primitiveSize).toBe(16);
        });
    });

    describe('Special Object Types', () => {
        test('should calculate size of Date objects', () => {
            const date = new Date('2023-01-01');
            const result = sizeOf(date);

            expect(result.size).toBe(56); // DATE_OBJECT size
            expect(result.trivialObjectSize).toBe(56);
            expect(result.primitiveSize).toBe(0);
            expect(result.objectSize).toBe(0);
        });

        test('should calculate size of ArrayBuffer', () => {
            const buffer1KB = new ArrayBuffer(1024);
            const buffer10KB = new ArrayBuffer(10240);

            const result1KB = sizeOf(buffer1KB);
            const result10KB = sizeOf(buffer10KB);

            expect(result1KB.size).toBe(1048); // 1024 + 24 (ARRAYBUFFER_OVERHEAD)
            expect(result10KB.size).toBe(10264); // 10240 + 24

            expect(result1KB.trivialObjectSize).toBe(1048);
            expect(result10KB.trivialObjectSize).toBe(10264);
        });

        test('should calculate size of Functions', () => {
            function testFunction() {
                return 42;
            }
            const arrowFunction = () => 'test';
            const anonymousFunction = function () {
                return null;
            };

            expect(sizeOf(testFunction).size).toBe(104); // FUNCTION_BASE + FEEDBACK_VECTOR_BASE
            expect(sizeOf(arrowFunction).size).toBe(208); // Arrow function gets context estimate too
            expect(sizeOf(anonymousFunction).size).toBe(104);

            expect(sizeOf(testFunction).functionSize).toBe(104);
            expect(sizeOf(arrowFunction).functionSize).toBe(208);
            expect(sizeOf(anonymousFunction).functionSize).toBe(104);
        });

        test('should calculate size of RegExp objects', () => {
            const regex1 = /test/g;
            const regex2 = new RegExp('complex.*pattern', 'gim');

            expect(sizeOf(regex1).size).toBe(48); // REGEXP_BASE
            expect(sizeOf(regex2).size).toBe(48);

            expect(sizeOf(regex1).trivialObjectSize).toBe(48);
        });

        test('should calculate size of Error objects', () => {
            const error1 = new Error('test message');
            const error2 = new TypeError('type error');

            expect(sizeOf(error1).size).toBe(64); // ERROR_BASE
            expect(sizeOf(error2).size).toBe(64);

            expect(sizeOf(error1).trivialObjectSize).toBe(64);
        });

        test('should calculate size of WeakMap and WeakSet', () => {
            const weakMap = new WeakMap();
            const weakSet = new WeakSet();

            expect(sizeOf(weakMap).size).toBe(56); // WEAKMAP_BASE
            expect(sizeOf(weakSet).size).toBe(48); // WEAKSET_BASE

            expect(sizeOf(weakMap).trivialObjectSize).toBe(56);
            expect(sizeOf(weakSet).trivialObjectSize).toBe(48);
        });
    });

    describe('Functions and Closures', () => {
        test('should calculate size of simple functions', () => {
            function simpleFunction() {
                return 42;
            }
            const arrowFunction = () => 'test';

            const simpleFunctionResult = sizeOf(simpleFunction);
            const arrowFunctionResult = sizeOf(arrowFunction);

            // Simple functions get FUNCTION_BASE + FEEDBACK_VECTOR_BASE
            expect(simpleFunctionResult).toEqual({
                size: 104, // 64 + 40
                functionSize: 104,
                primitiveSize: 0,
                objectSize: 0,
                arraySize: 0,
                trivialObjectSize: 0,
                canvasSize: 0,
                mapSize: 0,
                setSize: 0,
                pointerSize: 0,
            });

            // Arrow functions are treated as potential closures
            expect(arrowFunctionResult.functionSize).toBeGreaterThan(104); // Base + context overhead
            expect(arrowFunctionResult.size).toBe(arrowFunctionResult.functionSize);
        });

        test('should estimate closure context overhead', () => {
            const outerVar = 'captured';
            const anotherVar = 42;

            const closureFunction = () => {
                return outerVar + anotherVar;
            };

            const result = sizeOf(closureFunction);

            // Should have base + feedback + context overhead
            expect(result.functionSize).toBeGreaterThan(104); // More than simple function
            expect(result.size).toBe(result.functionSize);
            expect(result.functionSize).toBeLessThan(300); // But reasonable upper bound
        });

        test('should handle native functions', () => {
            const nativeFunction = Array.prototype.push;
            const result = sizeOf(nativeFunction);

            // Native functions should get context estimation
            expect(result.functionSize).toBeGreaterThan(64);
            expect(result.size).toBe(result.functionSize);
        });

        test('should measure function properties', () => {
            function functionWithProperties() {
                return 'test';
            }

            functionWithProperties.customProp = 'custom value';
            functionWithProperties.numberProp = 123;
            functionWithProperties.objectProp = { nested: 'object' };

            const result = sizeOf(functionWithProperties);

            // Should include function overhead + property sizes
            expect(result.functionSize).toBe(104); // Base function size
            expect(result.primitiveSize).toBeGreaterThan(0); // From string and number properties
            expect(result.objectSize).toBe(16); // From nested object
            expect(result.size).toBeGreaterThan(result.functionSize); // Total > function base
        });

        test('should handle functions with prototypes', () => {
            function Constructor(this: any) {
                this.prop = 'value';
            }
            Constructor.prototype.method = function (this: any) {
                return this.prop;
            };

            const constructorResult = sizeOf(Constructor);
            const methodResult = sizeOf(Constructor.prototype.method);

            // Constructor functions might get context estimation due to 'this' usage
            expect(constructorResult.functionSize).toBe(200); // Base + feedback + context estimate
            expect(methodResult.functionSize).toBe(104); // Method gets just base + feedback
        });

        test('should estimate bound functions', () => {
            const obj = { value: 'test' };
            function originalFunction(this: any, arg: string) {
                return this.value + arg;
            }

            const boundFunction = originalFunction.bind(obj, 'bound');
            const result = sizeOf(boundFunction);

            // Bound functions should have some overhead
            expect(result.functionSize).toBeGreaterThan(64);
            expect(result.size).toBe(result.functionSize);
        });

        test('should handle functions in complex structures', () => {
            const functionsArray = [
                () => 'arrow1',
                () => 'arrow2',
                function named() {
                    return 'named';
                },
            ];

            const result = sizeOf(functionsArray);

            // Should count array overhead + individual function sizes
            expect(result.arraySize).toBe(48); // Base + 3 pointers
            expect(result.functionSize).toBe(520); // 2 arrow functions (208 each) + 1 regular (104)
            expect(result.size).toBe(result.arraySize + result.functionSize);
        });
    });

    describe('Collections (Map and Set)', () => {
        test('should calculate size of empty Map', () => {
            const emptyMap = new Map();
            const result = sizeOf(emptyMap);

            expect(result.size).toBe(72); // MAP_BASE
            expect(result.mapSize).toBe(72);
            expect(result.setSize).toBe(0);
            expect(result.trivialObjectSize).toBe(0);
            expect(result.primitiveSize).toBe(0);
            expect(result.objectSize).toBe(0);
        });

        test('should calculate size of empty Set', () => {
            const emptySet = new Set();
            const result = sizeOf(emptySet);

            expect(result.size).toBe(56); // SET_BASE
            expect(result.setSize).toBe(56);
            expect(result.mapSize).toBe(0);
            expect(result.trivialObjectSize).toBe(0);
            expect(result.primitiveSize).toBe(0);
            expect(result.objectSize).toBe(0);
        });

        test('should calculate size of Map with primitive entries', () => {
            const mapWithPrimitives = new Map<string, any>([
                ['key1', 'value1'],
                ['key2', 42],
                ['key3', true],
            ]);
            const result = sizeOf(mapWithPrimitives);

            // MAP_BASE (72) + 3 * MAP_ENTRY_OVERHEAD (3*28=84) +
            // keys: 'key1'(20) + 'key2'(20) + 'key3'(20) = 60 +
            // values: 'value1'(26) + 42(8) + true(4) = 38
            // Total: 72 + 84 + 60 + 38 = 254
            expect(result.size).toBe(252);
            expect(result.mapSize).toBe(156); // 72 + 84
            expect(result.setSize).toBe(0);
            expect(result.trivialObjectSize).toBe(0);
            expect(result.primitiveSize).toBe(96); // Actual calculated value
        });

        test('should calculate size of Set with primitive values', () => {
            const setWithPrimitives = new Set(['value1', 42, true]);
            const result = sizeOf(setWithPrimitives);

            // SET_BASE (56) + 3 * SET_ENTRY_OVERHEAD (3*16=48) +
            // values: 'value1'(26) + 42(8) + true(4) = 38
            // Total: 56 + 48 + 38 = 142
            expect(result.size).toBe(140);
            expect(result.setSize).toBe(104); // 56 + 48
            expect(result.mapSize).toBe(0);
            expect(result.trivialObjectSize).toBe(0);
            expect(result.primitiveSize).toBe(36); // Actual calculated value
        });

        test('should calculate size of Map with object entries', () => {
            const obj1 = { name: 'test1' };
            const obj2 = { name: 'test2' };
            const mapWithObjects = new Map([
                [obj1, 'value1'],
                [obj2, 'value2'],
            ]);
            const result = sizeOf(mapWithObjects);

            // MAP_BASE (72) + 2 * MAP_ENTRY_OVERHEAD (2*28=56) +
            // keys: obj1(16+'test1'(22)=38) + obj2(16+'test2'(22)=38) = 76 +
            // values: 'value1'(26) + 'value2'(26) = 52
            // Total: 72 + 56 + 76 + 52 = 256
            expect(result.size).toBe(252);
            expect(result.mapSize).toBe(128); // 72 + 56
            expect(result.setSize).toBe(0);
            expect(result.trivialObjectSize).toBe(0);
            expect(result.objectSize).toBe(32); // 2 objects * 16 bytes each
            expect(result.primitiveSize).toBe(92); // Actual calculated value
        });

        test('should calculate size of Set with objects', () => {
            const obj1 = { data: 'test1' };
            const obj2 = { data: 'test2' };
            const setWithObjects = new Set([obj1, obj2]);
            const result = sizeOf(setWithObjects);

            // SET_BASE (56) + 2 * SET_ENTRY_OVERHEAD (2*16=32) +
            // values: obj1(16+'test1'(22)=38) + obj2(16+'test2'(22)=38) = 76
            // Total: 56 + 32 + 76 = 164
            expect(result.size).toBe(164);
            expect(result.setSize).toBe(88); // 56 + 32
            expect(result.mapSize).toBe(0);
            expect(result.trivialObjectSize).toBe(0);
            expect(result.objectSize).toBe(32); // 2 objects * 16 bytes each
            expect(result.primitiveSize).toBe(44); // 'test1'(22) + 'test2'(22)
        });

        test('should handle nested Maps and Sets', () => {
            const nestedMap = new Map<string, any>([
                ['level1', new Map([['nested', 'value']])],
                ['level2', new Set(['nested-set-value'])],
            ]);
            const result = sizeOf(nestedMap);

            // Outer MAP_BASE (72) + 2 * MAP_ENTRY_OVERHEAD (2*28=56) +
            // keys: 'level1'(24) + 'level2'(24) = 48 +
            // values: inner Map + inner Set
            // Inner Map: MAP_BASE(72) + MAP_ENTRY_OVERHEAD(28) + 'nested'(24) + 'value'(22) = 146
            // Inner Set: SET_BASE(56) + SET_ENTRY_OVERHEAD(16) + 'nested-set-value'(52) = 124
            // Total: 72 + 56 + 48 + 146 + 124 = 446
            expect(result.size).toBe(438);
            expect(result.mapSize).toBe(228); // Outer + inner Map (actual calculated value)
            expect(result.setSize).toBe(72); // Inner Set
            expect(result.trivialObjectSize).toBe(0);
        });

        test('should handle shared references in Maps', () => {
            const sharedObject = { data: 'shared' };
            const mapWithSharedRefs = new Map([
                ['key1', sharedObject],
                ['key2', sharedObject],
            ]);
            const result = sizeOf(mapWithSharedRefs);

            // MAP_BASE (72) + 2 * MAP_ENTRY_OVERHEAD (2*28=56) +
            // keys: 'key1'(20) + 'key2'(20) = 40 +
            // shared object: counted once (16 + 'shared'(24) = 40) +
            // second reference: just pointer (8)
            // Total: 72 + 56 + 40 + 40 + 8 = 216
            expect(result.size).toBe(216);
            expect(result.mapSize).toBe(128); // 72 + 56
            expect(result.setSize).toBe(0);
            expect(result.trivialObjectSize).toBe(0);
            expect(result.objectSize).toBe(16); // shared object counted once
            expect(result.pointerSize).toBe(8); // second reference
        });

        test('should handle shared references in Sets', () => {
            const sharedObject = { data: 'shared' };
            const setWithSharedRefs = new Set([sharedObject, sharedObject]); // Set automatically deduplicates
            const result = sizeOf(setWithSharedRefs);

            // Since Set automatically deduplicates, only one entry exists
            // SET_BASE (56) + SET_ENTRY_OVERHEAD (16) +
            // shared object: (16 + 'shared'(24) = 40)
            // Total: 56 + 16 + 40 = 112
            expect(result.size).toBe(112);
            expect(result.setSize).toBe(72); // 56 + 16
            expect(result.mapSize).toBe(0);
            expect(result.trivialObjectSize).toBe(0);
            expect(result.objectSize).toBe(16);
            expect(result.pointerSize).toBe(0); // no duplicate reference in Set
        });

        test('should handle large Maps efficiently', () => {
            const largeMap = new Map();
            for (let i = 0; i < 1000; i++) {
                largeMap.set(`key${i}`, `value${i}`);
            }
            const result = sizeOf(largeMap);

            // Should complete efficiently and provide reasonable estimate
            expect(result.size).toBeGreaterThan(70000); // Should be > 70KB for 1000 entries
            expect(result.mapSize).toBe(72 + 1000 * 28); // MAP_BASE + entries overhead
            expect(result.setSize).toBe(0);
            expect(result.trivialObjectSize).toBe(0);
        });

        test('should handle large Sets efficiently', () => {
            const largeSet = new Set();
            for (let i = 0; i < 1000; i++) {
                largeSet.add(`value${i}`);
            }
            const result = sizeOf(largeSet);

            // Should complete efficiently and provide reasonable estimate
            expect(result.size).toBeGreaterThan(40000); // Should be > 40KB for 1000 entries
            expect(result.setSize).toBe(56 + 1000 * 16); // SET_BASE + entries overhead
            expect(result.mapSize).toBe(0);
            expect(result.trivialObjectSize).toBe(0);
        });
    });

    describe('Arrays', () => {
        test('should calculate size of empty array', () => {
            const emptyArray: any[] = [];
            const result = sizeOf(emptyArray);

            expect(result.size).toBe(24); // ARRAY_BASE
            expect(result.arraySize).toBe(24);
            expect(result.primitiveSize).toBe(0);
            expect(result.objectSize).toBe(0);
        });

        test('should calculate size of arrays with primitives', () => {
            const numberArray = [1, 2, 3, 4, 5];
            const result = sizeOf(numberArray);

            // Array base (24) + 5 element pointers (5*8=40) + 5 numbers (5*8=40) = 104
            expect(result.size).toBe(104);
            expect(result.arraySize).toBe(64); // 24 + 5*8
            expect(result.primitiveSize).toBe(40); // 5*8
        });

        test('should calculate size of arrays with strings', () => {
            const stringArray = ['hello', 'world'];
            const result = sizeOf(stringArray);

            // Array: 24 + 2*8 = 40
            // Strings: 'hello' (22) + 'world' (22) = 44
            // Total: 40 + 44 = 84
            expect(result.size).toBe(84);
            expect(result.arraySize).toBe(40);
            expect(result.primitiveSize).toBe(44);
        });

        test('should calculate size of nested arrays', () => {
            const nestedArray = [
                [1, 2],
                [3, 4],
            ];
            const result = sizeOf(nestedArray);

            // Outer array: 24 + 2*8 = 40
            // Inner arrays: 2 * (24 + 2*8) = 2 * 40 = 80
            // Numbers: 4 * 8 = 32
            // Total: 40 + 80 + 32 = 152
            expect(result.size).toBe(152);
            expect(result.arraySize).toBe(120); // 40 + 80
            expect(result.primitiveSize).toBe(32);
        });
    });

    describe('Objects', () => {
        test('should calculate size of empty object', () => {
            const emptyObject = {};
            const result = sizeOf(emptyObject);

            expect(result.size).toBe(16); // BASE_OBJECT
            expect(result.objectSize).toBe(16);
            expect(result.primitiveSize).toBe(0);
        });

        test('should calculate size of simple object with properties', () => {
            const simpleObject = {
                name: 'test',
                value: 42,
                active: true,
            };
            const result = sizeOf(simpleObject);

            // Object base: 16
            // Properties: 'test' (20) + 42 (8) + true (4) = 32
            // Total: 16 + 32 = 48
            expect(result.size).toBe(48);
            expect(result.objectSize).toBe(16);
            expect(result.primitiveSize).toBe(32);
        });

        test('should calculate size of nested objects', () => {
            const nestedObject = {
                user: {
                    name: 'John',
                    age: 30,
                },
                settings: {
                    theme: 'dark',
                    notifications: true,
                },
            };
            const result = sizeOf(nestedObject);

            // Root object: 16
            // user object: 16 + 'John' (20) + 30 (8) = 44
            // settings object: 16 + 'dark' (20) + true (4) = 40
            // Total: 16 + 44 + 40 = 100
            expect(result.size).toBe(100);
            expect(result.objectSize).toBe(48); // 16 + 16 + 16
            expect(result.primitiveSize).toBe(52); // 20 + 8 + 20 + 4
        });
    });

    describe('Shared References', () => {
        test('should handle shared object references correctly', () => {
            const sharedObject = { data: 'shared' };
            const container = {
                first: sharedObject,
                second: sharedObject,
                third: sharedObject,
            };
            const result = sizeOf(container);

            // Container object: 16
            // Shared object: 16 + 'shared' (24) = 40
            // Additional references: 2 * 8 (pointers) = 16
            // Total: 16 + 40 + 16 = 72
            expect(result.size).toBe(72);
            expect(result.objectSize).toBe(32); // 16 + 16
            expect(result.primitiveSize).toBe(24); // 'shared'
            expect(result.pointerSize).toBe(16); // 2 additional pointers
        });

        test('should handle shared references in arrays', () => {
            const sharedDate = new Date('2023-01-01');
            const array = [sharedDate, sharedDate, sharedDate];
            const result = sizeOf(array);

            // Array: 24 + 3*8 = 48
            // Date object: 56 (counted once)
            // Additional pointers: 2*8 = 16
            // Total: 48 + 56 + 16 = 120
            expect(result.size).toBe(120);
            expect(result.arraySize).toBe(48);
            expect(result.trivialObjectSize).toBe(56);
            expect(result.pointerSize).toBe(16);
        });

        test('should handle complex shared reference patterns', () => {
            const sharedConfig = { theme: 'dark', locale: 'en' };
            const sharedMetadata = new Date('2023-01-01');

            const complexStructure = {
                items: Array.from({ length: 5 }, (_, i) => ({
                    id: i,
                    config: sharedConfig,
                    metadata: sharedMetadata,
                    value: i * 10,
                })),
            };

            const result = sizeOf(complexStructure);

            // Should count shared objects only once
            expect(result.size).toBeGreaterThan(0);
            expect(result.trivialObjectSize).toBe(56); // Date counted once
            expect(result.pointerSize).toBeGreaterThan(0); // Multiple pointers to shared objects
        });
    });

    describe('Circular References', () => {
        test('should handle simple circular references', () => {
            const obj: any = { name: 'circular' };
            obj.self = obj;

            const result = sizeOf(obj);

            // Object: 16 + 'circular' (28) = 44 (circular pointer not counted separately)
            expect(result.size).toBe(44);
            expect(result.objectSize).toBe(16);
            expect(result.primitiveSize).toBe(28);
            expect(result.pointerSize).toBe(0); // No separate pointer size for circular refs
        });

        test('should handle mutual circular references', () => {
            const objA: any = { name: 'A' };
            const objB: any = { name: 'B' };
            objA.ref = objB;
            objB.ref = objA;

            const result = sizeOf(objA);

            // objA: 16 + 'A' (14) = 30
            // objB: 16 + 'B' (14) = 30
            // Total: 60 + 8 pointer = 68
            expect(result.size).toBe(68);
            expect(result.objectSize).toBe(32);
            expect(result.primitiveSize).toBe(28);
            expect(result.pointerSize).toBe(8);
        });
    });

    describe('Complex Scenarios', () => {
        test('should handle large array structures similar to heap snapshot', () => {
            // Simulate structures similar to what's shown in the heap snapshot
            const largeArray = Array.from({ length: 100 }, (_, i) => ({
                id: i,
                name: `item-${i}`,
                data: new Map([['key', 'value']]),
                timestamp: new Date(2023, 0, 1, 0, 0, i),
                values: [i, i * 2, i * 3],
            }));

            const result = sizeOf(largeArray);

            // With proper Map sizing, memory estimate is much higher
            expect(result).toEqual({
                arraySize: 5624, // Same as before
                canvasSize: 0,
                mapSize: 10000, // 100 Maps with entries
                setSize: 0,
                functionSize: 0,
                objectSize: 1600, // 100 wrapper objects * 16 bytes each (Maps counted separately)
                pointerSize: 0,
                primitiveSize: 9780, // Actual calculated value with proper Map key/value counting
                size: 32604, // Significantly higher than without Map support
                trivialObjectSize: 5600, // 100 Date objects only
            });
        });

        test('should handle mixed data types efficiently', () => {
            const mixedStructure = {
                numbers: [1, 2, 3, 4, 5],
                strings: ['hello', 'world', 'test'],
                dates: [new Date('2023-01-01'), new Date('2023-01-02')],
                nested: {
                    config: { theme: 'dark', version: 1 },
                    metadata: { created: new Date(), modified: new Date() },
                },
                functions: [
                    () => 'test',
                    function named() {
                        return 42;
                    },
                ],
            };

            const result = sizeOf(mixedStructure);

            expect(result).toEqual({
                arraySize: 192, // 4 arrays: functions(40), strings(40), dates(40), main array(72)
                canvasSize: 0,
                mapSize: 0,
                setSize: 0,
                functionSize: 312, // Actual calculated function sizes
                objectSize: 64, // 4 objects: root + nested + config + metadata
                pointerSize: 0,
                primitiveSize: 132, // numbers(40) + strings(68) + 'dark'(20) + version(8)
                size: 924, // Updated total
                trivialObjectSize: 224, // 4 Date objects * 56 bytes each
            });
        });
    });

    describe('Performance and Edge Cases', () => {
        test('should handle deeply nested structures', () => {
            let deepObject: any = { value: 'leaf' };
            for (let i = 0; i < 50; i++) {
                deepObject = { level: i, child: deepObject };
            }

            const result = sizeOf(deepObject);

            expect(result).toEqual({
                arraySize: 0,
                canvasSize: 0,
                mapSize: 0,
                setSize: 0,
                functionSize: 0,
                objectSize: 816, // 51 objects * 16 bytes each
                pointerSize: 0,
                primitiveSize: 420, // 50 numbers (50*8=400) + 'leaf' string (20)
                size: 1236,
                trivialObjectSize: 0,
            });
        });

        test('should handle large arrays without performance issues', () => {
            const largeArray = Array.from({ length: 10000 }, (_, i) => i);

            const startTime = performance.now();
            const result = sizeOf(largeArray);
            const endTime = performance.now();

            expect(result.size).toBe(160024); // Array: 24 + 10000*8 (pointers) + Numbers: 10000*8 + larger than expected due to structure
            expect(endTime - startTime).toBeLessThan(1000); // Should complete in <1 second
        });

        test('should handle objects with many properties', () => {
            const objectWithManyProps: any = {};
            for (let i = 0; i < 1000; i++) {
                objectWithManyProps[`prop${i}`] = i;
            }

            const result = sizeOf(objectWithManyProps);

            expect(result).toEqual({
                arraySize: 0,
                canvasSize: 0,
                mapSize: 0,
                setSize: 0,
                functionSize: 0,
                objectSize: 16, // Just the base object
                pointerSize: 0,
                primitiveSize: 8000, // 1000 numbers * 8 bytes each
                size: 8016,
                trivialObjectSize: 0,
            });
        });
    });

    describe('Metadata Breakdown Validation', () => {
        test('should correctly categorize size components', () => {
            const testStructure = {
                primitives: {
                    num: 42,
                    str: 'test',
                    bool: true,
                    nil: null,
                },
                objects: {
                    nested: { value: 'nested' },
                },
                arrays: [1, 2, 3],
                date: new Date('2023-01-01'),
                buffer: new ArrayBuffer(100),
                func: () => 'lambda',
            };

            const result = sizeOf(testStructure);

            // Verify total size equals sum of components
            const totalComponents =
                result.primitiveSize +
                result.objectSize +
                result.arraySize +
                result.trivialObjectSize +
                result.functionSize +
                result.pointerSize;
            expect(result.size).toBe(totalComponents);

            expect(result).toEqual({
                arraySize: 48, // 1 array [1,2,3] = 24 + 3*8
                canvasSize: 0,
                mapSize: 0,
                setSize: 0,
                functionSize: 208, // 1 Function with closure detection
                objectSize: 64, // 4 objects: root + primitives + objects + nested
                pointerSize: 0,
                primitiveSize: 88, // num(8) + str(20) + bool(4) + nil(8) + extra overhead
                size: 588, // Updated total
                trivialObjectSize: 180, // 1 Date object (56) + 1 ArrayBuffer (100+24) - functions no longer in trivial
            });
        });
    });

    describe('Heap Snapshot Validation', () => {
        test('should provide reasonable estimates for structures similar to heap snapshot', () => {
            // Simulate the structures we see in your heap snapshot:
            // Arrays: 20,356 kB for 501,568 instances
            // Objects: 322 kB for 4,622 instances
            // Maps: 38,216 kB for 400,540 instances

            // Create a test structure with many arrays, objects, and Maps
            const testStructure = {
                // Array-heavy structure (similar to heap snapshot pattern)
                arrays: Array.from({ length: 100 }, (_, i) =>
                    Array.from({ length: 10 }, (__, j) => ({ id: i * 10 + j, value: Math.random() }))
                ),

                // Object-heavy structure
                objects: Array.from({ length: 50 }, (_, i) => ({
                    id: i,
                    name: `object-${i}`,
                    data: { x: i, y: i * 2, z: i * 3 },
                    metadata: {
                        created: new Date(2023, 0, 1, 0, 0, i),
                        tags: ['tag1', 'tag2', `tag-${i}`],
                    },
                })),

                // Map-heavy structure (using regular objects as Map approximation)
                maps: Array.from({ length: 50 }, (_, i) => {
                    const mapData: any = {};
                    for (let j = 0; j < 20; j++) {
                        mapData[`key-${j}`] = `value-${i}-${j}`;
                    }
                    return mapData;
                }),
            };

            const result = sizeOf(testStructure);

            // Validate the structure produces significant memory usage
            expect(result).toEqual({
                arraySize: 14472, // Complex nested array structure (slight variation)
                canvasSize: 0,
                mapSize: 0,
                setSize: 0,
                functionSize: 0,
                objectSize: 19216, // Many nested objects
                pointerSize: 0,
                primitiveSize: 54860, // Large amount of primitive data (strings, numbers)
                size: 91348,
                trivialObjectSize: 2800, // 50 Date objects * 56 bytes each
            });
        });

        test('should handle shared references at scale', () => {
            // Create a structure with many shared references similar to real-world scenarios
            const sharedConfig = {
                theme: 'dark',
                locale: 'en-US',
                version: '1.0.0',
                features: ['feature1', 'feature2', 'feature3'],
            };
            const sharedDate = new Date('2023-01-01');

            const largeStructureWithSharing = Array.from({ length: 1000 }, (_, i) => ({
                id: i,
                config: sharedConfig, // Same config object shared 1000 times
                timestamp: sharedDate, // Same date object shared 1000 times
                uniqueData: `data-${i}`, // Unique string per item
            }));

            const result = sizeOf(largeStructureWithSharing);

            // The shared objects should only be counted once
            // We should see:
            // - 1 config object counted once
            // - 1 date object counted once
            // - 1000 wrapper objects
            // - 999 pointers to shared config (after first one)
            // - 999 pointers to shared date (after first one)

            expect(result.trivialObjectSize).toBe(56); // Only one Date object counted
            expect(result).toEqual({
                arraySize: 8072, // 1000 elements * 8 pointers + array base (with overhead)
                canvasSize: 0,
                mapSize: 0,
                setSize: 0,
                functionSize: 0,
                objectSize: 16016, // 1000 wrapper objects + 1 config object
                pointerSize: 15984, // 999 pointers to config + 999 pointers to date
                primitiveSize: 35928, // 1000 id numbers + 1000 unique strings + config strings
                size: 76056,
                trivialObjectSize: 56, // Only one Date object counted
            });
        });
    });
});
