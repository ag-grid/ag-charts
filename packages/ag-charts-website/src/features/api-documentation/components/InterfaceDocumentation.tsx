import Code from '@components/Code';

import type { ChildDocEntry, DocEntryMap, InterfaceDocumentationProps } from '../types';
import { escapeGenericCode, formatJsDocString, writeAllInterfaces } from '../utils/documentationHelpers';
import { getInterfacesToWrite } from '../utils/getInterfacesToWrite';
import { Section } from './Section';

/**
 * This generates tabulated interface documentation based on information in JSON files.
 */
export function InterfaceDocumentation({
    interfaceName,
    framework,
    names = [],
    exclude = [],
    interfaceLookup,
    codeLookup,
    config,
}: InterfaceDocumentationProps) {
    const codeSrcProvided = [interfaceName];

    if (names?.length) {
        config.overrideBottomMargin = '1rem';
    }

    for (const ignoreName of config.suppressTypes ?? []) {
        delete interfaceLookup[ignoreName];
    }

    const lookups = {
        codeLookup: codeLookup[interfaceName],
        interfaces: interfaceLookup,
    };
    const hideHeader = config.hideHeader ?? true;
    Object.assign(config, { lookups, codeSrcProvided, hideHeader });

    const li = interfaceLookup[interfaceName];

    if (!li) {
        throw new Error(`Failed to find interface: ${interfaceName}`);
    }

    if (config.asCode) {
        const interfacesToWrite = getInterfacesToWrite(interfaceName, interfaceName, config);
        if (interfacesToWrite.length < 1) {
            return (
                <h2 style={{ color: 'red' }}>
                    Could not find interface {interfaceName} for interface-documentation component!
                </h2>
            );
        }
        const lines = writeAllInterfaces(interfacesToWrite.slice(0, 1), framework, {
            lineBetweenProps: config.lineBetweenProps ?? true,
            hideName: config.hideName,
            exclude,
            applyOptionalOrdering: true,
        });
        return <Code code={escapeGenericCode(lines)} keepMarkup />;
    }

    const props: Record<string, Partial<ChildDocEntry>> = {};
    Object.entries<string>(li.type).forEach(([k, v]) => {
        // interfaces include the ? as part of the name. We want to remove this for the <interface-documentation> component
        // Instead the type will be unioned with undefined as part of the propertyType
        let propNameOnly = k.replace('?', '');
        // for function properties like failCallback(): void; We only want the name failCallback part
        // as this is what is listed in the doc-interfaces.AUTO.json file
        [propNameOnly] = propNameOnly.split('(');
        if ((names.length === 0 || names.includes(propNameOnly)) && !exclude.includes(propNameOnly)) {
            const docs = formatJsDocString(li.docs?.[k]);
            if (!docs.includes('@deprecated')) {
                props[propNameOnly] = { description: docs || v };
            }
        }
    });

    const description = config.description ?? `Properties available on the \`${interfaceName}\` interface.`;
    const properties: DocEntryMap = {
        [interfaceName]: { ...props, meta: { displayName: interfaceName, description } },
    };

    return Object.entries(properties).map(([key, value]) => (
        <Section key={key} framework={framework} title={key} properties={value} config={config} />
    ));
}
