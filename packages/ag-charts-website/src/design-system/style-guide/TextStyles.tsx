import type { FunctionComponent } from 'react';

import styles from './StyleGuide.module.scss';
import { getCssVarValue } from './getCssVarValue';

const textStyles = {
    regular: ['2xs', 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'],
    semibold: ['2xs', 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'],
    bold: ['2xs', 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'],
};

const Text: FunctionComponent = ({ textName }) => {
    return (
        <div className={styles.textItem}>
            <span>
                <code>{`var(--text-${textName})`}</code>:{' '}
                <span>{getCssVarValue(`--text-${textName}`).split('-')[0]}</span>
            </span>
            <p className={styles.textExample} style={{ font: `var(--text-${textName})` }}>
                The quick brown fox jumps over the lazy dog
            </p>
        </div>
    );
};

export const TextStyles: FunctionComponent = () => {
    return (
        <>
            <h2>Text</h2>
            <div className={styles.textList}>
                <div>
                    {textStyles.regular.map((textName) => {
                        return <Text textName={textName} />;
                    })}
                </div>
                <div>
                    {textStyles.semibold.map((textName) => {
                        return <Text textName={`${textName}-semibold`} />;
                    })}
                </div>
                <div>
                    {textStyles.semibold.map((textName) => {
                        return <Text textName={`${textName}-bold`} />;
                    })}
                </div>
            </div>
        </>
    );
};
