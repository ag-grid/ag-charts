import ChartsDark from '@ag-website-shared/images/inline-svgs/chart-dark.svg?react';
import ChartsLight from '@ag-website-shared/images/inline-svgs/chart-light.svg?react';
import GridDark from '@ag-website-shared/images/inline-svgs/grid-dark.svg?react';
import GridLight from '@ag-website-shared/images/inline-svgs/grid-light.svg?react';
import styles from '@design-system/modules/ProductDropdown.module.scss';
import React, { useEffect, useRef, useState } from 'react';

export const Dropdown = ({ items, children }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleMenuToggle = () => {
        setIsOpen(!isOpen);
    };

    const getIconComponent = (title: any) => {
        switch (title) {
            case 'AG Charts':
                return (
                    <>
                        <ChartsLight className={styles.iconLight} />
                        <ChartsDark className={styles.iconDark} />
                    </>
                );
            case 'AG Grid':
                return (
                    <>
                        <GridLight className={styles.iconLight} /> <GridDark className={styles.iconDark} />
                    </>
                );
            default:
                return null; // Handle other cases or provide a default icon
        }
    };

    return (
        <div className={`${styles.customMenu} ${isOpen ? styles.open : ''}`}>
            <button className={`${styles.customTrigger} ${isOpen ? styles.open : ''}`} onClick={handleMenuToggle}>
                Products
                <span className={styles.arrow}></span>
            </button>
            {isOpen && (
                <div className={styles.customContent}>
                    {items.map((item, index) => (
                        <a key={index} href={item.link} className={styles.itemsWrapper}>
                            <div className={styles.placeholderIcon}>{getIconComponent(item.title)}</div>
                            <div className={styles.productsWrapper}>
                                <div className={styles.productTitle}>{item.title}</div>
                                <div className={styles.productDescription}>{item.description}</div>
                            </div>
                        </a>
                    ))}
                    {children}
                </div>
            )}
        </div>
    );
};
