import type { FunctionComponent } from 'react';

const textStyles = {
    regular: ['2xs', 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'],
    semibold: ['2xs', 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'],
    bold: ['2xs', 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'],
};

const Text: FunctionComponent = ({ textName }) => {
    return <p style={{ font: `var(--text-${textName})` }}>The quick brown fox jumps over the lazy dog</p>;
};

export const TextStyles: FunctionComponent = () => {
    return (
        <>
            <h2>Text</h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
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
