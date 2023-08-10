export function smoothScrollIntoView(selector: string) {
    document.querySelector(selector)?.scrollIntoView({
        behavior: 'smooth',
    });
}
