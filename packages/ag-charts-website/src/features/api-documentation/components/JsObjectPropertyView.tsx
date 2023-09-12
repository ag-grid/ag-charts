import classnames from 'classnames';
import styles from './ApiDocumentation.module.scss';
import { Icon } from '@components/icon/Icon';
import {
    convertMarkdown,
    formatJsDocString,
    getFormattedDefaultValue,
    removeDefaultValue,
    splitName,
} from '../utils/documentationHelpers';
import type { JsObjectSelection, JsObjectSelectionProperty, JsObjectSelectionUnionNestedObject } from '../types';
import type { JsonArray, JsonModel, JsonModelProperty, JsonObjectProperty, JsonUnionType } from '../utils/model';
import { getPropertyType } from '../utils/getPropertyType';
import { createUnionNestedObjectPathItemRegex, getUnionPathInfo } from '../utils/modelPath';
import { getSelectionReferenceId } from '../utils/getObjectReferenceId';
import { useContext } from 'react';
import { OptionsDataContext } from '../utils/optionsDataContext';
import { JsObjectPropertiesViewConfigContext } from '../utils/jsObjectPropertiesViewConfigContext';
import { FrameworkContext } from '../utils/frameworkContext';
import { getExamplePageUrl } from '@features/docs/utils/urlPaths';

interface Props {
    selection: JsObjectSelection;
    parentName?: string;
}

function HeadingPath({ path }: { path: string[] }) {
    const regex = createUnionNestedObjectPathItemRegex();
    return (
        path.length > 0 && (
            <span className={styles.parentProperties}>
                {path.map((pathItem, index) => {
                    const arrayDiscriminatorMatches = regex.exec(pathItem);
                    const [_, preValue, value, postValue] = arrayDiscriminatorMatches || [];
                    // Only show separator `.` at the front, when not the first and not an array discriminator afterwards
                    const separator = index !== 0 && !arrayDiscriminatorMatches ? '.' : '';

                    return (
                        <span className={styles.noWrap} key={`${pathItem}-${index}`}>
                            {separator}
                            {!arrayDiscriminatorMatches && <>{pathItem}</>}
                            {arrayDiscriminatorMatches && (
                                <>
                                    {preValue}
                                    <span className={styles.unionDiscriminator}>{value}</span>
                                    {postValue}
                                </>
                            )}
                        </span>
                    );
                })}
            </span>
        )
    );
}

function NameHeading({ id, name, path }: { id: string; name?: string; path: string[] }) {
    const displayNameSplit = splitName(name);
    const pathSeparator = name && path.length > 0 ? '.' : '';

    return (
        <h6 className={classnames(styles.name, 'side-menu-exclude')}>
            <HeadingPath path={path} />
            <span>
                {pathSeparator}
                {displayNameSplit && <span dangerouslySetInnerHTML={{ __html: displayNameSplit }}></span>}
            </span>
            <a href={`#${id}`} className="docs-header-icon">
                <Icon name="link" />
            </a>
        </h6>
    );
}

