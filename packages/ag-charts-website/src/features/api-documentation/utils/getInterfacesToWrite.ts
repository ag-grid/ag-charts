import { applyInterfaceInclusions } from './applyInterfaceInclusions';
import { extractInterfaces } from './documentationHelpers';

export function getInterfacesToWrite(name, definition, config) {
    if (typeof definition === 'string') {
        // Extract all the words to enable support for Union types
        return extractInterfaces(definition, config.lookups?.interfaces, applyInterfaceInclusions(config));
    } else if (
        (typeof definition == 'object' && !Array.isArray(definition)) ||
        (typeof name == 'string' && Array.isArray(definition))
    ) {
        return [{ name, interfaceType: { type: definition, meta: {} } }];
    }
    return [];
}
