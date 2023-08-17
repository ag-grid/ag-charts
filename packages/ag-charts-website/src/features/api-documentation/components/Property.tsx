import { Fragment, type FunctionComponent, useEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import type { ICallSignature, InterfaceEntry, PropertyCall } from '../types';
import {
    convertMarkdown,
    extractInterfaces,
    formatJsDocString,
    getTypeUrl,
    inferType,
    removeDefaultValue,
} from '../utils/documentationHelpers';
import { applyInterfaceInclusions } from '../utils/applyInterfaceInclusions';
import { getPropertyType } from '../utils/getPropertyType';
import { FunctionCodeSample } from './FunctionCodeSample';
import styles from './ApiDocumentation.module.scss';
import { formatJson } from '../utils/formatJson';
import { Icon } from '@components/icon/Icon';
import { getExamplePageUrl } from '@features/docs/utils/urlPaths';
import { getInterfaceName } from '../utils/getInterfaceName';

function isCallSig(gridProp: InterfaceEntry): gridProp is ICallSignature {
    return gridProp && gridProp.meta && gridProp.meta.isCallSignature;
}

export const Property: FunctionComponent<PropertyCall> = ({ framework, id, name, definition, config }) => {
    const [isExpanded, setExpanded] = useState(config.defaultExpand);
    const propertyRef = useRef<HTMLElement>(null);
    const idName = `reference-${id}-${name}`;
    let description = '';
    let isObject = false;
    let gridParams = config.gridOpProp;

    useEffect(() => {
        const hashId = location.hash.slice(1); // Remove the '#' symbol

        if (idName === hashId) {
            setExpanded(true);
            propertyRef.current?.scrollIntoView();
        }
    }, []);

    if (
        !gridParams &&
        config.codeSrcProvided.length > 0 &&
        !(config.suppressMissingPropCheck || definition.overrideMissingPropCheck)
    ) {
        throw new Error(
            `We could not find a type for "${id}" -> "${name}" from the code sources ${config.codeSrcProvided.join()}. Has this property been removed from the source code / or is there a typo?`
        );
    }

    let propDescription = definition.description || (gridParams && gridParams.description) || undefined;
    if (propDescription) {
        propDescription = formatJsDocString(propDescription);
        // process property object
        description = convertMarkdown(propDescription, framework);
    } else {
        // this must be the parent of a child object
        if (definition.meta != null && definition.meta.description != null) {
            description = convertMarkdown(definition.meta.description, framework);
        }

        isObject = true;
    }

    // Default may or may not be on a new line in JsDoc but in both cases we want the default to be on the next line
    let defaultValue = definition.default;
    if (description != null && !defaultValue) {
        const defaultReg = / Default: <code>(.*)<\/code>/;
        defaultValue = description.match(defaultReg)?.length === 2 ? description.match(defaultReg)[1] : undefined;
    }

    let displayName = name;
    if (!!definition.isRequired) {
        displayName += `&nbsp;<span class="${styles.required}" title="Required">&ast;</span>`;
    }

    if (!!definition.strikeThrough) {
        displayName = `<span style='text-decoration: line-through'>${displayName}</span>`;
    }

    // Use the type definition if manually specified in config
    let type: any = definition.type;
    let showAdditionalDetails = typeof type == 'object';
    if (!type) {
        // No type specified in the doc config file so check the GridOptions property
        if (gridParams && gridParams.type) {
            type = gridParams.type;

            if (gridParams.description && gridParams.description.includes('@deprecated')) {
                console.warn(`Docs include a property: ${name} that has been marked as deprecated.`);
                console.warn(gridParams.description);
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
    if (config.lookups?.htmlLookup) {
        // Force open if we have custom html content to display for the property
        showAdditionalDetails = showAdditionalDetails || !!config.lookups?.htmlLookup[name];
    }

    let propertyType = getPropertyType(type, config);
    const typeUrl = isObject
        ? `#reference-${id}.${name}`
        : propertyType !== 'Function'
        ? getTypeUrl(type, framework)
        : null;

    const codeSection = <FunctionCodeSample framework={framework} name={name} type={type} config={config} />;

    if (config.codeOnly) {
        return (
            <tr>
                <td colSpan={3} style={{ border: 0, padding: 0 }}>
                    {codeSection}
                </td>
            </tr>
        );
    }

    // Split display name on capital letter, add <wbr> to improve text splitting across lines
    const displayNameSplit = displayName
        .split(/(?=[A-Z])/)
        .reverse()
        .reduce((acc, cv) => {
            return `${cv}<wbr />` + acc;
        });

    const { more } = definition;

    const formattedDefaultValue = Array.isArray(defaultValue)
        ? '[' +
          defaultValue.map((v, i) => {
              return i === 0 ? `"${v}"` : ` "${v}"`;
          }) +
          ']'
        : defaultValue;

    return (
        <tr ref={propertyRef}>
            <td role="presentation" className={styles.leftColumn}>
                <h6 id={idName} className={classnames(styles.name, 'side-menu-exclude')}>
                    <span
                        onClick={() => setExpanded(!isExpanded)}
                        dangerouslySetInnerHTML={{ __html: displayNameSplit }}
                    ></span>
                    <a href={`#${idName}`} className="docs-header-icon">
                        <Icon name="link" />
                    </a>
                </h6>

                <div className={styles.metaList}>
                    <div
                        title={typeUrl && isObject ? getInterfaceName(name) : propertyType}
                        className={styles.metaItem}
                        onClick={() => setExpanded(!isExpanded)}
                    >
                        <span className={styles.metaLabel}>Type</span>
                        {typeUrl ? (
                            <a
                                className={styles.metaValue}
                                href={typeUrl}
                                target={typeUrl.startsWith('http') ? '_blank' : '_self'}
                                rel="noreferrer"
                            >
                                {isObject ? getInterfaceName(name) : propertyType}
                            </a>
                        ) : (
                            <span className={styles.metaValue}>{propertyType}</span>
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
                    onClick={() => setExpanded(!isExpanded)}
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
                        {definition.options.map((o, i) => (
                            <Fragment key={o}>
                                {i > 0 ? ', ' : ''}
                                <code>{formatJson(o)}</code>
                            </Fragment>
                        ))}
                    </div>
                )}
                <div className={styles.actions}>
                    {showAdditionalDetails && (
                        <button
                            className={classnames(styles.seeMore, 'button-style-none')}
                            onClick={() => {
                                setExpanded(!isExpanded);
                            }}
                            role="presentation"
                        >
                            {!isExpanded ? 'More' : 'Hide'} details{' '}
                            <Icon name={isExpanded ? 'chevronUp' : 'chevronDown'} />
                        </button>
                    )}
                    {more != null && more.url && !config.hideMore && (
                        <span>
                            <span className="text-secondary">See:</span>{' '}
                            <a
                                href={getExamplePageUrl({
                                    path: more.url,
                                    framework,
                                })}
                            >
                                {more.name}
                            </a>
                        </span>
                    )}
                </div>
                {showAdditionalDetails && isExpanded && <div>{codeSection}</div>}
            </td>
        </tr>
    );
};
