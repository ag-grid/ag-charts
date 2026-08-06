import { useEffect, useState } from 'react';

import { fmtTime } from '../format';

// Dummy brand mark — an upward "candlestick" glyph for the trading app.
function BrandLogo() {
    return (
        <svg
            className="fin-brand-logo"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
            focusable="false"
        >
            <rect x="1" y="1" width="18" height="18" rx="4" fill="currentColor" opacity="0.15" />
            <path
                d="M4 14L8 9L12 12L16 5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx="16" cy="5" r="1.75" fill="currentColor" />
        </svg>
    );
}

function useClock() {
    const [clock, setClock] = useState(() => Date.now());
    useEffect(() => {
        const id = window.setInterval(() => setClock(Date.now()), 1000);
        return () => window.clearInterval(id);
    }, []);
    return clock;
}

export function Toolbar() {
    const clock = useClock();

    return (
        <div className="fin-toolbar">
            <span className="fin-brand">
                <BrandLogo />
                AG Trade
            </span>

            <div className="fin-toolbar-spacer" />

            <span className="fin-clock">{fmtTime(clock)}</span>
        </div>
    );
}
