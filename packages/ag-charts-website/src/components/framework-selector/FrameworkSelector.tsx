import fwLogos from '@ag-website-shared/images/fw-logos';
import { FRAMEWORK_DISPLAY_TEXT } from '@constants';
import classnames from 'classnames';

import styles from './FrameworkSelector.module.scss';

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
                const frameworkDisplay = FRAMEWORK_DISPLAY_TEXT[framework.name];
                const alt = `${frameworkDisplay} Data Grid`;

                return (
                    <a
                        href={framework.url}
                        key={framework.name}
                        className={classnames(styles.option, {
                            [styles.selected]: isSelected,
                        })}
                    >
                        <img src={fwLogos[framework.name]} alt={alt} />
                        <span>{frameworkDisplay}</span>
                    </a>
                );
            })}
        </div>
    );
}
