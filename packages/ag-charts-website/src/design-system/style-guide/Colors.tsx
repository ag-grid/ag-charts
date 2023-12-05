import type { FunctionComponent } from 'react';

import { getCssVarValue } from './getCssVarValue';

const colors = {
    base: ['white', 'black'],
    gray: ['25', '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'],
    brand: ['25', '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'],
};

const Color: FunctionComponent = ({ colorName }) => {
    const cssVar = `--color-${colorName}`;
    const sassVar = `$color-${colorName}`;

    return (
        <div
            className="swatch"
            style={{
                width: '12rem',
                border: '1px solid #ddd',
                borderRadius: '0.5rem',
                overflow: 'hidden',
                marginBottom: '1rem',
            }}
        >
            <div className="top" style={{ backgroundColor: `var(${cssVar})`, height: '4rem' }}></div>
            <div
                className="bottom"
                style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.5rem' }}
            >
                <span>
                    <b>{getCssVarValue(cssVar)}</b>
                </span>

                <code>{cssVar}</code>
                <code>{sassVar}</code>
            </div>
        </div>
    );
};

export const Colors: FunctionComponent = () => {
    return (
        <>
            <h2>Colors</h2>

            <h4>Base</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {colors.base.map((clr) => {
                    return <Color colorName={`${clr}`} />;
                })}
            </div>

            <h4>Gray</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {colors.gray.map((clr) => {
                    return <Color colorName={`gray-${clr}`} />;
                })}
            </div>

            <h4>Brand</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {colors.brand.map((clr) => {
                    return <Color colorName={`brand-${clr}`} />;
                })}
            </div>
        </>
    );
};
