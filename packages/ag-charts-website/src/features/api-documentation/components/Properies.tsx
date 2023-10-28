import { LinkIcon } from '@components/link-icon/LinkIcon';
import classnames from 'classnames';
import type { AllHTMLAttributes, FunctionComponent, ReactNode } from 'react';

import type { TypeNode } from '../api-reference-types';
import { normalizeType } from '../utils/apiReferenceHelpers';
import styles from './ApiReference.module.scss';

interface PropertyTitleOptions {
    name: string;
    parentId: string;
    prefixPath?: string[];
    required?: boolean;
}

export function PropertyTitle({ name, parentId, prefixPath, required }: PropertyTitleOptions) {
    const anchorId = `reference-${parentId}-${name}`;
    return (
        <h6 className={classnames(styles.name, 'side-menu-exclude')}>
            <a id={anchorId} />
            <PropertyNamePrefix prefixPath={prefixPath} />
            <PropertyName isRequired={required}>{name}</PropertyName>
            <LinkIcon href={`#${anchorId}`} />
        </h6>
    );
}

export function PropertyNamePrefix({
    as: Component = PropertyName,
    prefixPath,
}: {
    as?: string | FunctionComponent<AllHTMLAttributes<Element>>;
    prefixPath?: string[];
}) {
    const parentPrefix = prefixPath?.join('.');
    return <>{parentPrefix && <Component className={styles.parentProperties}>{`${parentPrefix}.`}</Component>}</>;
}

export function PropertyType({ type, defaultValue }: { type: TypeNode; defaultValue?: string }) {
    return (
        <div className={styles.metaList}>
            <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Type</span>
                <PropertyName className={styles.metaValue}>{normalizeType(type)}</PropertyName>
            </div>
            {defaultValue && (
                <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Default</span>
                    <span className={styles.metaValue}>{defaultValue}</span>
                </div>
            )}
        </div>
    );
}

function PropertyName({
    as: Component = 'span',
    splitRegex = /(?=[A-Z]|\s+\|\s+)/,
    isRequired,
    children,
    ...props
}: AllHTMLAttributes<Element> & { as?: string; isRequired?: boolean; splitRegex?: RegExp }) {
    if (typeof children !== 'string') {
        // eslint-disable-next-line no-console
        console.warn('PropertyName children must be of type string', children);
        return <Component {...props} />;
    }
    return (
        <Component {...props}>
            {wbrInject(children, splitRegex)}
            {isRequired && (
                <span title="Required" className={styles.required}>
                    *
                </span>
            )}
        </Component>
    );
}

function wbrInject(text: string, splitRegex: RegExp) {
    return text
        .split(splitRegex)
        .reduce<ReactNode[]>((result, part, index) => result.concat(index ? [<wbr key={index} />, part] : part), []);
}
