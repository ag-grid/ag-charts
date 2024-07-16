interface DebounceOptions {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
}
interface ThrottleOptions {
    leading?: boolean;
    trailing?: boolean;
}
/**
 * If the key was passed before, then doesn't execute the func
 */
export declare function doOnce(func: () => void, key: string): void;
export declare namespace doOnce {
    var clear: () => void;
}
export declare function identity<T>(x: T): T;
export declare function iterate<T extends Iterable<any>[]>(...iterators: T): Generator<T[number] extends Iterable<infer U> ? U : never, void, undefined>;
export declare function iterateReverseArray<T extends any[]>(array: T): Generator<T[number] extends Iterable<infer U> ? U : never, void, undefined>;
export declare function debounce<T extends (...args: Parameters<T>) => void>(callback: T, waitMs?: number, options?: DebounceOptions): ((...args: Parameters<T>) => void) & {
    cancel(): void;
};
export declare function throttle<T extends (...args: Parameters<T>) => void>(callback: T, waitMs?: number, options?: ThrottleOptions): ((...args: Parameters<T>) => void) & {
    cancel(): void;
};
export declare function joinFunctions(...fns: (() => void)[]): () => void;
export {};
