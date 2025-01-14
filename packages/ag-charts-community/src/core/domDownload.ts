import { createElement } from './domElements';
import { getDocument } from './globalsProxy';

/**
 * Triggers a download for a given data URL and file name.
 * @param dataUrl - The data URL of the file to download.
 * @param fileName - The name of the file to be saved.
 */
export function downloadUrl(dataUrl: string, fileName: string) {
    const body = getDocument('body');
    const element = createElement('a', { display: 'none' });
    element.href = dataUrl;
    element.download = fileName;
    body.appendChild(element);
    element.click();
    setTimeout(() => body.removeChild(element));
}
