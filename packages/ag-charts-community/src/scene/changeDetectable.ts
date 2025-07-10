import { arraysEqual } from 'ag-charts-core';

type Target = { [K in string]: any } & { onChangeDetection(key: string): void };

type SceneChangeDetectionOptions<T = any> = {
    convertor?: (o: any) => any;
    changeCb?: (o: T) => any;
    checkDirtyOnAssignment?: boolean;
    equals?: (newValue: T, oldValue: T) => boolean;
};

type SceneObjectChangeDetectionOptions<T = any> = {
    convertor?: (o: any) => any;
    changeCb?: (o: T) => any;
    checkDirtyOnAssignment?: boolean;
    equals: (newValue: T, oldValue: T) => boolean;
};

type SceneArrayChangeDetectionOptions<T = any> = {
    convertor?: (o: any) => any;
    changeCb?: (o: T) => any;
    checkDirtyOnAssignment?: boolean;
    equals?: never;
};

type SetterFunction = (this: Target, value: any) => void;

export const TRIPLE_EQ = (lhs: unknown, rhs: unknown) => lhs === rhs;

export function SceneChangeDetection<T extends Target = any>(opts?: SceneChangeDetectionOptions) {
    return function (target: T, key: string) {
        if (target[key as keyof T]) {
            return;
        }

        prepareGetSet(target, key, opts);
    };
}

export function SceneObjectChangeDetection<T extends Target = any>(opts: SceneObjectChangeDetectionOptions) {
    return SceneChangeDetection<T>(opts);
}

export function SceneArrayChangeDetection<T extends Target = any>(opts?: SceneArrayChangeDetectionOptions) {
    const baseOpts: SceneChangeDetectionOptions = opts ?? {};
    baseOpts.equals = arraysEqual;
    return SceneChangeDetection<T>(opts);
}

const ACCESSORS_KEY = '__change_detectable_decorator_accessors';

function prepareGetSet(target: any, key: string, opts?: SceneChangeDetectionOptions) {
    const { changeCb, convertor, checkDirtyOnAssignment = false, equals } = opts ?? {};
    if (Object.getOwnPropertyDescriptor(target, ACCESSORS_KEY) == null) {
        const parentAccessors: (string | symbol)[] | undefined = Object.getPrototypeOf(target)?.[ACCESSORS_KEY];
        const accessors = parentAccessors?.slice() ?? [];
        Object.defineProperty(target, ACCESSORS_KEY, { value: accessors });
    }

    const accessors: any[] = target[ACCESSORS_KEY];
    let index = accessors.indexOf(key);
    if (index === -1) {
        index = accessors.push(key) - 1;
    }

    // Select the correctly optimized setter with minimal branches/checks for the specific type
    // of change detection.
    let setter: SetterFunction;
    if (equals == null && convertor == null && changeCb == null && checkDirtyOnAssignment == null) {
        setter = function (this: Target, value: unknown) {
            let accessorValues = this.__changeDetectableAccessors;
            if (accessorValues == null) {
                accessorValues = accessors.slice().fill(undefined);
                Object.defineProperty(this, '__changeDetectableAccessors', { value: accessorValues });
            }

            const oldValue = accessorValues[index];
            if (value === oldValue) return;

            accessorValues[index] = value;
            this.onChangeDetection(key);
        };
    } else {
        setter = function (this: Target, baseValue: unknown) {
            let accessorValues = this.__changeDetectableAccessors;
            if (accessorValues == null) {
                accessorValues = accessors.slice().fill(undefined);
                Object.defineProperty(this, '__changeDetectableAccessors', { value: accessorValues });
            }

            const value = convertor == null ? baseValue : convertor(baseValue);
            const oldValue = accessorValues[index];
            let didChange: boolean;
            if (checkDirtyOnAssignment) {
                didChange =
                    /* Object reference changed */ value !== oldValue ||
                    /* Object became dirty */ value?._dirty === true;
            } else {
                didChange = equals == null ? value !== oldValue : oldValue == null || !equals(value, oldValue);
            }
            if (!didChange) return;

            accessorValues[index] = value;
            this.onChangeDetection(key);

            changeCb?.call(this, this);
        };
    }

    const getter = function (this: any) {
        let accessorValues = this.__changeDetectableAccessors;
        if (accessorValues == null) {
            accessorValues = accessors.slice().fill(undefined);
            Object.defineProperty(this, '__changeDetectableAccessors', { value: accessorValues });
        }
        return accessorValues[index];
    };

    Object.defineProperty(target, key, {
        set: setter as (v: unknown) => void,
        get: getter,
        enumerable: true,
        configurable: true,
    });
}
