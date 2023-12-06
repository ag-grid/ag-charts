import type { FunctionComponent } from 'react';

import styles from './StyleGuide.module.scss';

export const Inputs: FunctionComponent = () => {
    return (
        <>
            <h2>Inputs</h2>

            <div className={styles.inputsList}>
                <div>
                    <label>Placeholder:</label>
                    <input type="text" placeholder="Enter email" />
                </div>
                <div>
                    <label>Filled:</label>
                    <input type="text" value="joe@ag-grid.com" />
                </div>
                <div>
                    <label>Hover:</label>
                    <input className="hover" type="text" value="joe@ag-grid.com" />
                </div>
                <div>
                    <label>Focused:</label>
                    <input className="focus" type="text" value="joe@ag-grid.com" />
                </div>

                <div>
                    <label>Disabled:</label>
                    <input className="disabled" type="text" value="joe@ag-grid.com" />
                </div>
            </div>
        </>
    );
};
