export function onContentLoaded(handler: CallableFunction) {
    if (typeof document === 'undefined' || document.readyState === 'complete') {
        handler();
    } else {
        window.addEventListener('DOMContentLoaded', () => handler());
    }
}
