/**
 * Interface type to override model generation
 */
const CODE_LOOKUP_OVERRIDE_INTERFACE_TYPE = 'AgChartOptions';
/**
 * Interface type to use as a base for the overriden interface type
 */
const CODE_LOOKUP_OVERRIDE_BASE_INTERFACE = 'AgCartesianChartOptions';

type InterfaceLookupMetaType = string | { parameters: Record<string, string>; returnType: string };

type MetaRecord = {
    description?: string;
    doc?: string;
    type?: InterfaceLookupMetaType;
    typeParams?: string[];
    isTypeAlias?: boolean;
    isRequired?: boolean;
    default: any;
    min?: number;
    max?: number;
    unit?: string;
    options?: string[];
    suggestions?: string[];
    ordering?: { [prop: string]: OrderingPriority };
};

type OrderingPriority = 'high' | 'natural' | 'low';

type InterfaceLookupValue = {
    meta: MetaRecord & {
        [prop: string]: MetaRecord;
    };
    docs: Record<string, string>;
    type: Record<string, string> | string;
};

export type InterfaceLookup = Record<string, InterfaceLookupValue>;

export type CodeLookup = Record<
    string,
    Record<
        string,
        {
            description: string;
            type: {
                arguments?: Record<string, string>;
                returnType: string;
                optional: boolean;
            };
        }
    >
>;

export type JsonPrimitiveProperty = {
    type: 'primitive';
    tsType: string;
    aliasType?: string;
    options?: string;
};

export type JsonObjectProperty = {
    type: 'nested-object';
    tsType: string;
    model: JsonModel;
};

export type JsonArray = {
    type: 'array';
    tsType: string;
    depth: number;
    elements: Exclude<JsonProperty, JsonArray>;
};

export type JsonUnionType = {
    type: 'union';
    tsType: string;
    options: Exclude<JsonProperty, JsonUnionType>[];
};

export interface JsonFunction {
    type: 'function';
    tsType: string;
    documentation?: string;
    parameters: Record<string, JsonModelProperty>;
    returnType: JsonProperty;
}

export type JsonProperty = JsonPrimitiveProperty | JsonObjectProperty | JsonArray | JsonUnionType | JsonFunction;

export type JsonModelProperty = {
    deprecated: boolean;
    required: boolean;
    documentation?: string;
    default?: any;
    meta?: {
        min?: number;
        max?: number;
        step?: number;
        unit?: string;
        options?: any[];
        suggestions?: any[];
    };
    desc: JsonProperty;
};

export interface JsonModel {
    type: 'model';
    tsType: string;
    documentation?: string;
    properties: Record<string, JsonModelProperty>;
}

type Config = {
    includeDeprecated: boolean;
};

function getResolvedPropertyReturnType({
    propertyKeyToResolve,
    propertyDescription,
    iLookup,
    interfaceLookup,
    codeLookup,
}: {
    propertyKeyToResolve: string;
    propertyDescription: string;
    iLookup: InterfaceLookupValue;
    interfaceLookup: InterfaceLookup;
    codeLookup: CodeLookup;
}) {
    const resolvedInterfaces = (iLookup?.type as string)
        ?.split('|')
        .map((i: string) => {
            const interfaceCodeLookup = codeLookup[i.trim()];
            const resolvedInterface = interfaceCodeLookup[propertyKeyToResolve];
            if (!resolvedInterface) {
                return;
            }

            const resolvedReturnType = resolvedInterface.type?.returnType;
            const resolvedReturnTypePlain = plainType(resolvedReturnType); // Strip ending array `[]`
            const resolvedValue = interfaceLookup[resolvedReturnTypePlain].type;
            return resolvedValue;
        })
        .filter(Boolean)
        .flat();

    const returnType = resolvedInterfaces
        .join('|') // Combine all interfaces
        .split('|') // Separate all union types
        // Add ending array (`[]`) back in
        .map((i: string) => {
            return `${i.trim()}[]`;
        })
        .join(' | '); // Combine interfaces back together

    return {
        description: propertyDescription,
        type: {
            returnType,
            optional: true,
        },
    };
}

