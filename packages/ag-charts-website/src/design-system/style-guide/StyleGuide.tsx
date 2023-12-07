import classnames from 'classnames';
import type { FunctionComponent } from 'react';

import { Buttons } from './Buttons';
import { Colors } from './Colors';
import { Inputs } from './Inputs';
import { Layout } from './Layout';
import { Shadows } from './Shadows';
import styles from './StyleGuide.module.scss';
import { TextStyles } from './TextStyles';

export const StyleGuide: FunctionComponent = () => {
    return (
        <>
            <div className={classnames(styles.styleGuide, 'page-margin')}>
                <h1>STYLE GUIDE</h1>
                <Layout />
                <TextStyles />
                <Colors />
                <Shadows />
                <Buttons />
                <Inputs />
            </div>
        </>
    );
};
