import { getFormattedDefaultValue } from '../utils/documentationHelpers';
import type { JsonModelProperty } from '../utils/model';
import styles from './ApiDocumentation.module.scss';
import { SplitName } from './SplitName';

export function MetaList({
    propertyType,
    description,
    model,
}: {
    propertyType: string;
    description: string;
    model: JsonModelProperty;
}) {
    const formattedDefaultValue = getFormattedDefaultValue(model.default, description);
    return (
        <div className={styles.metaList}>
            <div title={propertyType} className={styles.metaItem}>
                <span className={styles.metaLabel}>Type</span>
                <SplitName className={styles.metaValue}>{propertyType}</SplitName>
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
