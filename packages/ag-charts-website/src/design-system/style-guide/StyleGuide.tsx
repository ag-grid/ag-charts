import classnames from 'classnames';
import type { FunctionComponent } from 'react';

import { Colors } from './Colors';
import styles from './StyleGuide.module.scss';
import { TextStyles } from './TextStyles';

export const StyleGuide: FunctionComponent = () => {
    return (
        <>
            <div className={classnames(styles.styleGuide, 'page-margin')}>
                <h1>STYLE GUIDE</h1>
                <Colors />
                <TextStyles />
            </div>
        </>
    );
};
