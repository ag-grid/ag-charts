import { Component } from '@angular/core';

/* App icon for the fictional "Pulse Analytics" product: a gradient tile carrying a
   node-link trend — the connected nodes read as web traffic, the upward path as
   analytics — so the brand reads as a mark rather than a plain colour swatch. */
@Component({
    selector: 'svg[waBrandMark]',
    host: {
        class: 'wa-brand-mark',
        width: '24',
        height: '24',
        viewBox: '0 0 24 24',
        fill: 'none',
        'aria-hidden': 'true',
        focusable: 'false',
    },
    // The host is the `<svg>`, so the children take the `svg:` prefix to stay in its namespace.
    template: `
        <svg:defs>
            <svg:linearGradient id="wa-brand-gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <svg:stop offset="0" stop-color="#5598e7" />
                <svg:stop offset="0.55" stop-color="#2a78d6" />
                <svg:stop offset="1" stop-color="#1c5cab" />
            </svg:linearGradient>
        </svg:defs>
        <svg:rect width="24" height="24" rx="7" fill="url(#wa-brand-gradient)" />
        <svg:path
            d="M6 17.2 10.6 12.2 14.6 14.6 18.4 7.4"
            stroke="#ffffff"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.85"
        />
        <svg:circle cx="6" cy="17.2" r="1.7" fill="#ffffff" />
        <svg:circle cx="10.6" cy="12.2" r="1.7" fill="#ffffff" />
        <svg:circle cx="14.6" cy="14.6" r="1.7" fill="#ffffff" />
        <svg:circle cx="18.4" cy="7.4" r="2.2" fill="#ffffff" />
    `,
})
export class BrandMark {}
