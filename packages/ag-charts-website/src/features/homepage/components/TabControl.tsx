import React, { useState } from 'react';

import styles from './TabControl.module.scss';

export const TabControl: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);

    return (
        <div className={styles.tabContainer}>
            <div className={styles.tabButtons}>
                <button
                    className={`${styles.tabButton} ${activeTab === 0 ? styles.active : ''}`}
                    onClick={() => setActiveTab(0)}
                >
                    Advanced Features
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === 1 ? styles.active : ''}`}
                    onClick={() => setActiveTab(1)}
                >
                    Additional Series
                </button>
            </div>
            <div className={styles.tabContent}>
                {activeTab === 0 ? (
                    <div>
                        <h4>Advanced Features Content</h4>
                        <p>Here you can add content about advanced features...</p>
                    </div>
                ) : (
                    <div>
                        <h4>Additional Series Content</h4>
                        <p>Here you can add content about additional series types...</p>
                    </div>
                )}
            </div>
        </div>
    );
};
