import { _ModuleSupport } from 'ag-charts-community';

import watermarkStyles from './watermark.css';

const { createElement } = _ModuleSupport;

export function injectWatermark(domManager: _ModuleSupport.DOMManager, text: string) {
    domManager.addStyles('watermark', watermarkStyles);
    const element = domManager.addChild('canvas-overlay', 'watermark');
    const textElement = createElement('span');
    textElement.innerText = text;
    element.addEventListener('animationend', () => {
        domManager.removeChild('canvas-overlay', 'watermark');
        domManager.removeStyles('watermark');
    });
    element.classList.add('ag-watermark');
    element.appendChild(textElement);
}
