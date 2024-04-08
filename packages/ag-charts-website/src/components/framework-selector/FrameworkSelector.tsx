import fwLogos from '@ag-website-shared/images/fw-logos';
import styles from '@design-system/modules/FrameworkSelector.module.scss';
import classnames from 'classnames';

/**
 * Allow users to choose which framework they wish to see documentation for
 */
export function FrameworkSelector({ data, currentFramework, isFullWidth, showSelectedFramework }) {
    return (
        <div
            className={classnames(styles.frameworkSelector, {
                [styles.fullWidth]: isFullWidth,
                [styles.showSelected]: showSelectedFramework,
            })}
        >
            {data.map((framework) => {
                const isSelected = showSelectedFramework && framework.name === currentFramework;
                const frameworkCapitalised = framework.name.charAt(0).toUpperCase() + framework.name.slice(1);
                const alt = `${frameworkCapitalised} Data Grid`;

                return (
                    <a
                        href={framework.url}
                        key={framework.name}
                        className={classnames(styles.option, {
                            [styles.selected]: isSelected,
                        })}
                    >
                        <img src={fwLogos[framework.name]} alt={alt} />
                        <span>{frameworkCapitalised}</span>
                    </a>
                );
            })}
        </div>
    );
}
