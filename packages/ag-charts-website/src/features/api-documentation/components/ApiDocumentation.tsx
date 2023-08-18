import type { FunctionComponent } from 'react';
import type { ApiDocumentationProps, Config, DocEntryMap } from '../types';
import { Section } from './Section';

/**
 * This generates tabulated API documentation based on information in JSON files. This way it is possible to show
 * information about different parts of an API in multiple places across the website while pulling the information
 * from one source of truth, so we only have to update one file when the documentation needs to change.
 */
export const ApiDocumentation: FunctionComponent<ApiDocumentationProps> = ({
    framework,
    source,
    sources,
    section,
    names = '',
    interfaceLookup,
    config = {} as Config,
}) => {
    if (source) {
        sources = [source];
    }

    if (!sources || sources.length < 1) {
        return null;
    }
    let namesArr = [];
    if (names && names.length) {
        namesArr = JSON.parse(names);
        // Hide more links when properties included by name or use the value from config if its set
        config = { hideMore: true, overrideBottomMargin: '1rem', ...config };
    }

    // TODO
    // const propertiesFromFiles = sources.map((s) => getJsonFromFile(nodes, pageName, s));
    const propertiesFromFiles = [];

    // const configs = propertiesFromFiles.map((p) => p['_config_']);
    // propertiesFromFiles.forEach((p) => delete p['_config_']);

    let codeLookup = {};
    let codeSrcProvided = [];
    // configs.forEach((c) => {
    //     if (c == undefined) {
    //         console.warn(`_config_ property missing from source ${source || (sources || []).join()}.`);
    //         return;
    //     }
    //     if (c.codeSrc) {
    //         codeSrcProvided = [...codeSrcProvided, c.codeSrc];
    //         codeLookup = { ...codeLookup, ...getJsonFromFile(nodes, undefined, c.codeSrc) };
    //     }

    //     if (c.suppressMissingPropCheck) {
    //         config = { ...config, suppressMissingPropCheck: true };
    //     }
    // });

    const lookups = { codeLookup, interfaces: interfaceLookup };
    for (const ignoreName of config.suppressTypes ?? []) {
        delete interfaceLookup[ignoreName];
    }
    config = { ...config, lookups, codeSrcProvided };

    if (section == null) {
        const properties: DocEntryMap = mergeObjects(propertiesFromFiles);

        const entries = Object.entries(properties);
        if (!config.suppressSort) {
            entries.sort(([k1, v1], [k2, v2]) => {
                const getName = (k, v) => (v.meta && v.meta.displayName) || k;
                return getName(k1, v1) < getName(k2, v2) ? -1 : 1;
            });
        }
        return entries.map(([key, value]) => (
            <Section key={key} framework={framework} title={key} properties={value} config={config} />
        ));
    }

    const keys = section.split('.');
    const processed = keys.reduce(
        (current, key) =>
            current.map((x) => {
                const prop = x[key];
                if (!prop) {
                    //console.warn(`Could not find a prop ${key} under source ${source} and section ${section}!`)
                    throw new Error(`Could not find a prop ${key} under source ${source} and section ${section}!`);
                }
                return prop;
            }),
        propertiesFromFiles
    );
    const properties = mergeObjects(processed);

    return (
        <Section
            framework={framework}
            title={keys[keys.length - 1]}
            properties={properties}
            config={{ ...config, isSubset: true }}
            names={namesArr}
        />
    );
};

const mergeObjects = (objects) => {
    return objects.reduce((result, value) => Object.assign(result, value), {});
};
