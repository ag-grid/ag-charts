import { LinkIcon } from '@components/link-icon/LinkIcon';
import classnames from 'classnames';

import type { TypeNode } from '../api-reference-types';
import { normalizeType } from '../utils/apiReferenceHelpers';
import styles from './ApiDocumentation.module.scss';
import { PropertyName } from './PropertyName';

interface PropertyTitleOptions {
    name: string;
    parentId: string;
    prefixPath?: string[];
    required?: boolean;
}

export function PropertyTitle({ name, parentId, prefixPath, required }: PropertyTitleOptions) {
    const anchorId = `reference-${parentId}-${name}`;
    const parentPrefix = prefixPath?.join('.');
    return (
        <h6 className={classnames(styles.name, 'side-menu-exclude')}>
            <a id={anchorId} />
            {parentPrefix && <PropertyName className={styles.parentProperties}>{`${parentPrefix}.`}</PropertyName>}
            <PropertyName isRequired={required}>{name}</PropertyName>
            <LinkIcon href={`#${anchorId}`} />
        </h6>
    );
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
