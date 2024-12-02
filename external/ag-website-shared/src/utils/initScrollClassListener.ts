interface Params {
    /**
     * Target to update the css class on
     *
     * eg, `.site-header`
     */
    targetSelector: string;
    /**
     * CSS class to add/remove
     *
     * eg, `header-scrolled`
     */
    scrolledClass: string;
    /**
     * Vertical scroll position to trigger class change
     */
    scrollPosition: number;
}

function updateScrolledClass({ targetSelector, scrolledClass, scrollPosition }: Params) {
    const siteHeaderElement = document.querySelector(targetSelector);
    const windowScrollPosition = window.scrollY || document.documentElement.scrollTop;

    if (windowScrollPosition >= scrollPosition) {
        siteHeaderElement?.classList.add(scrolledClass);
    } else {
        siteHeaderElement?.classList.remove(scrolledClass);
    }
}

/**
 * Add a css class to a target element once vertically scrolled past a scroll position.
 *
 * If scrolled before the scroll position, remove the class
 */
export function initScrollClassListener(params: Params) {
    window.addEventListener('scroll', () => {
        updateScrolledClass(params);
    });

    updateScrolledClass(params);
}
