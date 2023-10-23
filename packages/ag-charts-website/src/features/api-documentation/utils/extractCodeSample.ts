import type { FunctionCode, ICallSignature } from '../types';
import { applyInterfaceInclusions } from './applyInterfaceInclusions';
import { extractInterfaces, writeAllInterfaces } from './documentationHelpers';
import { getInterfacesToWrite } from './getInterfacesToWrite';
import { isGridOptionEvent } from './isGridOptionEvent';
import { capitalize } from './strings';

const hiddenInterfaces = [
    'CssColor',
    'FontStyle',
    'FontWeight',
    'FontSize',
    'FontFamily',
    'Opacity',
    'PixelSize',
    'Ratio',
];

export function extractCodeSample({ framework, name, type, config }: FunctionCode) {
    if (typeof type == 'string') {
        // eslint-disable-next-line no-console
        console.log('type is a string!', type);
    }

    type ||= {};
    const returnType = typeof type == 'string' ? undefined : type.returnType;
    const extracted = extractInterfaces(returnType, config.lookups?.interfaces, applyInterfaceInclusions(config));
    const returnTypeHasInterface = extracted.length > 0;

    let functionName = name.replace(/\([^)]*\)/g, '');
    if (isGridOptionEvent(config.gridOpProp)) {
        functionName = 'on' + capitalize(functionName);
    }

    let args = {};
    if (typeof type !== 'string') {
        if (type.parameters) {
            args = {
                params: {
                    meta: { name: `${capitalize(functionName)}Params` },
                    ...type.parameters,
                },
            };
        } else if (type.arguments) {
            args = type.arguments;
        }
    }

    const getArgumentTypeName = (key: string, type: string | { meta?: { name: string } }) => {
        if (typeof type === 'object' && !Array.isArray(type)) {
            return type.meta?.name ?? capitalize(key);
        }

        return type;
    };

    const returnTypeName = capitalize(functionName).replace(/^get/, '');

    const interfacesToWrite = [];
    if (type.parameters) {
        Object.keys(args)
            .filter((key) => !Array.isArray(args[key]) && typeof args[key] === 'object')
            .forEach((key) => {
                const { meta, ...type } = args[key];
                interfacesToWrite.push(...getInterfacesToWrite(getArgumentTypeName(key, { meta }), type, config));
            });
    } else if (args) {
        Object.entries(args).forEach(([key, type]) => {
            interfacesToWrite.push(...getInterfacesToWrite(getArgumentTypeName(key, type), type, config));
        });
    }

    if (typeof returnType === 'object' && returnType !== null) {
        interfacesToWrite.push(...getInterfacesToWrite(returnTypeName, returnType, config));
    } else if (returnTypeHasInterface) {
        interfacesToWrite.push(...getInterfacesToWrite(returnType, returnType, config));
    }

    return writeAllInterfaces(
        interfacesToWrite.filter(
            (item) => !item.interfaceType.meta.isTypeAlias || !hiddenInterfaces.includes(item.name)
        ),
        framework
    );
}
