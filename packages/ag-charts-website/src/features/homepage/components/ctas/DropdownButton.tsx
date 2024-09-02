import { Icon } from '@ag-website-shared/components/icon/Icon';
import fwLogos from '@ag-website-shared/images/fw-logos';
import React, { useEffect, useRef, useState } from 'react';

import styles from './DropdownButton.module.scss';

const DropdownButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className={styles.ctaContainer} ref={dropdownRef}>
            <button
                aria-label="Get Started with Free JavaScript Charts"
                className={styles.dropdownButton}
                onClick={() => (window.location.href = './charts/javascript/quick-start')}
            >
                Get Started
            </button>
            {/* <button className={styles.arrow} onClick={toggleDropdown}>
                <Icon svgClasses={styles.expandIcon} name={!isOpen ? 'chevronDown' : 'chevronRight'} />
            </button> */}
            <button className={styles.frameworkButton}>
                <img className={styles.frameworkLogo} src={fwLogos['javascript']} alt={'alt'} />
            </button>
            <button className={styles.frameworkButton}>
                <img className={styles.frameworkLogo} src={fwLogos['react']} alt={'alt'} />
            </button>
            <button className={styles.frameworkButton}>
                <img className={styles.frameworkLogo} src={fwLogos['angular']} alt={'alt'} />
            </button>
            <button className={styles.frameworkButton}>
                <img className={styles.frameworkLogo} src={fwLogos['vue']} alt={'alt'} />
            </button>
            {isOpen && (
                <div className={styles.dropdownMenu}>
                    <button className={styles.imageButton}>
                        <img className={styles.image} src={fwLogos['react']} alt={'alt'} />
                        <span className={styles.text}>React</span>
                    </button>
                    <button className={styles.imageButton}>
                        <img className={styles.image} src={fwLogos['angular']} alt={'alt'} />
                        <span className={styles.text}>Angular</span>
                    </button>
                    <button className={styles.imageButton}>
                        <img className={styles.image} src={fwLogos['vue']} alt={'alt'} />
                        <span className={styles.text}>Vue3</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default DropdownButton;
