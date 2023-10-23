import Code from '@components/Code';

import type { FunctionCode, ICallSignature } from '../types';
import { applyInterfaceInclusions } from '../utils/applyInterfaceInclusions';
import { escapeGenericCode, extractInterfaces, getLinkedType, writeAllInterfaces } from '../utils/documentationHelpers';
import { getInterfacesToWrite } from '../utils/getInterfacesToWrite';
import { isGridOptionEvent } from '../utils/isGridOptionEvent';
import { capitalize } from '../utils/strings';

const blacklistInterfaces = [
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
    let returnType = typeof type == 'string' ? undefined : type.returnType;
    const returnTypeIsObject = !!returnType && typeof returnType === 'object';
    const extracted = extractInterfaces(returnType, config.lookups?.interfaces, applyInterfaceInclusions(config));
    const returnTypeInterface = returnType && config.lookups?.interfaces[returnType];
    const isCallSig = returnTypeInterface && returnTypeInterface.meta.isCallSignature;
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
        } else if (isCallSig) {
            // Required to handle call signature interfaces so we can flatten out the interface to make it clearer
            const callSigInterface = returnTypeInterface as ICallSignature;
            args = callSigInterface.type.arguments;
            returnType = callSigInterface.type.returnType;
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

    if (returnTypeIsObject) {
        interfacesToWrite.push(...getInterfacesToWrite(returnTypeName, returnType, config));
    } else if (returnTypeHasInterface) {
        interfacesToWrite.push(...getInterfacesToWrite(returnType, returnType, config));
    }

    return writeAllInterfaces(
        interfacesToWrite.filter(
            (item) => !item.interfaceType.meta.isTypeAlias || !blacklistInterfaces.includes(item.name)
        ),
        framework
    );
}

export function FunctionCodeSample({
    name,
    codeLines,
    config,
}: {
    name: string;
    codeLines: string[];
    config: FunctionCode['config'];
}) {
    const customHTML = config.lookups?.htmlLookup?.[name];
    return (
        <>
            {codeLines.length > 0 && <Code code={escapeGenericCode(codeLines)} keepMarkup />}
            {customHTML && <p dangerouslySetInnerHTML={{ __html: customHTML }} />}
        </>
    );
}
