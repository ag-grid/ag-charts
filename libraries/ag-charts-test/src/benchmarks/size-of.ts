// import { Canvas } from 'skia-canvas'; // Optional import for Canvas support

const SIZE = {
    // Primitive types
    POINTER: 8,
    BOOLEAN: 4,
    NUMBER: 8,
    SYMBOL_BIGINT: 16,

    // String overhead (V8 optimized)
    STRING_OVERHEAD: 12,
    STRING_CHAR_SIZE: 2, // UTF-16

    // Object overhead (V8 optimized estimates)
    BASE_OBJECT: 16,
    PROPERTY_SLOT: 2, // V8 is more efficient
    PROPERTY_NAME_OVERHEAD: 4, // Reduced from 8

    // Array overhead
    ARRAY_BASE: 24,
    ARRAY_ELEMENT_POINTER: 8,

    // Special object types
    FUNCTION_BASE: 64,
    DATE_OBJECT: 56,
    ARRAYBUFFER_OVERHEAD: 24,
    TYPEARRAY_OVERHEAD: 24,
    TYPEARRAY_DEFAULT_ELEMENT_SIZE: 4, // Default bytes per element for typed arrays without byteLength
    CANVAS_BASE: 1000,
    CANVAS_BYTES_PER_PIXEL: 4,

    // Function context and closure overhead (V8 estimates)
    FUNCTION_CONTEXT_BASE: 80, // Base Context object for closures
    CONTEXT_VARIABLE_SLOT: 8, // Per captured variable reference
    FEEDBACK_VECTOR_BASE: 40, // Optimization feedback data (conservative estimate)

    // Map/Set collection types
    MAP_BASE: 72, // Base Map object overhead in V8
    MAP_ENTRY_OVERHEAD: 28, // Per entry overhead in Map (entry slot + pointers)
    SET_BASE: 56, // Base Set object overhead in V8
    SET_ENTRY_OVERHEAD: 16, // Per entry overhead in Set (entry slot + pointer)

    // Other built-in types
    REGEXP_BASE: 48, // RegExp object overhead
    ERROR_BASE: 64, // Error object overhead
    WEAKMAP_BASE: 56, // WeakMap base (unmeasurable entries)
    WEAKSET_BASE: 48, // WeakSet base (unmeasurable entries)

    // Fallback estimates
    PROPERTY_ACCESS_ERROR: 32,
    OBJECT_ACCESS_ERROR: 100,

    // Size thresholds
    LARGEST_OBJECT_THRESHOLD: 1024, // 1KB
};

export interface SizeMetadata {
    size: number;
    pointerSize: number;
    primitiveSize: number;
    trivialObjectSize: number;
    arraySize: number;
    objectSize: number;
    canvasSize: number;
    mapSize: number;
    setSize: number;
    functionSize: number;
}

const EMPTY_SIZE_METADATA: SizeMetadata = {
    size: 0,
    pointerSize: 0,
    primitiveSize: 0,
    trivialObjectSize: 0,
    arraySize: 0,
    objectSize: 0,
    canvasSize: 0,
    mapSize: 0,
    setSize: 0,
    functionSize: 0,
};

function shouldSkipProperty(key: string): boolean {
    // Skip constructor to avoid traversing the prototype chain
    if (key === 'constructor') return true;

    // Skip __proto__ to avoid prototype chain
    if (key === '__proto__') return true;

    // Skip some common circular references
    return key === 'window' || key === 'global' || key === 'self';
}

function combineSizeMetadata(acc: SizeMetadata, item: SizeMetadata): SizeMetadata {
    acc.size += item.size;
    acc.primitiveSize += item.primitiveSize;
    acc.pointerSize += item.pointerSize;
    acc.trivialObjectSize += item.trivialObjectSize;
    acc.arraySize += item.arraySize;
    acc.objectSize += item.objectSize;
    acc.canvasSize += item.canvasSize;
    acc.mapSize += item.mapSize;
    acc.setSize += item.setSize;
    acc.functionSize += item.functionSize;
    return acc;
}

export function sizeOf(obj: unknown): SizeMetadata {
    const visited = new Set<unknown>();

    try {
        return calculateSizeOf(obj, visited);
    } finally {
        visited.clear();
    }
}

