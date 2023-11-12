import classNames from 'classnames';
import React, { forwardRef, useImperativeHandle, useState } from 'react';

import { SITE_BASE_URL, SITE_URL } from '../../constants';
import styles from './ChevronButtonRenderer.module.scss';

const TreeClosed = `${SITE_URL}${SITE_BASE_URL ?? ''}/theme-icons/alpine/tree-closed.svg`;

const IS_SSR = typeof window === 'undefined';

const ChevronButtonCellRenderer = forwardRef((props, ref) => {
    let [isExpanded, setIsExpanded] = useState(props && props.node && props.node.expanded);

    function clickHandler() {
        props.api.setRowNodeExpanded(props.node, !props.node.expanded);
        setIsExpanded(props.node.expanded);
    }

    useImperativeHandle(ref, () => {
        return {
            clickHandlerFunc: clickHandler,
        };
    });

    if (IS_SSR) {
        return null;
    } else {
        return (
            <div className={styles.container}>
                <div className={classNames(styles.chevronContainer, isExpanded ? styles.isExpanded : undefined)}>
                    <input
                        type="image"
                        className={styles.chevronImage}
                        alt={'chevron to toggle showing more information'}
                        ref={ref}
                        src={TreeClosed}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                            clickHandler();
                        }}
                    ></input>
                </div>
                <span>{props.value}</span>
            </div>
        );
    }
});

export default ChevronButtonCellRenderer;
