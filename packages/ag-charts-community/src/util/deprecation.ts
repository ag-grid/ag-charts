import { BREAK_TRANSFORM_CHAIN, addTransformToInstanceProperty } from './decorator';
import { Logger } from './logger';
import { getPath, setPath } from './object';

export function createDeprecationWarning() {
    return (key: string, message?: string) => {
        const msg = [`Property [${key}] is deprecated.`, message].filter(Boolean).join(' ');
        Logger.warnOnce(msg);
    };
}

export function Deprecated(message?: string, opts?: { default?: any }) {
    const warnDeprecated = createDeprecationWarning();
    const def = opts?.default;

    return addTransformToInstanceProperty((_, key, value) => {
        if (value !== def) {
            warnDeprecated(key.toString(), message);
        }
        return value;
    });
}

export function DeprecatedAndRenamedTo(newPropName: any, mapValue?: (value: any) => any) {
    const warnDeprecated = createDeprecationWarning();

    return addTransformToInstanceProperty(
        (target, key, value) => {
            if (value !== target[newPropName]) {
                warnDeprecated(key.toString(), `Use [${newPropName}] instead.`);
                setPath(target, newPropName, mapValue ? mapValue(value) : value);
            }
            return BREAK_TRANSFORM_CHAIN;
        },
        (target, key) => {
            warnDeprecated(key.toString(), `Use [${newPropName}] instead.`);
            return getPath(target, newPropName);
        }
    );
}