function getOverrideCodeLookup({
    interfaceLookup,
    codeLookup,
    iLookup,
}: {
    iLookup: InterfaceLookupValue;
    interfaceLookup: InterfaceLookup;
    codeLookup: CodeLookup;
}) {
    const series = getResolvedPropertyReturnType({
        propertyKeyToResolve: 'series',
        propertyDescription: '/** Series configurations. */',
        iLookup,
        interfaceLookup,
        codeLookup,
    });
    const axes = getResolvedPropertyReturnType({
        propertyKeyToResolve: 'axes',
        propertyDescription: '/** Axis configurations. */',
        iLookup,
        interfaceLookup,
        codeLookup,
    });

    const cLookup = {
        ...codeLookup[CODE_LOOKUP_OVERRIDE_BASE_INTERFACE],
        axes,
        series,
    };

    return cLookup;
}

export function buildModel(
    type: string,
    interfaceLookup: InterfaceLookup,
    codeLookup: CodeLookup,
    config?: Partial<Config>,
    context: { typeStack: string[]; skipProperties: string[] } = { typeStack: [], skipProperties: [] }
): JsonModel {
    const includeDeprecated = config?.includeDeprecated ?? false;
    const iLookup = interfaceLookup[type] ?? interfaceLookup[plainType(type)];
    const cLookup =
        type === CODE_LOOKUP_OVERRIDE_INTERFACE_TYPE
            ? getOverrideCodeLookup({ interfaceLookup, codeLookup, iLookup })
            : codeLookup[type] ?? codeLookup[plainType(type)];
    const { skipProperties } = context;
    let { typeStack } = context;

    const result: JsonModel = {
        type: 'model',
        tsType: type,
        properties: {},
    };

    if (iLookup == null || cLookup == null) {
        return result;
    }
    if (typeStack.includes(type)) {
        return result;
    }
    typeStack = typeStack.concat([type]);

    const description = cLookup?.description || iLookup?.meta?.doc;
    const { typeParams, ordering } = iLookup?.meta || {};

    const genericArgs: Record<string, string> = {};
    if (typeParams != null && typeParams.length > 0) {
        const genericParams = type
            .substring(type.indexOf('<') + 1, type.lastIndexOf('>'))
            .split(',')
            .map((p) => p.trim());
        typeParams.forEach((tp, idx) => {
            const [tpName] = tp.split('=').map((v) => v.trim());
            genericArgs[tpName] = genericParams[idx];
        });
    }

    result.documentation = typeof description === 'string' ? description : undefined;
    Object.entries(cLookup).forEach(([prop, propCLookup]) => {
        if (prop === 'meta') {
            return;
        }
        if (skipProperties.includes(prop)) {
            return;
        }

        const { meta, docs } = iLookup;
        const metaProp = meta?.[prop] || meta?.[prop + '?'];
        const docsProp = docs?.[prop] || docs?.[prop + '?'];
        const { description, type } = propCLookup;
        const {
            optional,
            arguments: args,
            returnType,
        } = type || {
            optional: false,
            returnType: 'unknown',
        };
        const documentation = description || docsProp;
        const { isRequired, default: def } = metaProp || { isRequired: !optional };

        const required = optional === false || isRequired === true;
        const deprecated = docsProp?.indexOf('@deprecated') >= 0;

        if (deprecated && !includeDeprecated) {
            return;
        }

        let declaredType = meta[prop]?.type || returnType;
        if (args != null) {
            declaredType = { parameters: args, returnType };
        } else if (typeof declaredType === 'object') {
            declaredType = { parameters: args!, returnType };
        } else if (genericArgs[declaredType] != null) {
            declaredType = genericArgs[declaredType];
        }
        result.properties[prop] = {
            deprecated,
            required,
            documentation,
            desc: resolveType(declaredType, interfaceLookup, codeLookup, { typeStack }, config),
        };
        if (metaProp) {
            result.properties[prop].meta = buildJsonPropertyMeta(metaProp);
            if (Object.hasOwn(metaProp, 'default')) {
                result.properties[prop].default = def;
            }
        }
    });

    if (ordering) {
        const newProperties: Record<string, any> = {};
        const naturalOrder = Object.keys(result.properties);
        Object.entries(result.properties)
            .sort((a, b) => compare(a, b, ordering, naturalOrder))
            .forEach(([k, v]) => {
                newProperties[k] = v;
            });

        result.properties = newProperties;
    }

    return result;
}

function buildJsonPropertyMeta(meta: MetaRecord): JsonModelProperty['meta'] | undefined {
    return (
        Object.entries({
            // Define super-set of key/values.
            min: meta.min,
            max: meta.max,
            options: meta.options,
            suggestions: meta.suggestions,
            unit: meta.unit,
        })
            // Filter out undefined values.
            .filter(([_, v]) => v != null)
            .reduce(
                (result, [key, value]) => {
                    result = result ?? {};
                    result[key] = value;
                    return result;
                },
                // If no remaining properties, result should be undefined.
                undefined as {} | undefined
            )
    );
}

