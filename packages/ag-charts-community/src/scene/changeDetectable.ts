type Target = { [K in string]: any } & { onChangeDetection(privateKey: string): void };

type SceneChangeDetectionOptions<T = any> = {
    type?: 'normal' | 'path';
    convertor?: (o: any) => any;
    changeCb?: (o: T) => any;
    checkDirtyOnAssignment?: boolean;
};

export function SceneChangeDetection<T extends Target = any>(opts?: SceneChangeDetectionOptions) {
    return function (target: T, key: string) {
        // `target` is either a constructor (static member) or prototype (instance member)
        const privateKey = `__${key}`;

        if (target[key as keyof T]) {
            return;
        }

        prepareGetSet(target, key, privateKey, opts);
    };
}

function prepareGetSet(target: any, key: string, privateKey: string, opts?: SceneChangeDetectionOptions) {
    const { type = 'normal', changeCb, convertor, checkDirtyOnAssignment = false } = opts ?? {};
    const requiredOpts = { type, changeCb, checkDirtyOnAssignment, convertor };

    // Select the correctly optimized setter with minimal branches/checks for the specific type
    // of change detection.
    let setter;
    setter = buildSetter(privateKey, requiredOpts);
    setter = buildCheckDirtyChain(
        privateKey,
        buildChangeCallbackChain(buildConvertorChain(setter, requiredOpts), requiredOpts),
        requiredOpts
    );

    const getter = function (this: any) {
        return this[privateKey];
    };

    Object.defineProperty(target, key, {
        set: setter as (v: unknown) => void,
        get: getter,
        enumerable: true,
        configurable: true,
    });
}

function buildConvertorChain(setterFn: Function, opts: SceneChangeDetectionOptions) {
    const { convertor } = opts;
    if (convertor) {
        return function (this: any, value: unknown) {
            setterFn.call(this, convertor(value));
        };
    }

    return setterFn;
}

const NO_CHANGE = Symbol('no-change');

function buildChangeCallbackChain(setterFn: Function, opts: SceneChangeDetectionOptions) {
    const { changeCb } = opts;
    if (changeCb) {
        return function (this: any, value: unknown) {
            const change = setterFn.call(this, value);
            if (change !== NO_CHANGE) {
                changeCb.call(this, this);
            }
            return change;
        };
    }

    return setterFn;
}

function buildCheckDirtyChain(privateKey: string, setterFn: Function, opts: SceneChangeDetectionOptions) {
    const { checkDirtyOnAssignment } = opts;
    if (checkDirtyOnAssignment) {
        return function (this: any, value: undefined | { _dirty: boolean }) {
            const change = setterFn.call(this, value);

            if (value?._dirty === true) {
                this.markDirty(privateKey);
            }

            return change;
        };
    }

    return setterFn;
}

function buildSetter(privateKey: string, opts: SceneChangeDetectionOptions) {
    const { changeCb } = opts;

    return function (this: Target, value: unknown) {
        const oldValue = this[privateKey];
        if (value !== oldValue) {
            this[privateKey] = value;
            this.onChangeDetection(privateKey);
            changeCb?.(this);
            return value;
        }

        return NO_CHANGE;
    };
}
