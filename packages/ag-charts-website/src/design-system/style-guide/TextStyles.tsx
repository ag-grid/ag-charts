import type { FunctionComponent } from 'react';

import styles from './StyleGuide.module.scss';
import { getCssVarValue } from './getCssVarValue';

const textStyles = ['2xs', 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'];

const Text: FunctionComponent = ({ textName, fontWeight = 'normal' }) => {
    return (
        <div className={styles.textItem}>
            <span>
                <code>{`var(--text-${textName})`}</code>:{' '}
                <span>{getCssVarValue(`--text-${textName}`).split('-')[0]}</span>
            </span>
            <p className={styles.textExample} style={{ fontSize: `var(--text-fs-${textName})`, fontWeight }}>
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
                        return <Text key={textName} textName={textName} fontWeight="var(--text-regular)" />;
                    })}
                </div>
                <div>
                    {textStyles.map((textName) => {
                        return <Text key={`${textName}`} textName={`${textName}`} fontWeight="var(--text-semibold)" />;
                    })}
                </div>
                <div>
                    {textStyles.map((textName) => {
                        return <Text key={`${textName}`} textName={`${textName}`} fontWeight="var(--text-bold)" />;
                    })}
                </div>
            </div>
        </>
    );
};
