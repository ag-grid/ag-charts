import type { ReactNode } from 'react';

function Icon({ children }: { children: ReactNode }) {
    return (
        <svg
            className="pc-side-action-icon"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            {children}
        </svg>
    );
}

const ACTIONS = [
    {
        label: 'Settings',
        icon: (
            <Icon>
                <circle cx="8" cy="8" r="2" />
                <path d="M8 1.5v1.75M8 12.75v1.75M1.5 8h1.75M12.75 8h1.75M3.4 3.4l1.24 1.24M11.36 11.36l1.24 1.24M3.4 12.6l1.24-1.24M11.36 4.64l1.24-1.24" />
            </Icon>
        ),
    },
    {
        label: 'Help',
        icon: (
            <Icon>
                <circle cx="8" cy="8" r="6.5" />
                <path d="M6.25 6.25a1.75 1.75 0 1 1 2.5 1.6c-.5.23-.75.6-.75 1.15v.25" />
                <circle cx="8" cy="11.5" r="0.4" fill="currentColor" />
            </Icon>
        ),
    },
    {
        label: 'Log out',
        icon: (
            <Icon>
                <path d="M6 2.5H3.5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1H6M10.5 11 13.5 8l-3-3M13.5 8H6" />
            </Icon>
        ),
    },
];

/** Account actions. Placeholders: the demo has no settings, help centre or session, so none of them act. */
export function SidebarActions() {
    return (
        <ul className="pc-side-actions" aria-label="Account">
            {ACTIONS.map(({ label, icon }) => (
                <li key={label}>
                    {/* Titled because the label beside it is hidden in the collapsed layout. */}
                    <button type="button" className="pc-side-action" title={label}>
                        {icon}
                        <span className="pc-side-action-label">{label}</span>
                    </button>
                </li>
            ))}
        </ul>
    );
}
