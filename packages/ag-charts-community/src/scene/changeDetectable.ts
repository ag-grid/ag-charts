/* eslint-disable @typescript-eslint/no-implied-eval */
export enum RedrawType {
    NONE, // No change in rendering.

    // Canvas doesn't need clearing, an incremental re-rerender is sufficient.
    TRIVIAL, // Non-positional change in rendering.

    // Group needs clearing, a semi-incremental re-render is sufficient.
    MINOR, // Small change in rendering, potentially affecting other elements in the same group.

    // Canvas needs to be cleared for these redraw types.
    MAJOR, // Significant change in rendering.
}

type SceneChangeDetectionOptions<T = any> = {
    redraw?: RedrawType;
    type?: 'normal' | 'transform' | 'path' | 'font';
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
    const {
        redraw = RedrawType.TRIVIAL,
        type = 'normal',
        changeCb,
        convertor,
        checkDirtyOnAssignment = false,
    } = opts ?? {};
    const requiredOpts = { redraw, type, changeCb, checkDirtyOnAssignment, convertor };

    // Select the correctly optimized setter with minimal branches/checks for the specific type
    // of change detection.
    let setter;
    switch (type) {
        case 'normal':
            setter = buildNormalSetter(privateKey, requiredOpts);
            break;
        case 'transform':
            setter = buildTransformSetter(privateKey, requiredOpts);
            break;
        case 'path':
            setter = buildPathSetter(privateKey, requiredOpts);
            break;
        case 'font':
            setter = buildFontSetter(privateKey, requiredOpts);
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

            if (change !== NO_CHANGE && value != null && value._dirty > RedrawType.NONE) {
                this.markDirty(value, value._dirty);
            }

            return change;
        };
    }

    return setterFn;
}

function buildNormalSetter(privateKey: string, opts: SceneChangeDetectionOptions) {
    const { redraw = RedrawType.TRIVIAL, changeCb } = opts;

    return function (this: any, value: any) {
        const oldValue = this[privateKey];
        if (value !== oldValue) {
            this[privateKey] = value;
            this.markDirty(this, redraw);
            changeCb?.(this);
            return value;
        }

        return NO_CHANGE;
    };
}

function buildTransformSetter(privateKey: string, opts: SceneChangeDetectionOptions) {
    const { redraw = RedrawType.TRIVIAL } = opts;

    return function (this: any, value: any) {
        const oldValue = this[privateKey];
        if (value !== oldValue) {
            this[privateKey] = value;
            this.markDirtyTransform(redraw);
            return value;
        }

        return NO_CHANGE;
    };
}

function buildPathSetter(privateKey: string, opts: SceneChangeDetectionOptions) {
    const { redraw = RedrawType.TRIVIAL } = opts;

    return function (this: any, value: any) {
        const oldValue = this[privateKey];
        if (value !== oldValue) {
            this[privateKey] = value;
            if (!this._dirtyPath) {
                this._dirtyPath = true;
                this.markDirty(this, redraw);
            }
            return value;
        }

        return NO_CHANGE;
    };
}

function buildFontSetter(privateKey: string, opts: SceneChangeDetectionOptions) {
    const { redraw = RedrawType.TRIVIAL } = opts;

    return function (this: any, value: any) {
        const oldValue = this[privateKey];
        if (value !== oldValue) {
            this[privateKey] = value;
            if (!this._dirtyFont) {
                this._dirtyFont = true;
                this.markDirty(this, redraw);
            }
            return value;
        }

        return NO_CHANGE;
    };
}

export abstract class ChangeDetectable {
    protected _dirty: RedrawType = RedrawType.MAJOR;

    protected markDirty(_source: any, type = RedrawType.TRIVIAL) {
        if (this._dirty < type) {
            this._dirty = type;
        }
    }

    markClean(_opts?: { force?: boolean; recursive?: boolean }) {
        this._dirty = RedrawType.NONE;
    }

    isDirty(): boolean {
        return this._dirty > RedrawType.NONE;
    }
}
