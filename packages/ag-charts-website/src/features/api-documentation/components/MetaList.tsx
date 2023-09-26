import { getFormattedDefaultValue, splitName } from '../utils/documentationHelpers';
import type { JsonModelProperty } from '../utils/model';
import styles from './ApiDocumentation.module.scss';

export function MetaList({
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
                <span className={styles.metaValue}>{splitName(propertyType)}</span>
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
