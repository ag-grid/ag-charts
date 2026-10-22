/** Where a chart sits in `container`: in a shadow root of its own, directly in the container, or nowhere. */
export function locateChartWrapper(container: HTMLElement): 'shadow-root' | 'light-dom' | 'missing' {
    if (container.firstElementChild?.shadowRoot?.querySelector('.ag-charts-wrapper') != null) return 'shadow-root';
    return container.querySelector(':scope > .ag-charts-wrapper') == null ? 'missing' : 'light-dom';
}
