/*
 * Demo page stage behaviour: each demo card is a "preview → launch" stage,
 * non-interactive until clicked, then expanded to fill the viewport. Externalised
 * from an Astro <script> so the site Content-Security-Policy can drop script-src
 * 'unsafe-inline' — Astro inlines a hoisted script this small into the HTML rather
 * than emitting a bundle, which the enforced 'site' policy blocks. Static, served
 * from 'self'. Wrapped in an IIFE to avoid leaking into global scope.
 *
 * Each transition fires a resize event, which is what an embedded demo listens to
 * in order to refit.
 *
 * Transitions must not transform the stage: a demo that sizes itself in layout pixels from
 * this container's measured width bakes a scale in flight into its own layout.
 * Animate opacity only.
 *
 * The loading <script> carries data-astro-rerun, so this re-runs on every client-side swap
 * against the incoming stage. Everything here must therefore be safe to run repeatedly:
 * page-level listeners hang off an AbortController the swap aborts, so successive runs
 * neither stack up nor keep the swapped-out stage alive.
 */
(function () {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pageListeners = new AbortController();
    const { signal } = pageListeners;

    document.addEventListener(
        'astro:before-swap',
        () => {
            pageListeners.abort();
            // An expanded stage locks page scrolling, and nothing else unlocks it once the
            // body it belonged to has been swapped out.
            if (document.querySelector('[data-demo-stage][data-expanded="true"]')) {
                document.documentElement.style.overflow = '';
            }
        },
        { once: true }
    );

    document.querySelectorAll('[data-demo-stage]').forEach((stage) => {
        const viewport = stage.querySelector('[data-stage-viewport]');
        const activate = stage.querySelector('[data-stage-activate]');
        const minimise = stage.querySelector('[data-stage-minimise]');
        const card = stage.parentElement;
        const demoPage = card ? card.parentElement : null;
        if (!viewport || !activate || !minimise || !card || !demoPage) {
            return;
        }

        let expanded = false;
        let cutOff = true;
        const fireResize = () => window.dispatchEvent(new Event('resize'));

        // Measured live rather than assumed, so it stays correct whether or not the
        // announcement banner is showing.
        const positionBelowHeader = () => {
            const header = document.querySelector('.site-header');
            const top = header ? Math.max(0, Math.round(header.getBoundingClientRect().bottom)) : 0;
            stage.style.setProperty('--stage-top', `${top}px`);
        };

        // The CSS fallback for --demo-height can't account for the announcement banner,
        // which would push the page's bottom padding off-screen.
        const fitPageHeight = () => {
            const available = Math.max(0, Math.round(window.innerHeight - demoPage.getBoundingClientRect().top));
            demoPage.style.setProperty('--demo-height', `${available}px`);
        };

        // Interaction is gated only while the demo is clipped; when it all fits it is
        // live inline.
        const applyMode = () => {
            stage.dataset.cutoff = cutOff ? 'true' : 'false';
            if (cutOff && !expanded) {
                viewport.setAttribute('inert', '');
            } else {
                viewport.removeAttribute('inert');
            }
        };

        const updateCutOff = () => {
            if (expanded) {
                return;
            }
            // Compare against the width the card has *inside* the gutters, backing out the
            // bleed CSS applies while cut off. Measuring the bled width would let the bleed
            // flip the state that applies it, oscillating across a band of viewport widths
            // one gutter wide.
            const bleed = Math.max(0, -(parseFloat(getComputedStyle(card).marginRight) || 0));
            const naturalWidth = card.getBoundingClientRect().width - bleed;
            const held = parseFloat(getComputedStyle(viewport).minWidth) || 0;
            cutOff = naturalWidth + 1 < held;
            applyMode();
        };

        const open = () => {
            if (expanded || !cutOff) {
                return;
            }
            expanded = true;
            positionBelowHeader();
            document.documentElement.style.overflow = 'hidden';
            stage.dataset.expanded = 'true';
            applyMode();
            fireResize();
            if (!prefersReducedMotion) {
                stage.animate([{ opacity: 0.4 }, { opacity: 1 }], {
                    duration: 260,
                    easing: 'cubic-bezier(0.2, 0, 0, 1)',
                });
            }
            // preventScroll: focusing would otherwise scroll the control into view and move
            // the page under the stage.
            minimise.focus({ preventScroll: true });
        };

        const settleClosed = () => {
            stage.dataset.expanded = 'false';
            document.documentElement.style.overflow = '';
            updateCutOff();
            fireResize();
            if (cutOff) {
                activate.focus({ preventScroll: true });
            }
        };

        const close = () => {
            if (!expanded) {
                return;
            }
            expanded = false;
            if (prefersReducedMotion) {
                settleClosed();
                return;
            }
            const animation = stage.animate([{ opacity: 1 }, { opacity: 0.4 }], {
                duration: 180,
                easing: 'cubic-bezier(0.4, 0, 1, 1)',
            });
            animation.onfinish = settleClosed;
            animation.oncancel = settleClosed;
        };

        activate.addEventListener('click', open, { signal });
        minimise.addEventListener('click', close, { signal });
        document.addEventListener(
            'keydown',
            (event) => {
                if (event.key === 'Escape' && expanded) {
                    close();
                }
            },
            { signal }
        );
        window.addEventListener(
            'resize',
            () => {
                fitPageHeight();
                if (expanded) {
                    positionBelowHeader();
                } else {
                    updateCutOff();
                }
            },
            { signal }
        );

        // The banner is dismissible, which changes the page's top offset.
        const banner = document.querySelector('[data-announcement-banner]');
        if (banner && typeof ResizeObserver !== 'undefined') {
            const bannerObserver = new ResizeObserver(() => {
                fitPageHeight();
                if (!expanded) {
                    updateCutOff();
                }
            });
            bannerObserver.observe(banner);
            signal.addEventListener('abort', () => bannerObserver.disconnect(), { once: true });
        }

        fitPageHeight();
        updateCutOff();
    });
})();
