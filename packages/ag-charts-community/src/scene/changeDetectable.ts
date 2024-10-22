/* eslint-disable @typescript-eslint/no-implied-eval */

type SceneChangeDetectionOptions<T = any> = {
    type?: 'normal' | 'transform' | 'path';
    convertor?: (o: any) => any;
    changeCb?: (o: T) => any;
    checkDirtyOnAssignment?: boolean;
};

export function SceneChangeDetection<T = any>(opts?: SceneChangeDetectionOptions<T>) {
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
    switch (type) {
        case 'normal':
            setter = buildNormalSetter(privateKey, requiredOpts);
            break;
        case 'transform':
            setter = buildTransformSetter(privateKey);
            break;
        case 'path':
            setter = buildPathSetter(privateKey);
            break;
    }
    setter = buildCheckDirtyChain(
        buildChangeCallbackChain(buildConvertorChain(setter, requiredOpts), requiredOpts),
        requiredOpts
    );

    const getter = function (this: any) {
        return this[privateKey];
    };

    Object.defineProperty(target, key, {
        set: setter as (v: any) => void,
        get: getter,
        enumerable: true,
        configurable: true,
    });
}

function buildConvertorChain(setterFn: Function, opts: SceneChangeDetectionOptions) {
    const { convertor } = opts;
    if (convertor) {
        return function (this: any, value: any) {
            setterFn.call(this, convertor(value));
        };
    }

    return setterFn;
}

const NO_CHANGE = Symbol('no-change');

function buildChangeCallbackChain(setterFn: Function, opts: SceneChangeDetectionOptions) {
    const { changeCb } = opts;
    if (changeCb) {
        return function (this: any, value: any) {
            const change = setterFn.call(this, value);
            if (change !== NO_CHANGE) {
                changeCb.call(this, this);
            }
            return change;
        };
    }

    return setterFn;
}

function buildCheckDirtyChain(setterFn: Function, opts: SceneChangeDetectionOptions) {
    const { checkDirtyOnAssignment } = opts;
    if (checkDirtyOnAssignment) {
        return function (this: any, value: any) {
            const change = setterFn.call(this, value);

            if (change !== NO_CHANGE && value != null && value._dirty) {
                this.markDirty();
            }

            return change;
        };
    }

    return setterFn;
}

function buildNormalSetter(privateKey: string, opts: SceneChangeDetectionOptions) {
    const { changeCb } = opts;

    return function (this: any, value: any) {
        const oldValue = this[privateKey];
        if (value !== oldValue) {
            this[privateKey] = value;
            this.markDirty();
            changeCb?.(this);
            return value;
        }

        return NO_CHANGE;
    };
}

function buildTransformSetter(privateKey: string) {
    return function (this: any, value: any) {
        const oldValue = this[privateKey];
        if (value !== oldValue) {
            this[privateKey] = value;
            this.markDirtyTransform();
            return value;
        }

        return NO_CHANGE;
    };
}

function buildPathSetter(privateKey: string) {
    return function (this: any, value: any) {
        const oldValue = this[privateKey];
        if (value !== oldValue) {
            this[privateKey] = value;
            if (!this._dirtyPath) {
                this._dirtyPath = true;
                this.markDirty();
            }
            return value;
        }

        return NO_CHANGE;
    };
}
