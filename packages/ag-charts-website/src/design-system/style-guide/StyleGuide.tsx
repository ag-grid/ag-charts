import classnames from 'classnames';
import type { FunctionComponent } from 'react';

import { Buttons } from './Buttons';
import { Colors } from './Colors';
import { Inputs } from './Inputs';
import { Layout } from './Layout';
import { Radii } from './Radii';
import { Shadows } from './Shadows';
import { Spacing } from './Spacing';
import styles from './StyleGuide.module.scss';
import { TextElements } from './TextElements';
import { TextSizes } from './TextSizes';

export const StyleGuide: FunctionComponent = () => {
    return (
        <>
            <div className={classnames(styles.styleGuide, 'page-margin')}>
                <h1>STYLE GUIDE</h1>
                <Layout />
                <Spacing />
                <Radii />
                <TextSizes />
                <Colors />
                <Shadows />
                <TextElements />
                <Buttons />
                <Inputs />
            </div>
        </>
    );
};
