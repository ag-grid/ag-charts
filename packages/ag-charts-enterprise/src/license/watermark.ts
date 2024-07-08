import { _ModuleSupport } from 'ag-charts-community';

const { createElement } = _ModuleSupport;

export function injectWatermark(domManager: _ModuleSupport.DOMManager, text: string) {
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
