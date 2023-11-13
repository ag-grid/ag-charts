import React, { forwardRef } from 'react';

import { SITE_BASE_URL, SITE_URL } from '../../constants';

const IS_SSR = typeof window === 'undefined';

const bugIcon = `${SITE_URL}${SITE_BASE_URL ?? ''}images/issue-type-icons/bug-icon.svg`;
const taskIcon = `${SITE_URL}${SITE_BASE_URL ?? ''}images/issue-type-icons/task-icon.svg`;

const PaddingCellRenderer = forwardRef((props, ref) => {
    const icon = props.valueFormatted === 'Defect' ? bugIcon : taskIcon;

    return (
        <>
            {!IS_SSR && (
                <div ref={ref} style={{ fontSize: '15px', display: 'flex', alignContent: 'center' }}>
                    <img style={{ display: 'flex', paddingRight: '5px' }} alt={'issue type icon'} src={icon}></img>
                    <span style={{ display: 'flex' }}>{props.valueFormatted}</span>
                </div>
            )}
        </>
    );
});

export default PaddingCellRenderer;