export function calculateSizeOf(obj: unknown, visited = new Set<unknown>(), path = ''): SizeMetadata {
    if (visited.has(obj)) {
        return {
            ...EMPTY_SIZE_METADATA,
            size: SIZE.POINTER,
            pointerSize: SIZE.POINTER,
        };
    }

    const primitiveSize = calculatePrimitiveSize(obj);
    if (primitiveSize !== undefined) {
        return {
            ...EMPTY_SIZE_METADATA,
            size: primitiveSize,
            primitiveSize,
        };
    }

    visited.add(obj);

    const trivialObjectSize = calculateTrivialObjectSize(obj);
    if (trivialObjectSize !== undefined) {
        return {
            ...EMPTY_SIZE_METADATA,
            size: trivialObjectSize,
            trivialObjectSize,
        };
    }

    const canvasSize = calculateCanvasSize(obj);
    if (canvasSize !== undefined) {
        return {
            ...EMPTY_SIZE_METADATA,
            size: canvasSize,
            canvasSize,
        };
    }

    if (obj instanceof Map) {
        const baseSize = {
            ...EMPTY_SIZE_METADATA,
            size: SIZE.MAP_BASE,
            mapSize: SIZE.MAP_BASE,
        };
        return Array.from(obj.entries()).reduce((acc, [key, value], index) => {
            const entryOverhead = {
                ...EMPTY_SIZE_METADATA,
                size: SIZE.MAP_ENTRY_OVERHEAD,
                mapSize: SIZE.MAP_ENTRY_OVERHEAD,
            };
            const keySize = calculateSizeOf(key, visited, `${path}.key[${index}]`);
            const valueSize = calculateSizeOf(value, visited, `${path}.value[${index}]`);
            return combineSizeMetadata(
                combineSizeMetadata(combineSizeMetadata(acc, entryOverhead), keySize),
                valueSize
            );
        }, baseSize);
    }

    if (obj instanceof Set) {
        const baseSize = {
            ...EMPTY_SIZE_METADATA,
            size: SIZE.SET_BASE,
            setSize: SIZE.SET_BASE,
        };
        return Array.from(obj.values()).reduce((acc, value, index) => {
            const entryOverhead = {
                ...EMPTY_SIZE_METADATA,
                size: SIZE.SET_ENTRY_OVERHEAD,
                setSize: SIZE.SET_ENTRY_OVERHEAD,
            };
            const valueSize = calculateSizeOf(value, visited, `${path}.value[${index}]`);
            return combineSizeMetadata(combineSizeMetadata(acc, entryOverhead), valueSize);
        }, baseSize);
    }

    if (typeof obj === 'function') {
        return guesstimateFunctionSize(obj, visited, path);
    }

    if (obj instanceof Array) {
        const baseSize = {
            ...EMPTY_SIZE_METADATA,
            size: SIZE.ARRAY_BASE + obj.length * SIZE.ARRAY_ELEMENT_POINTER,
            arraySize: SIZE.ARRAY_BASE + obj.length * SIZE.ARRAY_ELEMENT_POINTER,
        };
        return obj.reduce((acc, item, index) => {
            return combineSizeMetadata(acc, calculateSizeOf(item, visited, `${path}[${index}]`));
        }, baseSize);
    }

    if (typeof obj === 'object' && obj !== null) {
        const baseSize = {
            ...EMPTY_SIZE_METADATA,
            size: SIZE.BASE_OBJECT,
            objectSize: SIZE.BASE_OBJECT,
        };

        return [...getAllPropertyNames(obj)].reduce((acc, key) => {
            if (shouldSkipProperty(key)) return acc;

            const size = calculateSizeOf((obj as any)[key], visited, `${path}.${key}`);
            return combineSizeMetadata(acc, size);
        }, baseSize);
    }

    return {
        ...EMPTY_SIZE_METADATA,
        size: SIZE.POINTER,
        pointerSize: SIZE.POINTER,
    };
}

function calculatePrimitiveSize(value: unknown) {
    const valueType = typeof value;

    if (value === null || value === undefined) {
        return SIZE.POINTER;
    }

    if (valueType === 'boolean') {
        return SIZE.BOOLEAN;
    }

    if (valueType === 'number') {
        return SIZE.NUMBER;
    }

    if (typeof value === 'string') {
        // For primitive calculations without state context, use basic V8 estimation
        return value.length * SIZE.STRING_CHAR_SIZE + SIZE.STRING_OVERHEAD;
    }

    if (valueType === 'symbol' || valueType === 'bigint') {
        return SIZE.SYMBOL_BIGINT;
    }

    return undefined;
}

/**
 * Enhanced function size calculation that attempts to estimate closure context and optimization overhead.
 *
 * V8 Function Memory Components:
 * 1. JSFunction object (~64 bytes) - the function instance
 * 2. SharedFunctionInfo - shared bytecode/metadata (amortized across instances)
 * 3. FeedbackVector (~40 bytes) - optimization data, lazily allocated
 * 4. Context object (~80+ bytes) - closure-captured variables
 * 5. Function properties - user-added properties
 *
 * Limitations:
 * - Cannot directly access Context objects from JavaScript
 * - Cannot measure actual size of captured variables (only estimate count)
 * - Cannot detect shared contexts between multiple closures
 * - Native functions and optimized code may not reveal closure patterns
 * - SharedFunctionInfo is shared, so we don't include it in per-instance calculations
 */
