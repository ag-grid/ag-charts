import Code from '@components/Code';
import type { FunctionComponent } from 'react';

import type { FunctionCode, ICallSignature } from '../types';
import { applyInterfaceInclusions } from '../utils/applyInterfaceInclusions';
import { escapeGenericCode, extractInterfaces, getLinkedType, writeAllInterfaces } from '../utils/documentationHelpers';
import { getInterfaceName } from '../utils/getInterfaceName';
import { getInterfacesToWrite } from '../utils/getInterfacesToWrite';
import { isGridOptionEvent } from '../utils/isGridOptionEvent';

export const FunctionCodeSample: FunctionComponent<FunctionCode> = ({ framework, name, type, config }) => {
    if (typeof type == 'string') {
        console.log('type is a string!', type);
    }

    type = type || {};
    let returnType = typeof type == 'string' ? undefined : type.returnType;
    const returnTypeIsObject = !!returnType && typeof returnType === 'object';
    const extracted = extractInterfaces(returnType, config.lookups?.interfaces, applyInterfaceInclusions(config));
    const returnTypeInterface = config.lookups?.interfaces[returnType];
    const isCallSig = returnTypeInterface && returnTypeInterface.meta.isCallSignature;
    const returnTypeHasInterface = extracted.length > 0;

    let functionName = name.replace(/\([^)]*\)/g, '');
    if (isGridOptionEvent(config.gridOpProp)) {
        functionName = 'on' + getInterfaceName(functionName);
    }

    let args = {};
    if (typeof type !== 'string') {
        if (type.parameters) {
            args = {
                params: {
                    meta: { name: `${getInterfaceName(functionName)}Params` },
                    ...type.parameters,
                },
            };
        } else if (type.arguments) {
            args = type.arguments;
        } else if (isCallSig) {
            // Required to handle call signature interfaces so we can flatten out the interface to make it clearer
            const callSigInterface = returnTypeInterface as ICallSignature;
            args = callSigInterface.type.arguments;
            returnType = callSigInterface.type.returnType;
        }
    }

    let shouldUseNewline = false;
    const argumentDefinitions = [];

    const getArgumentTypeName = (key, type) => {
        if (!Array.isArray(type) && typeof type === 'object') {
            return (type.meta && type.meta.name) || getInterfaceName(key);
        }

        return type;
    };

    Object.entries(args).forEach(([key, type]) => {
        const typeName = getArgumentTypeName(key, type);

        argumentDefinitions.push(`${key}: ${getLinkedType(typeName, framework)}`);

        if (argumentDefinitions.length > 1 || (key + typeName).length > 20) {
            shouldUseNewline = true;
        }
    });

    const functionArguments = shouldUseNewline
        ? `\n    ${argumentDefinitions.join(',\n    ')}\n`
        : argumentDefinitions.join('');

    const returnTypeName = getInterfaceName(functionName).replace(/^get/, '');
    const functionPrefix =
        name.includes('(') || config.isApi
            ? `function ${functionName}(${functionArguments}):`
            : `${functionName} = (${functionArguments}) =>`;

    const lines = [];
    if (typeof type != 'string' && (type.parameters || type.arguments || isCallSig)) {
        lines.push(
            `${functionPrefix} ${returnTypeIsObject ? returnTypeName : getLinkedType(returnType || 'void', framework)};`
        );
    } else {
        lines.push(`${name}: ${returnType};`);
    }

    let interfacesToWrite = [];
    if (type.parameters) {
        Object.keys(args)
            .filter((key) => !Array.isArray(args[key]) && typeof args[key] === 'object')
            .forEach((key) => {
                const { meta, ...type } = args[key];
                interfacesToWrite = [
                    ...interfacesToWrite,
                    ...getInterfacesToWrite(getArgumentTypeName(key, { meta }), type, config),
                ];
            });
    } else if (args) {
        Object.entries(args).forEach(([key, type]) => {
            interfacesToWrite = [
                ...interfacesToWrite,
                ...getInterfacesToWrite(getArgumentTypeName(key, type), type, config),
            ];
        });
    }

    if (returnTypeIsObject) {
        interfacesToWrite = [...interfacesToWrite, ...getInterfacesToWrite(returnTypeName, returnType, config)];
    } else if (returnTypeHasInterface) {
        interfacesToWrite = [...interfacesToWrite, ...getInterfacesToWrite(returnType, returnType, config)];
    }

    lines.push(...writeAllInterfaces(interfacesToWrite, framework));

    const escapedLines = escapeGenericCode(lines);
    let customHTML = undefined;
    if (config.lookups?.htmlLookup && config.lookups?.htmlLookup[name]) {
        customHTML = <p dangerouslySetInnerHTML={{ __html: config.lookups?.htmlLookup[name] }}></p>;
    }

    return (
        <>
            <Code code={escapedLines} keepMarkup={true} />
            {customHTML ?? customHTML}
        </>
    );
};
