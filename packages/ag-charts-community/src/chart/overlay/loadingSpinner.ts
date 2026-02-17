import { AgDocument } from 'ag-charts-core';

import { PHASE_METADATA } from '../../motion/animation';
import { DEFAULT_OVERLAY_CLASS } from './overlay';

export function getLoadingSpinner(agDocument: AgDocument, text: string, defaultDuration: number) {
    const { animationDuration } = PHASE_METADATA['add'];
    const duration = animationDuration * defaultDuration;

    const container = agDocument.createElement('div', `${DEFAULT_OVERLAY_CLASS}--loading`, {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        height: '100%',
        boxSizing: 'border-box',
        font: '13px Verdana, sans-serif', // FONT_SIZE.MEDIUM
        userSelect: 'none',
        animation: `ag-charts-loading ${duration}ms linear 50ms both`,
    });

    const matrix = agDocument.createElement('span', {
        width: '45px',
        height: '40px',
        backgroundImage: [
            'linear-gradient(#0000 calc(1 * 100% / 6), #ccc 0 calc(3 * 100% / 6), #0000 0), ',
            'linear-gradient(#0000 calc(2 * 100% / 6), #ccc 0 calc(4 * 100% / 6), #0000 0), ',
            'linear-gradient(#0000 calc(3 * 100% / 6), #ccc 0 calc(5 * 100% / 6), #0000 0)',
        ].join(''),
        backgroundSize: '10px 400%',
        backgroundRepeat: 'no-repeat',
        animation: 'ag-charts-loading-matrix 1s infinite linear',
    });

    const label = agDocument.createElement('p', { marginTop: '1em' });
    label.innerText = text;

    const background = agDocument.createElement('div', `${DEFAULT_OVERLAY_CLASS}__loading-background`, {
        position: 'absolute',
        inset: '0',
        opacity: '0.5',
        zIndex: '-1',
    });

    const animationStyles = agDocument.createElement('style');
    animationStyles.innerText = [
        '@keyframes ag-charts-loading { from { opacity: 0 } to { opacity: 1 } }',
        '@keyframes ag-charts-loading-matrix {',
        '0% { background-position: 0% 0%, 50% 0%, 100% 0%; }',
        '100% { background-position: 0% 100%, 50% 100%, 100% 100%; }',
        '}',
    ].join(' ');

    container.replaceChildren(animationStyles, matrix, label, background);

    return container;
}
