import type { FunctionComponent } from 'react';

import styles from './StyleGuide.module.scss';

export const Buttons: FunctionComponent = () => {
    return (
        <>
            <h2>Buttons</h2>

            <div className={styles.buttonExamples}>
                <label>Default: </label>
                <button>Primary</button>
                <button className="button-secondary">Secondary</button>
                <button className="button-tertiary">Tertiary</button>
            </div>

            <div className={styles.buttonExamples}>
                <label>Hover: </label>
                <button className="hover">Primary</button>
                <button className="button-secondary hover">Secondary</button>
                <button className="button-tertiary hover">Tertiary</button>
            </div>

            <div className={styles.buttonExamples}>
                <label>Focus: </label>
                <button className="focus">Primary</button>
                <button className="button-secondary focus">Secondary</button>
                <button className="button-tertiary focus">Tertiary</button>
            </div>

            <div className={styles.buttonExamples}>
                <label>Disabled: </label>
                <button disabled>Primary</button>
                <button className="button-secondary" disabled>
                    Secondary
                </button>
                <button className="button-tertiary" disabled>
                    Tertiary
                </button>
            </div>
        </>
    );
};