const ORDERING_PRIORITY: OrderingPriority[] = ['high', 'natural', 'low'];

function compare(
    propA: [string, JsonModelProperty],
    propB: [string, JsonModelProperty],
    ordering: MetaRecord['ordering'],
    naturalOrder: string[]
): number {
    const priorities = [
        ORDERING_PRIORITY.indexOf(ordering[propA[0]] || 'natural'),
        ORDERING_PRIORITY.indexOf(ordering[propB[0]] || 'natural'),
    ];

    if (priorities[0] != priorities[1]) {
        return priorities[0] - priorities[1];
    }

    const naturalPriority = ORDERING_PRIORITY.indexOf('natural');
    if (priorities[0] === naturalPriority) {
        return naturalOrder.indexOf(propA[0]) - naturalOrder.indexOf(propB[0]);
    }

    const orderingKeys = Object.keys(ordering);
    return orderingKeys.indexOf(propA[0]) - orderingKeys.indexOf(propB[0]);
}

const primitiveTypes = ['number', 'string', 'Date', 'boolean', 'any'];
type PropertyClass =
    | 'primitive'
    | 'nested-object'
    | 'union-nested-object'
    | 'union-mixed'
    | 'alias'
    | 'unknown'
    | 'function';

function resolveType(
    declaredType: InterfaceLookupMetaType,
    interfaceLookup: InterfaceLookup,
    codeLookup: CodeLookup,
    context: { typeStack: string[] },
    config?: Partial<Config>
): JsonProperty {
    if (typeof declaredType === 'object') {
        return resolveFunctionType(declaredType, interfaceLookup, codeLookup, context, config);
    }
    if (declaredType.startsWith('(')) {
        return resolveFunctionTypeFromString(declaredType, interfaceLookup, codeLookup, context, config);
    }

    const skipProperties: string[] = [];
    let cleanedType = declaredType;
    if (declaredType.startsWith('Omit<')) {
        const startTypeIndex = declaredType.indexOf('<') + 1;
        const endTypeIndex = declaredType.lastIndexOf(',');

        declaredType
            .substring(endTypeIndex + 1, declaredType.lastIndexOf('>'))
            .trim()
            .split('|')
            .forEach((omitted) => {
                const cleaned = omitted.trim().replace(/^'/, '').replace(/'$/, '');
                if (typeof cleaned === 'string') {
                    skipProperties.push(cleaned);
                }
            });

        cleanedType = declaredType.substring(startTypeIndex, endTypeIndex).trim();
    }

    const pType = plainType(cleanedType);
    const wrapping = typeWrapping(cleanedType);
    const { typeStack } = context;

    if (wrapping === 'array') {
        return {
            type: 'array',
            tsType: declaredType,
            depth: cleanedType.match(/\[/).length,
            elements: resolveType(pType, interfaceLookup, codeLookup, context, config) as Exclude<
                JsonProperty,
                JsonArray
            >,
        };
    }

    const { resolvedClass, resolvedType } = typeClass(cleanedType, interfaceLookup, codeLookup);
    switch (resolvedClass) {
        case 'primitive':
        case 'unknown':
            return {
                type: 'primitive',
                tsType: resolvedType,
                ...(resolvedType !== cleanedType ? { aliasType: cleanedType } : {}),
            };
        case 'function':
            return resolveType(resolvedType, interfaceLookup, codeLookup, context, config);
        case 'alias':
            const result = resolveType(resolvedType, interfaceLookup, codeLookup, context, config);
            if (result.type === 'primitive') {
                result.aliasType = resolvedType;
            }
            return result;
        case 'union-nested-object':
        case 'union-mixed':
            return {
                type: 'union',
                tsType: declaredType,
                options: resolvedType
                    .split('|')
                    .map((unionType) => resolveType(unionType.trim(), interfaceLookup, codeLookup, context))
                    .filter((unionDesc): unionDesc is JsonUnionType['options'][number] => unionDesc.type !== 'union'),
            };
        case 'nested-object':
            return {
                type: 'nested-object',
                model: buildModel(resolvedType, interfaceLookup, codeLookup, config, { typeStack, skipProperties }),
                tsType: declaredType.trim(),
            };
    }
}

function resolveFunctionType(
    declaredType: Exclude<InterfaceLookupMetaType, string>,
    interfaceLookup: InterfaceLookup,
    codeLookup: CodeLookup,
    context: { typeStack: string[] },
    config?: Partial<Config>
): JsonFunction {
    const { parameters, returnType } = declaredType;
    const formattedParameters = Object.entries(parameters)
        .map(([k, t]) => `${k}: ${t}`)
        .join(', ');
    const modeledParameters = Object.entries(parameters)
        .map(([param, typeStr]): [string, JsonProperty] => [
            param,
            resolveType(typeStr, interfaceLookup, codeLookup, context, config),
        ])
        .reduce(
            (result, [param, type]) => {
                result[param] = {
                    deprecated: false,
                    desc: type,
                    required: true,
                };
                return result;
            },
            {} as Record<string, JsonModelProperty>
        );

    return {
        type: 'function',
        tsType: `(${formattedParameters}) => ${returnType}`,
        parameters: modeledParameters,
        returnType: resolveType(returnType, interfaceLookup, codeLookup, context, config),
    };
}

function resolveFunctionTypeFromString(
    declaredType: string,
    interfaceLookup: InterfaceLookup,
    codeLookup: CodeLookup,
    context: { typeStack: string[] },
    config?: Partial<Config>
): JsonFunction {
    const stripOuterBrackets = (str: string) => str.match(/^\((.*)\)$/)?.[1] ?? str;
    declaredType = stripOuterBrackets(declaredType);

    const returnArrowIdx = declaredType.lastIndexOf('=>');
    const returnType = declaredType.substring(returnArrowIdx + 2).trim();
    const paramsString = stripOuterBrackets(declaredType.substring(0, returnArrowIdx).trim());

    if (paramsString.startsWith('new ')) {
        return {
            tsType: declaredType,
            parameters: {},
            returnType: resolveType(returnType, interfaceLookup, codeLookup, context),
            type: 'function',
        };
    }

    const parameters = paramsString
        .split(',')
        .map((paramString) => {
            const semiIndex = paramString.indexOf(':');
            return [paramString.substring(0, semiIndex).trim(), paramString.substring(semiIndex + 1).trim()];
        })
        .reduce((result, [name, type]) => {
            result[name] = type;
            return result;
        }, {});

    return resolveFunctionType({ parameters, returnType }, interfaceLookup, codeLookup, context, config);
}

function plainType(type: string): string {
    const genericIndex = type.indexOf('<');
    if (genericIndex >= 0) {
        type = type.substring(0, genericIndex);
    }
    return type.replace(/[[\]?!]/g, '');
}

function typeClass(
    type: string,
    interfaceLookup: InterfaceLookup,
    codeLookup: CodeLookup
): { resolvedClass: PropertyClass; resolvedType: string } {
    const pType = plainType(type);

    if (primitiveTypes.includes(pType)) {
        return { resolvedClass: 'primitive', resolvedType: type };
    }

    if (pType.startsWith('(')) {
        return { resolvedClass: 'function', resolvedType: type };
    }

    if (pType.indexOf('|') >= 0) {
        const unionItemResolvedClasses = pType
            .split('|')
            .map((t) => typeClass(t.trim(), interfaceLookup, codeLookup))
            .reduce((a, n) => a.add(n.resolvedClass), new Set<string>());
        if (unionItemResolvedClasses.size === 1) {
            switch (unionItemResolvedClasses.values().next().value) {
                case 'alias':
                    return { resolvedClass: 'unknown', resolvedType: type };
                case 'primitive':
                    return { resolvedClass: 'primitive', resolvedType: type };
                case 'nested-object':
                    return { resolvedClass: 'union-nested-object', resolvedType: type };
            }
        } else {
            return { resolvedClass: 'union-mixed', resolvedType: type };
        }
    }

    if (pType.startsWith("'")) {
        return { resolvedClass: 'primitive', resolvedType: type };
    }

    const iLookup = interfaceLookup[pType];
    if (iLookup == null) {
        return { resolvedClass: 'unknown', resolvedType: type };
    }

    if (iLookup.meta.isTypeAlias) {
        if (typeof iLookup.type === 'string') {
            return typeClass(iLookup.type, interfaceLookup, codeLookup);
        }

        return { resolvedClass: 'alias', resolvedType: type };
    }

    return { resolvedClass: 'nested-object', resolvedType: type };
}

type Wrapping = 'none' | 'array';
function typeWrapping(type: string): Wrapping {
    if (type.endsWith(']')) {
        return 'array';
    }

    return 'none';
}
