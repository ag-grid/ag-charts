import type { FunctionComponent } from 'react';

import { getCssVarValue } from './getCssVarValue';

const pStyles = {
    maxWidth: '440px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
};

const textStyles = {
    regular: ['2xs', 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'],
    semibold: ['2xs', 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'],
    bold: ['2xs', 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'],
};

const Text: FunctionComponent = ({ textName }) => {
    return (
        <div style={{ marginBottom: '1rem' }}>
            <span>
                <code>{`var(--text-${textName})`}</code>:{' '}
                <span>{getCssVarValue(`--text-${textName}`).split('-')[0]}</span>
            </span>
            <p style={{ font: `var(--text-${textName})`, ...pStyles }}>The quick brown fox jumps over the lazy dog</p>
        </div>
    );
};

export const TextStyles: FunctionComponent = () => {
    return (
        <>
            <h2>Text</h2>
            <div style={{ display: 'flex', gap: '2rem' }}>
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
