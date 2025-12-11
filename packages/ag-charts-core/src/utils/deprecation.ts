import * as Logger from '../logging/logger';
import { getPath, setPath } from './data/object';
import { BREAK_TRANSFORM_CHAIN, addTransformToInstanceProperty } from './types/decorator';

// Note: These deprecation utilities are currently unused but are kept for future deprecations.
// They provide decorators for marking properties as deprecated with helpful migration messages.

export function createDeprecationWarning() {
    return (key: string, message?: string) => {
        const msg = [`Property [${key}] is deprecated.`, message].filter(Boolean).join(' ');
        Logger.warnOnce(msg);
    };
}

export function Deprecated(message?: string, opts?: { default?: any }) {
    const warnDeprecated = createDeprecationWarning();
    const def = opts?.default;

    return addTransformToInstanceProperty((_: unknown, key: string | number | symbol, value: unknown) => {
        if (value !== def) {
            warnDeprecated(key.toString(), message);
        }
        return value;
    });
}

export function DeprecatedAndRenamedTo(newPropName: any, mapValue?: (value: any) => any) {
    const warnDeprecated = createDeprecationWarning();

    return addTransformToInstanceProperty(
        (target: any, key: string | number | symbol, value: any) => {
            if (value !== target[newPropName]) {
                warnDeprecated(key.toString(), `Use [${newPropName}] instead.`);
                setPath(target, newPropName, mapValue ? mapValue(value) : value);
            }
            return BREAK_TRANSFORM_CHAIN;
        },
        (target: any, key: string | number | symbol) => {
            warnDeprecated(key.toString(), `Use [${newPropName}] instead.`);
            return getPath(target, newPropName);
        }
    );
}
