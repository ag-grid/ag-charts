import { Icon } from '@components/icon/Icon';
import { useStore } from '@nanostores/react';
import { $internalFramework } from '@stores/frameworkStore';
import { getFrameworkFromInternalFramework } from '@utils/framework';
import { toTitle } from '@utils/toTitle';
import { urlWithPrefix } from '@utils/urlWithPrefix';
import classnames from 'classnames';
import GithubSlugger from 'github-slugger';
import React from 'react';

import styles from './GallerySeriesLink.module.scss';

export const GallerySeriesLink = ({ series }) => {
    const internalFramework = useStore($internalFramework);
    const frameworkFromInternalFramework = getFrameworkFromInternalFramework(internalFramework);

    const slugger = new GithubSlugger();
    const url = urlWithPrefix({ url: `./${slugger.slug(series)}-series`, framework: frameworkFromInternalFramework });

    return (
        <a href={url} className={classnames(styles.seriesLink, 'font-size-medium')}>
            View {toTitle(series)} Charts Documentation
            <Icon svgClasses={styles.arrowIcon} name="arrowRight" />
        </a>
    );
};
