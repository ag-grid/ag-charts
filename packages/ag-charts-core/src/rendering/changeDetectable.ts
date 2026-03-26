import { arraysEqual } from '../utils/data/arrays';

type Target = { [K in string]: any } & { onChangeDetection(privateKey: string): void };

interface SceneChangeDetectionOptions<T = any> {
    convertor?: (o: any) => any;
    changeCb?: (o: T) => any;
    checkDirtyOnAssignment?: boolean;
    equals?: (newValue: T, oldValue: T) => boolean;
}

interface SceneObjectChangeDetectionOptions<T = any> {
    convertor?: (o: any) => any;
    changeCb?: (o: T) => any;
    checkDirtyOnAssignment?: boolean;
    equals: (newValue: T, oldValue: T) => boolean;
}

interface SceneArrayChangeDetectionOptions<T = any> {
    convertor?: (o: any) => any;
    changeCb?: (o: T) => any;
    checkDirtyOnAssignment?: boolean;
    equals?: never;
}

export const TRIPLE_EQ = (lhs: unknown, rhs: unknown) => lhs === rhs;

export function SceneChangeDetection<T extends Target = any>(opts?: SceneChangeDetectionOptions) {
    return function (target: T, key: string) {
        // `target` is either a constructor (static member) or prototype (instance member)
        const privateKey = `__${key}`;
        if (target[key as keyof T]) return;
        prepareGetSet(target, key, privateKey, opts);
    };
}

export function SceneRefChangeDetection<T extends Target = any>(opts?: SceneChangeDetectionOptions) {
    return SceneChangeDetection<T>(opts);
}

export function SceneObjectChangeDetection<T extends Target = any>(opts: SceneObjectChangeDetectionOptions) {
    return SceneChangeDetection<T>(opts);
}

export function SceneArrayChangeDetection<T extends Target = any>(opts?: SceneArrayChangeDetectionOptions) {
    const baseOpts: SceneChangeDetectionOptions = opts ?? {};
    baseOpts.equals = arraysEqual;
    return SceneChangeDetection<T>(opts);
}

export function DeclaredSceneChangeDetection<V>(opts?: SceneChangeDetectionOptions) {
    return function <K extends string, T extends Target & { [P in `__${K}`]: V }>(target: T, key: K): void {
        const privateKey = `__${key}`;
        if (target[key as keyof T]) return;
        prepareGetSet(target, key, privateKey, opts);
    };
}

// eslint-disable-next-line sonarjs/no-identical-functions
export function DeclaredSceneObjectChangeDetection<V>(opts?: SceneObjectChangeDetectionOptions) {
    return function <K extends string, T extends Target & { [P in `__${K}`]: V }>(target: T, key: K): void {
        const privateKey = `__${key}`;
        if (target[key as keyof T]) return;
        prepareGetSet(target, key, privateKey, opts);
    };
}

function prepareGetSet(target: any, key: string, privateKey: string, opts?: SceneChangeDetectionOptions) {
    const { changeCb, convertor, checkDirtyOnAssignment = false } = opts ?? {};
    const requiredOpts = { changeCb, checkDirtyOnAssignment, convertor };

    // Select the correctly optimized setter with minimal branches/checks for the specific type
    // of change detection.
    const setter = buildCheckDirtyChain(
        privateKey,
        buildChangeCallbackChain(
            buildConvertorChain(buildSetter(privateKey, requiredOpts), requiredOpts),
            requiredOpts
        ),
        requiredOpts
    );

    function propertyGetter(this: any) {
        return this[privateKey];
    }

    Object.defineProperty(target, key, {
        set: setter as (v: unknown) => void,
        get: propertyGetter,
        enumerable: true,
        configurable: true,
    });
}

function buildConvertorChain(setterFn: Function, opts: SceneChangeDetectionOptions) {
    const { convertor } = opts;
    if (convertor) {
        const convertValue = convertor;
        function convertValueAndSet(this: any, value: unknown) {
            setterFn.call(this, convertValue(value));
        }
        return convertValueAndSet;
    }

    return setterFn;
}

const NO_CHANGE = Symbol('no-change');

function buildChangeCallbackChain(setterFn: Function, opts: SceneChangeDetectionOptions) {
    const { changeCb } = opts;
    if (changeCb) {
        const changeCallback = changeCb;
        function invokeChangeCallback(this: any, value: unknown) {
            const change = setterFn.call(this, value);
            if (change !== NO_CHANGE) {
                changeCallback.call(this, this);
            }
            return change;
        }
        return invokeChangeCallback;
    }

    return setterFn;
}

function buildCheckDirtyChain(privateKey: string, setterFn: Function, opts: SceneChangeDetectionOptions) {
    const { checkDirtyOnAssignment } = opts;
    if (checkDirtyOnAssignment) {
        function checkDirtyOnAssignmentFn(this: any, value: undefined | { _dirty: boolean }) {
            const change = setterFn.call(this, value);

            if (value?._dirty === true) {
                this.markDirty(privateKey);
            }

            return change;
        }
        return checkDirtyOnAssignmentFn;
    }

    return setterFn;
}

function buildSetter(privateKey: string, opts: SceneChangeDetectionOptions) {
    const { equals = TRIPLE_EQ } = opts;
    function setWithChangeDetection(this: Target, value: unknown) {
        const oldValue = this[privateKey];
        if (!equals(value, oldValue)) {
            this[privateKey] = value;
            this.onChangeDetection(privateKey);
            return value;
        }

        return NO_CHANGE;
    }

    return setWithChangeDetection;
}
