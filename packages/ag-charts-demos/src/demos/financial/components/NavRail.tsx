import { type ReactNode } from 'react';

// One line glyph per section. All stroke-only on `currentColor`, so an icon inherits
// whatever state colour its rail item is in.
function Glyph({ children }: { children: ReactNode }) {
    return (
        <svg
            className="fin-rail-icon"
            width="19"
            height="19"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            {children}
        </svg>
    );
}

const MarketsIcon = () => (
    <Glyph>
        <path d="M2.75 13.25V9.5M6.25 13.25V3.75M9.75 13.25V7M13.25 13.25V5.25" />
    </Glyph>
);

const WatchlistsIcon = () => (
    <Glyph>
        <path d="M6 4.25h7.25M6 8h7.25M6 11.75h7.25M2.75 4.25h.01M2.75 8h.01M2.75 11.75h.01" />
    </Glyph>
);

const OrdersIcon = () => (
    <Glyph>
        <path d="M6 2.75H3.75v10.5h8.5V2.75H10M6 2.75a2 2 0 0 1 4 0M6 7.5h4M6 10.5h4" />
    </Glyph>
);

const PositionsIcon = () => (
    <Glyph>
        <path d="M8 2.5 14 6l-6 3.5L2 6l6-3.5M2 10l6 3.5L14 10" />
    </Glyph>
);

const HistoryIcon = () => (
    <Glyph>
        <circle cx="8" cy="8" r="5.5" />
        <path d="M8 4.75V8l2.5 1.5" />
    </Glyph>
);

// Product sections a real dealing platform would carry. Inert in the demo — they exist
// so the app reads as a platform rather than a chart harness, and the active one is the
// section the demo actually shows.
const SECTIONS = [
    { label: 'Markets', Icon: MarketsIcon },
    { label: 'Watchlists', Icon: WatchlistsIcon },
    { label: 'Orders', Icon: OrdersIcon },
    { label: 'Positions', Icon: PositionsIcon },
    { label: 'History', Icon: HistoryIcon },
];
const ACTIVE_SECTION = 'Markets';

/** The far-left icon rail: the platform's top-level sections, stacked. */
export function NavRail() {
    return (
        <nav className="fin-rail" aria-label="Sections">
            {SECTIONS.map(({ label, Icon }) => (
                <button
                    key={label}
                    type="button"
                    className="fin-rail-item"
                    data-active={label === ACTIVE_SECTION}
                    aria-current={label === ACTIVE_SECTION ? 'page' : undefined}
                >
                    <Icon />
                    <span className="fin-rail-label">{label}</span>
                </button>
            ))}
        </nav>
    );
}
