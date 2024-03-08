import { PHASE_METADATA } from '../../motion/animation';
import { createElement, injectStyle } from '../../util/dom';
import { DEFAULT_OVERLAY_CLASS, DEFAULT_OVERLAY_DARK_CLASS } from './overlay';

const defaultOverlayCss = `
.${DEFAULT_OVERLAY_CLASS} {
    color: #181d1f;
}

.${DEFAULT_OVERLAY_CLASS}.${DEFAULT_OVERLAY_DARK_CLASS} {
    color: #ffffff;
}

.${DEFAULT_OVERLAY_CLASS}--loading {
    color: rgb(140, 140, 140); /* DEFAULT_MUTED_LABEL_COLOUR */
}

.${DEFAULT_OVERLAY_CLASS}__loading-background {
    background: white; /* DEFAULT_BACKGROUND_FILL */
}

.${DEFAULT_OVERLAY_CLASS}.${DEFAULT_OVERLAY_DARK_CLASS} .${DEFAULT_OVERLAY_CLASS}__loading-background {
    background: #192232; /* DEFAULT_DARK_BACKGROUND_FILL */
}
`;

export function getLoadingSpinner(text: string, defaultDuration: number) {
    const { animationDuration } = PHASE_METADATA['add'];
    const duration = animationDuration * defaultDuration;

    const container = createElement('div');
    container.className = `${DEFAULT_OVERLAY_CLASS}--loading`;
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.flexDirection = 'column';
    container.style.height = '100%';
    container.style.boxSizing = 'border-box';
    container.style.font = '13px Verdana, sans-serif'; // FONT_SIZE.MEDIUM
    container.style.userSelect = 'none';
    container.style.animation = `ag-charts-loading ${duration}ms linear 50ms both`;

    const matrix = createElement('span');
    matrix.style.width = '45px';
    matrix.style.height = '40px';
    matrix.style.backgroundImage = [
        'linear-gradient(#0000 calc(1 * 100% / 6), #ccc 0 calc(3 * 100% / 6), #0000 0), ',
        'linear-gradient(#0000 calc(2 * 100% / 6), #ccc 0 calc(4 * 100% / 6), #0000 0), ',
        'linear-gradient(#0000 calc(3 * 100% / 6), #ccc 0 calc(5 * 100% / 6), #0000 0)',
    ].join('');
    matrix.style.backgroundSize = '10px 400%';
    matrix.style.backgroundRepeat = 'no-repeat';
    matrix.style.animation = 'ag-charts-loading-matrix 1s infinite linear';

    const label = createElement('p');
    label.style.marginTop = '1em';
    label.innerText = text;

    const background = createElement('div');
    background.className = `${DEFAULT_OVERLAY_CLASS}__loading-background`;
    background.style.position = 'absolute';
    background.style.inset = '0';
    background.style.opacity = '0.5';
    background.style.zIndex = '-1';

    const animationStyles = createElement('style');
    animationStyles.innerText = [
        '@keyframes ag-charts-loading { from { opacity: 0 } to { opacity: 1 } }',
        '@keyframes ag-charts-loading-matrix {',
        '0% { background-position: 0% 0%, 50% 0%, 100% 0%; }',
        '100% { background-position: 0% 100%, 50% 100%, 100% 100%; }',
        '}',
    ].join(' ');

    container.replaceChildren(animationStyles, matrix, label, background);

    injectStyle(defaultOverlayCss, 'chartOverlays');

    return container;
}
