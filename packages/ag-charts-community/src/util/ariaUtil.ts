export function setAriaRole(e: HTMLElement, role: 'status') {
    e.setAttribute('role', role);
}

export function setAriaLive(e: HTMLElement, live: 'polite') {
    e.setAttribute('aria-live', live);
}

export function setAriaLabel(e: HTMLElement | undefined, label: string) {
    if (e) {
        if (label === '') {
            e.removeAttribute('aria-label');
        } else {
            e.setAttribute('aria-label', label);
        }
    }
}