function guesstimateFunctionSize(fn: Function, visited: Set<unknown>, path: string): SizeMetadata {
    let totalSize = SIZE.FUNCTION_BASE;
    let functionSpecificSize = SIZE.FUNCTION_BASE;

    try {
        const fnString = fn.toString();
        const isNative = fnString.includes('[native code]');

        // Detect potential closure context
        let hasContext = false;
        let estimatedCapturedVars = 0;

        if (isNative) {
            // Native functions likely have some internal state/context
            hasContext = true;
            estimatedCapturedVars = 2; // Conservative estimate
        } else {
            // Heuristic closure detection:
            // - Function references variables that aren't parameters
            // - Arrow functions are more likely to be closures
            // - Functions with short bodies but external references
            const isArrow = !fnString.includes('function') && fnString.includes('=>');
            const hasExternalRefs =
                /\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g.test(fnString) && !fnString.includes('return') && fnString.length < 200; // Short functions more likely to be closures

            if (isArrow || hasExternalRefs) {
                hasContext = true;
                // Rough estimate: assume 2-4 captured variables for typical closures
                estimatedCapturedVars = isArrow ? 3 : 2;
            }
        }

        // Add context overhead if closure detected
        if (hasContext) {
            const contextSize = SIZE.FUNCTION_CONTEXT_BASE + estimatedCapturedVars * SIZE.CONTEXT_VARIABLE_SLOT;
            totalSize += contextSize;
            functionSpecificSize += contextSize;
        }

        // Add feedback vector for functions that likely have optimization data
        // Heuristic: functions with prototypes or constructors are more likely optimized
        if (fn.prototype !== undefined || fn.constructor === Function) {
            totalSize += SIZE.FEEDBACK_VECTOR_BASE;
            functionSpecificSize += SIZE.FEEDBACK_VECTOR_BASE;
        }
    } catch {
        // If toString() fails or other issues, use conservative estimate
        totalSize = SIZE.FUNCTION_BASE + SIZE.FUNCTION_CONTEXT_BASE + SIZE.FEEDBACK_VECTOR_BASE;
        functionSpecificSize = totalSize;
    }

    // Create base size metadata
    const baseSize: SizeMetadata = {
        ...EMPTY_SIZE_METADATA,
        size: totalSize,
        functionSize: functionSpecificSize,
    };

    // Recursively measure user-added properties on the function object
    const propertyNames = getAllPropertyNames(fn as any);
    return [...propertyNames].reduce((acc, key) => {
        if (
            shouldSkipProperty(key) ||
            key === 'prototype' ||
            key === 'constructor' ||
            key === 'length' ||
            key === 'name'
        ) {
            return acc;
        }

        try {
            const propertySize = calculateSizeOf((fn as any)[key], visited, `${path}.${key}`);
            return combineSizeMetadata(acc, propertySize);
        } catch {
            // Skip properties that can't be accessed
            return acc;
        }
    }, baseSize);
}

function calculateTrivialObjectSize(value: unknown) {
    if (value instanceof Date) {
        return SIZE.DATE_OBJECT;
    }

    if (value instanceof ArrayBuffer) {
        return value.byteLength + SIZE.ARRAYBUFFER_OVERHEAD;
    }

    if (ArrayBuffer.isView(value)) {
        return (
            (value.byteLength || (value as any).length * SIZE.TYPEARRAY_DEFAULT_ELEMENT_SIZE) + SIZE.TYPEARRAY_OVERHEAD
        );
    }

    if (value instanceof RegExp) {
        // RegExp has pattern string + flags, but we use fixed estimate
        return SIZE.REGEXP_BASE;
    }

    if (value instanceof Error) {
        // Error has message, stack, name, but we use fixed estimate for base overhead
        return SIZE.ERROR_BASE;
    }

    if (value instanceof WeakMap) {
        // WeakMap entries can't be measured (not enumerable), only base size
        return SIZE.WEAKMAP_BASE;
    }

    if (value instanceof WeakSet) {
        // WeakSet values can't be measured (not enumerable), only base size
        return SIZE.WEAKSET_BASE;
    }

    return undefined;
}

function calculateCanvasSize(value: unknown) {
    // Check for Canvas-like objects without relying on instanceof
    if (
        value &&
        typeof value === 'object' &&
        'width' in value &&
        'height' in value &&
        typeof (value as any).width === 'number' &&
        typeof (value as any).height === 'number' &&
        (value.constructor?.name === 'Canvas' || value.constructor?.name?.includes('Canvas'))
    ) {
        const canvas = value as any;
        return SIZE.CANVAS_BASE + canvas.width * canvas.height * SIZE.CANVAS_BYTES_PER_PIXEL;
    }

    return undefined;
}

function getAllPropertyNames(obj: object): Set<string> {
    const allPropertyNames = new Set<string>();

    // Add enumerable properties
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            allPropertyNames.add(key);
        }
    }

    // Add non-enumerable own properties
    try {
        const ownPropertyNames = Object.getOwnPropertyNames(obj);
        for (const key of ownPropertyNames) {
            allPropertyNames.add(key);
        }
    } catch {
        // Some objects may not allow property enumeration
    }

    return allPropertyNames;
}
