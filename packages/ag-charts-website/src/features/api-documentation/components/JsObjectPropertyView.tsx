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
import type { Framework } from '@ag-grid-types';

interface Props {
    selection: JsObjectSelection;
    framework: Framework;
    parentName?: string;
}

function NameHeading({ id, name, path }: { id: string; name: string; path: string[] }) {
    const displayNameSplit = splitName(name);
    const lastDot = name ? '.' : '';
    return (
        <h6 id={id} className={classnames(styles.name, 'side-menu-exclude')}>
            {path.length > 0 && (
                <span className={styles.parentProperties}>
                    {path.join('.')}
                    {lastDot}
                </span>
            )}
            <span dangerouslySetInnerHTML={{ __html: displayNameSplit }}></span>
            <a href={`#${id}`} className="docs-header-icon">
                <Icon name="link" />
            </a>
        </h6>
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
    framework,
}: {
    id: string;
    name: string;
    model: JsonModelProperty;
    path: string[];
    framework: Framework;
}) {
    const formattedDocumentation = formatPropertyDocumentation(model).join('\n');
    // TODO: cater for model.type === 'primitive' case
    const propertyType = getPropertyType(
        (model as any).type === 'primitive' ? (model as any).tsType : model.desc.tsType
    );
    const description = convertMarkdown(formattedDocumentation, framework);
    return (
        <tr>
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
                <div className={styles.actions}></div>
            </td>
        </tr>
    );
}

function NestedObjectProperties({
    parentName,
    parentPath,
    properties,
    framework,
}: {
    parentName: string;
    parentPath: string[];
    properties: JsonModel['properties'];
    framework: Framework;
}) {
    const path = parentPath.concat(parentName);
    return (
        <>
            {Object.entries(properties).map(([propName, model]) => {
                const selection: JsObjectSelectionProperty = {
                    type: 'property',
                    propName,
                    path,
                    model,
                };
                return (
                    <JsObjectPropertyView
                        key={propName}
                        selection={selection}
                        framework={framework}
                        parentName={parentName}
                    />
                );
            })}
        </>
    );
}

function NestedObjectPropertyView({
    id,
    name,
    path,
    model,
    framework,
}: {
    id: string;
    name: string;
    path: string[];
    model: JsonModelProperty;
    framework: Framework;
}) {
    const formattedDocumentation = formatPropertyDocumentation(model).join('\n');
    const description = convertMarkdown(formattedDocumentation, framework);
    const propertyType = getPropertyType(model.desc.tsType);
    const {
        model: { properties },
    } = model.desc as JsonObjectProperty;

    return (
        <>
            <tr>
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
                    <div className={styles.actions}></div>
                </td>
            </tr>
            <NestedObjectProperties parentName={name} properties={properties} parentPath={path} framework={framework} />
        </>
    );
}

function UnionProperties({
    parentName,
    parentPath,
    elements,
    framework,
}: {
    parentName: string;
    parentPath: string[];
    elements: JsonUnionType;
    framework: Framework;
}) {
    return elements.options.map((model, index) => {
        const selection: JsObjectSelectionUnionNestedObject = {
            type: 'unionNestedObject',
            index,
            path: parentPath,
            model,
        };
        return (
            <JsObjectPropertyView
                key={JSON.stringify(model)}
                selection={selection}
                framework={framework}
                parentName={parentName}
            />
        );
    });
}

function NestedArrayProperties({
    parentId,
    parentName,
    parentPath,
    parentModel,
    elements,
    framework,
}: {
    parentId: string;
    parentName: string;
    parentPath: string[];
    parentModel: JsonModelProperty;
    elements: JsonArray['elements'];
    framework: Framework;
}) {
    const { type } = elements;
    const path = parentPath.concat(parentName);

    if (type === 'primitive') {
        return (
            <PrimitivePropertyView
                id={parentId}
                model={parentModel}
                name={parentName}
                framework={framework}
                path={path}
            />
        );
    } else if (type === 'nested-object') {
        const {
            model: { properties },
        } = elements;
        return (
            <NestedObjectProperties
                parentName={parentName}
                properties={properties}
                parentPath={parentPath}
                framework={framework}
            />
        );
    } else if (type === 'union') {
        return (
            <UnionProperties
                parentName={parentName}
                elements={elements}
                parentPath={parentPath}
                framework={framework}
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
    framework,
}: {
    id: string;
    name: string;
    path: string[];
    model: JsonModelProperty;
    framework: Framework;
}) {
    const formattedDocumentation = formatPropertyDocumentation(model).join('\n');
    const description = convertMarkdown(formattedDocumentation, framework);
    const propertyType = getPropertyType(model.desc.tsType);
    const { elements } = model.desc as JsonArray;

    return (
        <>
            <tr>
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
                    <div className={styles.actions}></div>
                </td>
            </tr>
            <NestedArrayProperties
                parentId={id}
                parentName={name}
                parentPath={path}
                parentModel={model}
                elements={elements}
                framework={framework}
            />
        </>
    );
}

function FunctionPropertyView({
    id,
    name,
    model,
    path,
    framework,
}: {
    id: string;
    name: string;
    model: JsonModelProperty;
    path: string[];
    framework: Framework;
}) {
    const formattedDocumentation = formatPropertyDocumentation(model).join('\n');
    const description = convertMarkdown(formattedDocumentation, framework);
    const propertyType = getPropertyType(model.desc.tsType);

    return (
        <tr>
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
                <div className={styles.actions}></div>
            </td>
        </tr>
    );
}

export function JsObjectPropertyView({ selection, framework, parentName }: Props) {
    const { type, path, model } = selection;

    if (type === 'property') {
        const { propName } = selection as JsObjectSelectionProperty;
        const id = `reference-${path}-${propName}`;
        const propertyType = model.desc.type;
        if (propertyType === 'primitive') {
            return <PrimitivePropertyView id={id} model={model} name={propName} framework={framework} path={path} />;
        } else if (propertyType === 'nested-object') {
            return <NestedObjectPropertyView id={id} name={propName} path={path} model={model} framework={framework} />;
        } else if (propertyType === 'array') {
            return <ArrayPropertyView id={id} name={propName} path={path} model={model} framework={framework} />;
        } else if (propertyType === 'function') {
            return <FunctionPropertyView id={id} model={model} name={propName} framework={framework} path={path} />;
        } else if (propertyType === 'union') {
            const elements = model.desc;
            return (
                <UnionProperties parentName={propName} elements={elements} parentPath={path} framework={framework} />
            );
        }
    } else if (type === 'unionNestedObject') {
        const { index } = selection as JsObjectSelectionUnionNestedObject;
        const id = `reference-${path}-${index}`;
        const propertyType = model.type;
        const name = parentName!;
        const nestedPath = path.concat(`${index}`);

        if (propertyType === 'primitive') {
            return <PrimitivePropertyView id={id} model={model} name={name} framework={framework} path={nestedPath} />;
        } else if (propertyType === 'nested-object') {
            const nestedObjectModel = {
                desc: model,
            } as JsonModelProperty;
            return (
                <NestedObjectPropertyView
                    id={id}
                    name={name}
                    path={nestedPath}
                    model={nestedObjectModel}
                    framework={framework}
                />
            );
        } else if (propertyType === 'array') {
            return <ArrayPropertyView id={id} name={name} path={nestedPath} model={model} framework={framework} />;
        }
    }

    throw new Error(`Unhandled JsObjectPropertyView type: ${type} (${path})`);
}
