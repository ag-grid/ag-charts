import { Icon } from '@components/icon/Icon';
import { useStore } from '@nanostores/react';
import { $internalFramework } from '@stores/frameworkStore';
import { getFrameworkFromInternalFramework } from '@utils/framework';
import { urlWithPrefix } from '@utils/urlWithPrefix';
import classnames from 'classnames';
import React from 'react';

import styles from './GallerySeriesLink.module.scss';

export const GallerySeriesLink = ({ series }) => {
    const internalFramework = useStore($internalFramework);
    const frameworkFromInternalFramework = getFrameworkFromInternalFramework(internalFramework);

    const url = urlWithPrefix({ url: `./${series.toLowerCase()}-series`, framework: frameworkFromInternalFramework });

    return (
        <a href={url} class={classnames(styles.seriesLink, 'font-size-medium')}>
            View {series.toLowerCase()} charts documentation
            <Icon svgClasses={styles.arrowIcon} name="arrowRight" />
        </a>
    );
};
