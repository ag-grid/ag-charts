/* App icon for the fictional "Pulse Analytics" product: a gradient tile carrying a
   node-link trend — the connected nodes read as web traffic, the upward path as
   analytics — so the brand reads as a mark rather than a plain colour swatch. */
export function BrandMark() {
    return (
        <svg
            className="wa-brand-mark"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            focusable="false"
        >
            <defs>
                <linearGradient id="wa-brand-gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#5598e7" />
                    <stop offset="0.55" stopColor="#2a78d6" />
                    <stop offset="1" stopColor="#1c5cab" />
                </linearGradient>
            </defs>
            <rect width="24" height="24" rx="7" fill="url(#wa-brand-gradient)" />
            <path
                d="M6 17.2 10.6 12.2 14.6 14.6 18.4 7.4"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.85"
            />
            <circle cx="6" cy="17.2" r="1.7" fill="#ffffff" />
            <circle cx="10.6" cy="12.2" r="1.7" fill="#ffffff" />
            <circle cx="14.6" cy="14.6" r="1.7" fill="#ffffff" />
            <circle cx="18.4" cy="7.4" r="2.2" fill="#ffffff" />
        </svg>
    );
}
