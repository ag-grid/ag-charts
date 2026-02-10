export interface ArrayView<T> extends ArrayLike<T>, Iterable<T> {
    at(index: number): T | undefined;
    map<U>(callbackfn: (value: T, index: number, array: ArrayView<T>) => U, thisArg?: any): ArrayView<U>;
}

export interface ArrayViewSource<T> {
    readonly length: number;
    at(index: number): T | undefined;
}

export function makeJITArrayView<T>(arrayLike: ArrayViewSource<T>): ArrayView<T> {
    const impl: ArrayView<T> = Object.freeze({
        get length() {
            return arrayLike.length;
        },

        at(index: number) {
            const reverseIndexing: number = Number(index < 0) * arrayLike.length;
            return arrayLike.at(index + reverseIndexing);
        },

        map<U>(callbackfn: (value: T, index: number, array: ArrayView<T>) => U, thisArg?: any): ArrayView<U> {
            return makeJITArrayView<U>({
                length: arrayLike.length,
                at: (i: number) => {
                    const v = impl.at(i);
                    if (v === undefined) return undefined;
                    return callbackfn.call(thisArg, v, i, impl);
                },
            });
        },

        *[Symbol.iterator](): IterableIterator<T> {
            for (let index = 0; index < arrayLike.length; index++) {
                yield arrayLike.at(index)!;
            }
        }
    });

    return new Proxy(impl, {
        get(target, prop, receiver) {
            // Numeric index access: obj[123]
            if (typeof prop === 'string' && /^\d+$/.test(prop)) {
                return target.at(Number(prop));
            }

            return Reflect.get(target, prop, receiver);
        },
    });
}
