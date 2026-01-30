import type { _ModuleSupport } from 'ag-charts-community';

export function injectWatermark(domManager: _ModuleSupport.DOMManager, text: string) {
    const element = domManager.addChild('canvas-overlay', 'watermark');
    const textElement = domManager.getDocument().createElement('span');
    textElement.innerText = text;
    element.addEventListener('animationend', () => {
        domManager.removeChild('canvas-overlay', 'watermark');
        domManager.removeStyles('watermark');
    });
    element.classList.add('ag-watermark');
    element.appendChild(textElement);
}
