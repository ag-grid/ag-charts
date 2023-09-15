export function onContentLoaded(handler: CallableFunction) {
    if (document.readyState === 'complete') {
        handler();
    } else {
        window.addEventListener('DOMContentLoaded', () => handler());
    }
}
