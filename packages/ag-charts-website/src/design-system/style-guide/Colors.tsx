import type { FunctionComponent } from 'react';

import styles from './StyleGuide.module.scss';
import { getCssVarValue } from './getCssVarValue';

const colors = {
    base: ['white', 'black'],
    gray: ['25', '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'],
    brand: ['25', '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'],
};

const Color: FunctionComponent = ({ colorName }) => {
    const cssVar = `--color-${colorName}`;

    return (
        <div className={styles.swatch}>
            <div className={styles.swatchTop} style={{ backgroundColor: `var(${cssVar})` }}></div>
            <div className={styles.swatchBottom}>
                <span>
                    <b>{getCssVarValue(cssVar)}</b>
                </span>

                <code>{cssVar}</code>
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
                    return <Color key={clr} colorName={`${clr}`} />;
                })}
            </div>

            <h4>Gray</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {colors.gray.map((clr) => {
                    return <Color key={`gray-${clr}`} colorName={`gray-${clr}`} />;
                })}
            </div>

            <h4>Brand</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {colors.brand.map((clr) => {
                    return <Color key={`brand-${clr}`} colorName={`brand-${clr}`} />;
                })}
            </div>
        </>
    );
};
