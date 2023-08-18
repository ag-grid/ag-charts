import { applyInterfaceInclusions } from './applyInterfaceInclusions';
import { extractInterfaces } from './documentationHelpers';

export const getInterfacesToWrite = (name, definition, config) => {
    let interfacesToWrite = [];
    if (typeof definition === 'string') {
        // Extract all the words to enable support for Union types
        interfacesToWrite = extractInterfaces(definition, config.lookups?.interfaces, applyInterfaceInclusions(config));
    } else if (
        (typeof definition == 'object' && !Array.isArray(definition)) ||
        (typeof name == 'string' && Array.isArray(definition))
    ) {
        interfacesToWrite.push({
            name,
            interfaceType: { type: definition, meta: {} },
        });
    }

    return interfacesToWrite;
};
