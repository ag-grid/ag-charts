import Code from '@components/Code';
import type { ChildDocEntry, DocEntryMap, InterfaceDocumentationProps } from '../types';
import {
    escapeGenericCode,
    formatJsDocString,
    getInterfaceWithGenericParams,
    sortAndFilterProperties,
    writeAllInterfaces,
} from '../utils/documentationHelpers';
import { getInterfacesToWrite } from '../utils/getInterfacesToWrite';
import { Section } from './Section';
import type { FunctionComponent } from 'react';
import { types } from 'sass';
import Error = types.Error;

/**
 * This generates tabulated interface documentation based on information in JSON files.
 */
export const InterfaceDocumentation: FunctionComponent<InterfaceDocumentationProps> = ({
    interfaceName,
    framework,
    names = [],
    exclude = [],
    wrapNamesAt = null,
    interfaceLookup,
    codeLookup,
    config = {},
}) => {
    const codeSrcProvided = [interfaceName];

    if (names && names.length) {
        config = { overrideBottomMargin: '1rem', ...config };
    }

    if (wrapNamesAt) {
        config = { wrapNamesAt: parseFloat(wrapNamesAt), ...config };
    }

    for (const ignoreName of config.suppressTypes ?? []) {
        delete interfaceLookup[ignoreName];
    }

    const lookups = {
        codeLookup: codeLookup[interfaceName],
        interfaces: interfaceLookup,
    };
    let hideHeader = true;
    if (config.hideHeader !== undefined) {
        hideHeader = config.hideHeader;
    }
    if (config.sortAlphabetically !== undefined) {
        config.sortAlphabetically = String(config.sortAlphabetically).toLowerCase() == 'true';
    }
    config = { ...config, lookups, codeSrcProvided, hideHeader };

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
        const lines = [];
        lines.push(
            ...writeAllInterfaces(interfacesToWrite.slice(0, 1), framework, {
                lineBetweenProps: config.lineBetweenProps ?? true,
                hideName: config.hideName,
                exclude,
                applyOptionalOrdering: true,
            })
        );
        const escapedLines = escapeGenericCode(lines);
        return <Code code={escapedLines} keepMarkup={true} />;
    }

    const props = {};

    const typeProps = Object.entries(li.type);
    sortAndFilterProperties(typeProps, framework).forEach(([k, v]) => {
        // interfaces include the ? as part of the name. We want to remove this for the <interface-documentation> component
        // Instead the type will be unioned with undefined as part of the propertyType
        let propNameOnly = k.replace('?', '');
        // for function properties like failCallback(): void; We only want the name failCallback part
        // as this is what is listed in the doc-interfaces.AUTO.json file
        propNameOnly = propNameOnly.split('(')[0];
        if (
            (names.length === 0 || names.includes(propNameOnly)) &&
            (exclude.length == 0 || !exclude.includes(propNameOnly))
        ) {
            const docs = (li.docs && formatJsDocString(li.docs[k])) || '';
            if (!docs.includes('@deprecated')) {
                props[propNameOnly] = { description: docs || v };
            }
        }
    });

    const orderedProps = {};
    const ordered = Object.entries(props).sort(([, v1], [, v2]) => {
        // Put required props at the top as likely to be the most important
        if ((v1 as ChildDocEntry).isRequired == (v2 as ChildDocEntry).isRequired) {
            return 0;
        }
        return (v1 as ChildDocEntry).isRequired ? -1 : 1;
    });

    ordered.map(([k, v]) => (orderedProps[k] = v));

    const interfaceDeclaration = getInterfaceWithGenericParams(interfaceName, li.meta);
    const description =
        config.description != null
            ? config.description
            : `Properties available on the \`${interfaceDeclaration}\` interface.`;
    const properties: DocEntryMap = {
        [interfaceName]: {
            ...orderedProps,
            meta: {
                displayName: interfaceName,
                description,
            },
        },
    };

    return Object.entries(properties).map(([key, value]) => (
        <Section key={key} framework={framework} title={key} properties={value} config={config} />
    ));
};