function Actions({ propName }: { propName?: string }) {
    const framework = useContext(FrameworkContext);
    const optionsData = useContext(OptionsDataContext);
    const config = useContext(JsObjectPropertiesViewConfigContext);
    const actionsData = optionsData[propName];
    const more = actionsData?.more;
    const hasMore = Boolean(more);

    if (!actionsData || !hasMore) {
        return null;
    }

    return (
        <div className={styles.actions}>
            {hasMore && more.url && !config.hideMore && (
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
    );
}

function MetaList({
    propertyType,
    description,
    model,
}: {
    propertyType: string;
    description: string;
    model: JsonModelProperty;
}) {
    const formattedDefaultValue = getFormattedDefaultValue({
        model,
        description,
    });
    return (
        <div className={styles.metaList}>
            <div title={propertyType} className={styles.metaItem}>
                <span className={styles.metaLabel}>Type</span>
                <span className={styles.metaValue}>{propertyType}</span>
            </div>
            {formattedDefaultValue != null && (
                <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Default</span>
                    <span className={styles.metaValue}>{formattedDefaultValue}</span>
                </div>
            )}
        </div>
    );
}

function formatPropertyDocumentation(model: Omit<JsonModelProperty, 'desc'>): string[] {
    const { documentation } = model;
    const defaultValue = model.default;
    const result: string[] = documentation?.trim() ? [formatJsDocString(documentation.trim())] : [];

    if (Object.hasOwn(model, 'default')) {
        result.push('Default: `' + JSON.stringify(defaultValue) + '`');
    }

    return result.filter((v) => !!v?.trim());
}

function PrimitivePropertyView({
    id,
    name,
    model,
    path,
}: {
    id: string;
    name: string;
    model: JsonModelProperty;
    path: string[];
}) {
    const framework = useContext(FrameworkContext);
    const formattedDocumentation = formatPropertyDocumentation(model).join('\n');
    const propertyType = getPropertyType(
        (model as any).type === 'primitive' ? (model as any).tsType : model.desc.tsType
    );
    const description = convertMarkdown(formattedDocumentation, framework);
    return (
        <tr id={id}>
            <td role="presentation" className={styles.leftColumn}>
                <NameHeading id={id} name={name} path={path} />
                <MetaList propertyType={propertyType} model={model} description={description} />
            </td>
            <td className={styles.rightColumn}>
                <div
                    role="presentation"
                    className={styles.description}
                    dangerouslySetInnerHTML={{ __html: removeDefaultValue(description) }}
                ></div>
                <Actions propName={name} />
            </td>
        </tr>
    );
}

function NestedObjectProperties({
    parentName,
    parentPath,
    properties,
    onlyShowToDepth,
}: {
    parentName?: string;
    parentPath: string[];
    properties: JsonModel['properties'];
    onlyShowToDepth?: number;
}) {
    return (
        <>
            {Object.entries(properties).map(([propName, model]) => {
                const selection: JsObjectSelectionProperty = {
                    type: 'property',
                    propName,
                    path: parentPath,
                    model,
                    onlyShowToDepth,
                };
                return <JsObjectPropertyView key={propName} selection={selection} parentName={parentName} />;
            })}
        </>
    );
}

function NestedObjectPropertyView({
    id,
    name,
    path,
    model,
    onlyShowToDepth,
}: {
    id: string;
    name?: string;
    path: string[];
    model: JsonModelProperty;
    onlyShowToDepth?: number;
}) {
    const framework = useContext(FrameworkContext);
    const formattedDocumentation = formatPropertyDocumentation(model).join('\n');
    const description = convertMarkdown(formattedDocumentation, framework);
    const propertyType = getPropertyType(model.desc.tsType);
    const {
        model: { properties },
    } = model.desc as JsonObjectProperty;
    const nestedObjectPropertiesPath = name ? path.concat(name) : path;
    const showChildren = onlyShowToDepth === undefined ? true : path.length < onlyShowToDepth;

    return (
        <>
            <tr id={id}>
                <td role="presentation" className={styles.leftColumn}>
                    <NameHeading id={id} name={name} path={path} />
                    <MetaList propertyType={propertyType} model={model} description={description} />
                </td>
                <td className={styles.rightColumn}>
                    <div
                        role="presentation"
                        className={styles.description}
                        dangerouslySetInnerHTML={{ __html: removeDefaultValue(description) }}
                    ></div>
                    <Actions propName={name} />
                </td>
            </tr>
            {showChildren && (
                <NestedObjectProperties
                    parentName={name}
                    properties={properties}
                    parentPath={nestedObjectPropertiesPath}
                    onlyShowToDepth={onlyShowToDepth}
                />
            )}
        </>
    );
}

function UnionProperties({
    parentName,
    parentPath,
    elements,
    onlyShowToDepth,
}: {
    parentName: string;
    parentPath: string[];
    elements: JsonUnionType;
    onlyShowToDepth?: number;
}) {
    return elements.options.map((model, index) => {
        const selection: JsObjectSelectionUnionNestedObject = {
            type: 'unionNestedObject',
            index,
            path: parentPath,
            model,
            onlyShowToDepth,
        };
        return <JsObjectPropertyView key={JSON.stringify(model)} selection={selection} parentName={parentName} />;
    });
}

function NestedArrayProperties({
    parentId,
    parentName,
    parentPath,
    parentModel,
    elements,
    onlyShowToDepth,
}: {
    parentId: string;
    parentName: string;
    parentPath: string[];
    parentModel: JsonModelProperty;
    elements: JsonArray['elements'];
    onlyShowToDepth?: number;
}) {
    const { type } = elements;

    if (type === 'primitive') {
        return <PrimitivePropertyView id={parentId} model={parentModel} name={parentName} path={parentPath} />;
    } else if (type === 'nested-object') {
        const {
            model: { properties },
        } = elements;
        return (
            <NestedObjectProperties
                parentName={parentName}
                properties={properties}
                parentPath={parentPath}
                onlyShowToDepth={onlyShowToDepth}
            />
        );
    } else if (type === 'union') {
        return (
            <UnionProperties
                parentName={parentName}
                elements={elements}
                parentPath={parentPath}
                onlyShowToDepth={onlyShowToDepth}
            />
        );
    } else {
        throw new Error(`Unhandled array element type: ${type}`);
    }
}

function ArrayPropertyView({
    id,
    name,
    path,
    model,
    onlyShowToDepth,
}: {
    id: string;
    name: string;
    path: string[];
    model: JsonModelProperty;
    onlyShowToDepth?: number;
}) {
    const framework = useContext(FrameworkContext);
    const formattedDocumentation = formatPropertyDocumentation(model).join('\n');
    const description = convertMarkdown(formattedDocumentation, framework);
    const propertyType = getPropertyType(model.desc.tsType);
    const { elements } = model.desc as JsonArray;
    const nestedArrayPropertiesPath = name ? path.concat(name) : path;
    const showChildren = onlyShowToDepth === undefined ? true : path.length < onlyShowToDepth;

    return (
        <>
            <tr id={id}>
                <td role="presentation" className={styles.leftColumn}>
                    <NameHeading id={id} name={name} path={path} />
                    <MetaList propertyType={propertyType} model={model} description={description} />
                </td>
                <td className={styles.rightColumn}>
                    <div
                        role="presentation"
                        className={styles.description}
                        dangerouslySetInnerHTML={{ __html: removeDefaultValue(description) }}
                    ></div>
                    <Actions propName={name} />
                </td>
            </tr>
            {showChildren && (
                <NestedArrayProperties
                    parentId={id}
                    parentName={name}
                    parentPath={nestedArrayPropertiesPath}
                    parentModel={model}
                    elements={elements}
                    onlyShowToDepth={onlyShowToDepth}
                />
            )}
        </>
    );
}

function FunctionPropertyView({
    id,
    name,
    model,
    path,
}: {
    id: string;
    name: string;
    model: JsonModelProperty;
    path: string[];
}) {
    const framework = useContext(FrameworkContext);
    const formattedDocumentation = formatPropertyDocumentation(model).join('\n');
    const description = convertMarkdown(formattedDocumentation, framework);
    const propertyType = getPropertyType(model.desc.tsType);

    return (
        <tr id={id}>
            <td role="presentation" className={styles.leftColumn}>
                <NameHeading id={id} name={name} path={path} />
                <MetaList propertyType={propertyType} model={model} description={description} />
            </td>
            <td className={styles.rightColumn}>
                <div
                    role="presentation"
                    className={styles.description}
                    dangerouslySetInnerHTML={{ __html: removeDefaultValue(description) }}
                ></div>
                <Actions propName={name} />
            </td>
        </tr>
    );
}

export function JsObjectPropertyView({ selection, parentName }: Props) {
    const { type, path, model, onlyShowToDepth } = selection;
    const id = getSelectionReferenceId(selection);

    if (type === 'model') {
        const { properties } = model;
        return (
            <NestedObjectProperties
                parentName={parentName}
                parentPath={path}
                properties={properties}
                onlyShowToDepth={onlyShowToDepth}
            />
        );
    } else if (type === 'property') {
        const { propName } = selection as JsObjectSelectionProperty;
        const propertyType = model.desc.type;
        const propertyId = id!;
        if (propertyType === 'primitive') {
            return <PrimitivePropertyView id={propertyId} model={model} name={propName} path={path} />;
        } else if (propertyType === 'nested-object') {
            return (
                <NestedObjectPropertyView
                    id={propertyId}
                    name={propName}
                    path={path}
                    model={model}
                    onlyShowToDepth={onlyShowToDepth}
                />
            );
        } else if (propertyType === 'array') {
            return (
                <ArrayPropertyView
                    id={propertyId}
                    name={propName}
                    path={path}
                    model={model}
                    onlyShowToDepth={onlyShowToDepth}
                />
            );
        } else if (propertyType === 'function') {
            return <FunctionPropertyView id={propertyId} model={model} name={propName} path={path} />;
        } else if (propertyType === 'union') {
            const elements = model.desc;
            return (
                <UnionProperties
                    parentName={propName}
                    elements={elements}
                    parentPath={path}
                    onlyShowToDepth={onlyShowToDepth}
                />
            );
        }
    } else if (type === 'unionNestedObject') {
        const { index } = selection as JsObjectSelectionUnionNestedObject;
        const unionNestedObjectId = id!;
        const propertyType = model.type;
        const name = parentName!;

        if (propertyType === 'primitive') {
            return <PrimitivePropertyView id={unionNestedObjectId} model={model} name={name} path={path} />;
        } else if (propertyType === 'nested-object') {
            const nestedObjectModel = {
                desc: model,
            } as JsonModelProperty;

            const { pathItem } = getUnionPathInfo({
                model: model.model,
                index,
            });
            const nestedObjectPath = path.concat(pathItem);
            return (
                <NestedObjectPropertyView
                    id={unionNestedObjectId}
                    // NOTE: No `name`, as it's a union nested object
                    path={nestedObjectPath}
                    model={nestedObjectModel}
                    onlyShowToDepth={onlyShowToDepth}
                />
            );
        } else if (propertyType === 'array') {
            return (
                <ArrayPropertyView
                    id={unionNestedObjectId}
                    name={name}
                    path={path}
                    model={model}
                    onlyShowToDepth={onlyShowToDepth}
                />
            );
        }
    }

    throw new Error(`Unhandled JsObjectPropertyView type: ${type} (${path})`);
}
