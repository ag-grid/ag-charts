import Code from '@components/Code';
import { LinkIcon } from '@components/link-icon/LinkIcon';
import { getExamplePageUrl } from '@features/docs/utils/urlPaths';
import { useToggle } from '@utils/hooks/useToggle';
import classnames from 'classnames';
import { type FunctionComponent, useEffect, useRef } from 'react';

import type { ICallSignature, InterfaceEntry, PropertyCall } from '../types';
import { applyInterfaceInclusions } from '../utils/applyInterfaceInclusions';
import {
    convertMarkdown,
    escapeGenericCode,
    extractInterfaces,
    formatJsDocString,
    getFormattedDefaultValue,
    getTypeUrl,
    inferType,
    removeDefaultValue,
} from '../utils/documentationHelpers';
import { extractCodeSample } from '../utils/extractCodeSample';
import { formatJson } from '../utils/formatJson';
import { getPropertyType } from '../utils/getPropertyType';
import { capitalize } from '../utils/strings';
import styles from './ApiDocumentation.module.scss';
import { ChildrenSeparator } from './ChildrenSeparator';
import { PropertyName } from './PropertyName';
import { ToggleDetails } from './ToggleDetails';

function isCallSig(gridProp: InterfaceEntry): gridProp is ICallSignature {
    return Boolean(gridProp?.meta?.isCallSignature);
}

export const Property: FunctionComponent<PropertyCall> = ({ framework, id, name, definition, config }) => {
    const [isExpanded, toggleExpanded, setExpanded] = useToggle(config.defaultExpand);
    const propertyRef = useRef<HTMLTableRowElement>(null);
    const idName = `reference-${id}-${name}`;
    let description = '';
    let isObject = false;
    const gridParams = config.gridOpProp;

    useEffect(() => {
        const hashId = location.hash.slice(1); // Remove the '#' symbol

        if (idName === hashId) {
            setExpanded(true);
            propertyRef.current?.scrollIntoView();
        }
    }, []);

    if (
        !gridParams &&
        config.codeSrcProvided?.length > 0 &&
        !(config.suppressMissingPropCheck || definition.overrideMissingPropCheck)
    ) {
        throw new Error(
            `We could not find a type for "${id}" -> "${name}" from the code sources ${config.codeSrcProvided?.join()}. Has this property been removed from the source code / or is there a typo?`
        );
    }

    let propDescription = definition.description || gridParams?.description;
    if (propDescription) {
        propDescription = formatJsDocString(propDescription);
        // process property object
        description = convertMarkdown(propDescription, framework);
    } else {
        // this must be the parent of a child object
        if (definition.meta?.description) {
            description = convertMarkdown(definition.meta.description, framework);
        }

        isObject = true;
    }

    // Use the type definition if manually specified in config
    let type: any = definition.type;
    let showAdditionalDetails = typeof type == 'object';
    if (!type) {
        // No type specified in the doc config file so check the GridOptions property
        if (gridParams && gridParams.type) {
            type = gridParams.type;

            if (gridParams.description && gridParams.description.includes('@deprecated')) {
                // eslint-disable-next-line no-console
                console.warn(
                    `Docs include a property: ${name} that has been marked as deprecated.\n`,
                    gridParams.description
                );
            }

            const anyInterfaces = extractInterfaces(
                gridParams.type,
                config.lookups?.interfaces,
                applyInterfaceInclusions(config)
            );
            showAdditionalDetails = isCallSig(gridParams) || type.arguments || anyInterfaces.length > 0;
        } else {
            if (type == null && config.codeSrcProvided.length > 0) {
                throw new Error(
                    `We could not find a type for "${name}" from the code sources ${config.codeSrcProvided.join()}. Has this property been removed from the source code / or is there a typo?`
                );
            }

            // If a codeSrc is not provided as a last resort try and infer the type
            type = inferType(definition.default);
        }
    }

    const codeLines = extractCodeSample({ framework, name, type, config });

    if (codeLines.length === 0) {
        showAdditionalDetails = false;
    }

    const propertyType = getPropertyType(type, config);
    const typeUrl = isObject
        ? `#reference-${id}.${name}`
        : propertyType !== 'Function'
        ? getTypeUrl(type, framework)
        : null;

    const codeSection = codeLines.length ? <Code code={escapeGenericCode(codeLines)} keepMarkup /> : null;

    if (config.codeOnly) {
        return (
            <tr>
                <td colSpan={3} style={{ border: 0, padding: 0 }}>
                    {codeSection}
                </td>
            </tr>
        );
    }

    const { more } = definition;

    const formattedDefaultValue = getFormattedDefaultValue(definition.default, description);

    return (
        <tr ref={propertyRef}>
            <td role="presentation" className={styles.leftColumn}>
                <h6 id={idName} className={classnames(styles.name, 'side-menu-exclude')}>
                    <PropertyName
                        isRequired={definition.isRequired}
                        style={definition.strikeThrough ? { textDecoration: 'line-through' } : {}}
                    >
                        {name}
                    </PropertyName>
                    <LinkIcon href={`#${idName}`} />
                </h6>

                <div className={styles.metaList}>
                    <div title={typeUrl && isObject ? capitalize(name) : propertyType} className={styles.metaItem}>
                        <span className={styles.metaLabel}>Type</span>
                        {typeUrl ? (
                            <PropertyName
                                as="a"
                                className={styles.metaValue}
                                href={typeUrl}
                                target={typeUrl.startsWith('http') ? '_blank' : '_self'}
                                rel="noreferrer"
                            >
                                {isObject ? capitalize(name) : propertyType}
                            </PropertyName>
                        ) : (
                            <PropertyName className={styles.metaValue}>{propertyType}</PropertyName>
                        )}
                    </div>
                    {formattedDefaultValue != null && (
                        <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>Default</span>
                            <span className={styles.metaValue}>{formattedDefaultValue}</span>
                        </div>
                    )}
                </div>
            </td>
            <td className={styles.rightColumn}>
                <div
                    role="presentation"
                    className={styles.description}
                    dangerouslySetInnerHTML={{ __html: removeDefaultValue(description) }}
                ></div>
                {isObject && (
                    <div>
                        See <a href={`#reference-${id}.${name}`}>{name}</a> for more details.
                    </div>
                )}

                {definition.options != null && (
                    <div>
                        Options:{' '}
                        <ChildrenSeparator>
                            {definition.options.map((o) => (
                                <code key={o}>{formatJson(o)}</code>
                            ))}
                        </ChildrenSeparator>
                    </div>
                )}
                <div className={styles.actions}>
                    {showAdditionalDetails && <ToggleDetails isOpen={isExpanded} onToggle={toggleExpanded} />}
                    {more != null && more.url && !config.hideMore && (
                        <span>
                            <span className="text-secondary">See:</span>{' '}
                            <a href={getExamplePageUrl({ path: more.url, framework })}>{more.name}</a>
                        </span>
                    )}
                </div>
                {showAdditionalDetails && isExpanded && <div>{codeSection}</div>}
            </td>
        </tr>
    );
};
