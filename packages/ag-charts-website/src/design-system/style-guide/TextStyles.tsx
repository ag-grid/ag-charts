import type { FunctionComponent } from 'react';

import styles from './StyleGuide.module.scss';
import { getCssVarValue } from './getCssVarValue';

const textStyles = ['2xs', 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'];

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
                    {textStyles.map((textName) => {
                        return <Text textName={textName} />;
                    })}
                </div>
                <div style={{ fontWeight: 'var(--text-semibold)' }}>
                    {textStyles.map((textName) => {
                        return <Text textName={`${textName}`} />;
                    })}
                </div>
                <div style={{ fontWeight: 'var(--text-bold)' }}>
                    {textStyles.map((textName) => {
                        return <Text textName={`${textName}`} />;
                    })}
                </div>
            </div>
        </>
    );
};
