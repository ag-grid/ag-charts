import { Icon } from '@ag-website-shared/components/icon/Icon';

import styles from './ModuleConfiguration.module.scss';
import { BUNDLE_OPTIONS, type BundleOptionValue } from './constants';
import type { ModuleConfig } from './useModuleConfig';

export function ModuleConfiguration({ moduleConfig }: { moduleConfig: ModuleConfig }) {
    const { bundleOption, updateBundleOption } = moduleConfig;

    return (
        <div className={styles.configuration}>
            <div className={styles.bundles}>
                <span className={styles.label}>Bundles:</span>
                <div>
                    {BUNDLE_OPTIONS.map(({ name, moduleName, isEnterprise }) => (
                        <label key={name}>
                            <input
                                type="radio"
                                name="bundles"
                                value={moduleName}
                                checked={bundleOption === moduleName}
                                onChange={() => {
                                    updateBundleOption(moduleName as BundleOptionValue);
                                }}
                            />{' '}
                            {name}
                            {isEnterprise && <Icon name="enterprise" svgClasses={styles.enterpriseIcon} />}
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}
